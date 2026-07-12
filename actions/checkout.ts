"use server";

import { cookies } from "next/headers";
import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { auth } from "@/auth";
import {
  calculateCheckoutTotals,
  normalizePaymentMethod,
  normalizeShippingMethod,
  paymentMethods,
} from "@/lib/checkout";
import { sendOrderConfirmationEmail } from "@/lib/email";
import { appUrl, createMercadoPagoPreference } from "@/lib/mercadopago";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";

const cartCookieName = "erclav_cart_id";

const checkoutSchema = z.object({
  firstName: z.string().trim().min(2),
  lastName: z.string().trim().min(2),
  phone: z.string().trim().min(6),
  street: z.string().trim().min(2),
  number: z.string().trim().optional(),
  apartment: z.string().trim().optional(),
  city: z.string().trim().min(2),
  province: z.string().trim().min(2),
  postalCode: z.string().trim().min(3),
  country: z.string().trim().default("AR"),
  notes: z.string().trim().optional(),
  couponCode: z.string().trim().optional(),
  shippingMethod: z.string().trim().optional(),
  paymentMethod: z.string().trim().optional(),
});

function orderNumber() {
  const date = new Date();
  const stamp = date.toISOString().slice(0, 10).replaceAll("-", "");
  return `ER-${stamp}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

async function getActiveCart() {
  const cookieStore = await cookies();
  const cartId = cookieStore.get(cartCookieName)?.value;
  if (!cartId) return null;

  return prisma.cart.findFirst({
    where: { id: cartId, status: "ACTIVE" },
    include: {
      items: {
        include: {
          variant: {
            include: {
              stock: true,
              product: true,
            },
          },
        },
      },
    },
  });
}

async function createMercadoPagoPreferenceForOrder(orderNumber: string) {
  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: {
      user: true,
      items: true,
    },
  });

  if (!order) throw new Error("Orden no encontrada.");

  const baseUrl = appUrl();
  const preference = await createMercadoPagoPreference({
    items: order.items.map((item) => ({
      id: item.variantSku,
      title: item.productName,
      quantity: item.quantity,
      unit_price: Number(item.unitPrice),
      currency_id: order.currency,
    })),
    payer: {
      email: order.user.email,
      name: order.user.firstName,
      surname: order.user.lastName,
    },
    shipments: {
      cost: Number(order.shippingTotal),
      mode: "not_specified",
    },
    back_urls: {
      success: `${baseUrl}/checkout/confirmacion/${order.orderNumber}`,
      failure: `${baseUrl}/checkout/confirmacion/${order.orderNumber}?payment=failure`,
      pending: `${baseUrl}/checkout/confirmacion/${order.orderNumber}?payment=pending`,
    },
    auto_return: "approved",
    notification_url: `${baseUrl}/api/webhooks/mercadopago`,
    external_reference: order.orderNumber,
    statement_descriptor: "ERCLAV",
    metadata: {
      order_id: order.id,
      order_number: order.orderNumber,
    },
  });

  await prisma.$transaction([
    prisma.order.update({
      where: { id: order.id },
      data: {
        paymentProvider: "mercado_pago",
        paymentPreferenceId: preference.id,
        paymentStatus: "PENDING",
      },
    }),
    prisma.paymentAttempt.create({
      data: {
        orderId: order.id,
        provider: "mercado_pago",
        preferenceId: preference.id,
        status: "preference_created",
        initPoint: preference.init_point,
        sandboxInitPoint: preference.sandbox_init_point,
        rawResponse: preference,
      },
    }),
  ]);

  return preference.init_point ?? preference.sandbox_init_point;
}

async function reserveStockForOrder(orderId: string, userId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          variant: { include: { stock: true } },
        },
      },
    },
  });

  if (!order) return;

  for (const item of order.items) {
    const previousReserved = item.variant.stock?.reservedQuantity ?? 0;
    await prisma.stock.upsert({
      where: { variantId: item.variantId },
      update: { reservedQuantity: { increment: item.quantity } },
      create: { variantId: item.variantId, quantity: 0, reservedQuantity: item.quantity },
    });
    await prisma.stockMovement.create({
      data: {
        variantId: item.variantId,
        userId,
        orderId,
        type: "RESERVATION",
        quantity: item.quantity,
        previousQty: previousReserved,
        newQty: previousReserved + item.quantity,
        reason: "Reserva para Mercado Pago",
        reference: order.orderNumber,
      },
    });
  }
}

export async function createOrderAction(formData: FormData) {
  if (!(await checkRateLimit("checkout:create-order", { limit: 10, windowMs: 10 * 60 * 1000 })).allowed) redirect("/checkout?error=rate");
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  const parsed = checkoutSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/checkout?error=datos");

  const cart = await getActiveCart();
  if (!cart?.items.length) redirect("/checkout?error=carrito");

  const shippingMethod = normalizeShippingMethod(parsed.data.shippingMethod);
  const paymentMethod = normalizePaymentMethod(parsed.data.paymentMethod);
  const couponCode = parsed.data.couponCode?.toUpperCase();
  const coupon = couponCode
    ? await prisma.coupon.findUnique({ where: { code: couponCode } })
    : null;

  const subtotal = cart.items.reduce((sum, item) => sum + Number(item.unitPrice) * item.quantity, 0);
  const totals = calculateCheckoutTotals({ subtotal, coupon, shippingMethod });
  const number = orderNumber();

  for (const item of cart.items) {
    const available = (item.variant.stock?.quantity ?? 0) - (item.variant.stock?.reservedQuantity ?? 0);
    if (available < item.quantity) redirect("/checkout?error=stock");
  }

  const shippingAddressSnapshot = {
    firstName: parsed.data.firstName,
    lastName: parsed.data.lastName,
    phone: parsed.data.phone,
    street: parsed.data.street,
    number: parsed.data.number,
    apartment: parsed.data.apartment,
    city: parsed.data.city,
    province: parsed.data.province,
    postalCode: parsed.data.postalCode,
    country: parsed.data.country,
  };

  const createdOrder = await prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        orderNumber: number,
        userId: session.user.id,
        couponId: coupon?.id,
        status: "PENDING",
        paymentStatus: "PENDING",
        paymentProvider: paymentMethod === "mercado_pago" ? "mercado_pago" : paymentMethod,
        subtotal: totals.subtotal,
        discountTotal: totals.discount,
        shippingTotal: totals.shipping,
        taxTotal: totals.tax,
        total: totals.total,
        currency: "ARS",
        shippingAddressSnapshot,
        billingAddressSnapshot: shippingAddressSnapshot,
        paymentMethodSnapshot: {
          provider: paymentMethod,
          label: paymentMethods[paymentMethod],
        },
        notes: parsed.data.notes,
        items: {
          create: cart.items.map((item) => ({
            variantId: item.variantId,
            productName: item.variant.product.name,
            variantSku: item.variant.sku,
            color: item.variant.color,
            size: item.variant.size,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: Number(item.unitPrice) * item.quantity,
          })),
        },
      },
    });

    if (paymentMethod !== "mercado_pago" && paymentMethod !== "stripe") {
      for (const item of cart.items) {
        const previousQty = item.variant.stock?.quantity ?? 0;
        const newQty = previousQty - item.quantity;

        await tx.stock.upsert({
          where: { variantId: item.variantId },
          update: { quantity: newQty },
          create: { variantId: item.variantId, quantity: newQty },
        });

        await tx.stockMovement.create({
          data: {
            variantId: item.variantId,
            userId: session.user.id,
            orderId: order.id,
            type: "SALE",
            quantity: -item.quantity,
            previousQty,
            newQty,
            reason: "Venta desde checkout",
            reference: order.orderNumber,
          },
        });
      }
    }

    if (coupon) {
      await tx.coupon.update({
        where: { id: coupon.id },
        data: { usageCount: { increment: 1 } },
      });
    }

    await tx.address.create({
      data: {
        userId: session.user.id,
        type: "SHIPPING",
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
        phone: parsed.data.phone,
        street: parsed.data.street,
        number: parsed.data.number,
        apartment: parsed.data.apartment,
        city: parsed.data.city,
        province: parsed.data.province,
        postalCode: parsed.data.postalCode,
        country: parsed.data.country,
        isDefault: false,
      },
    });

    await tx.cart.update({
      where: { id: cart.id },
      data: { status: "CONVERTED" },
    });

    return order;
  });

  await sendOrderConfirmationEmail(createdOrder.id);
  revalidateTag("products");

  const cookieStore = await cookies();
  cookieStore.delete(cartCookieName);

  if (paymentMethod === "mercado_pago" || paymentMethod === "stripe") {
    const order = await prisma.order.findUnique({ where: { orderNumber: number } });
    if (!order) redirect("/checkout?error=payment");
    await reserveStockForOrder(order.id, session.user.id);

    if (paymentMethod === "stripe") {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentProvider: "stripe",
          paymentStatus: "PENDING",
        },
      });
      redirect(`/checkout/stripe/${number}`);
    }

    let initPoint: string | undefined;
    try {
      initPoint = await createMercadoPagoPreferenceForOrder(number);
    } catch (error) {
      await prisma.paymentAttempt.create({
        data: {
          orderId: order.id,
          provider: "mercado_pago",
          status: "preference_error",
          errorMessage: error instanceof Error ? error.message : "Error desconocido al crear preferencia.",
        },
      });
      redirect(`/checkout/confirmacion/${number}?payment=error`);
    }
    if (initPoint) redirect(initPoint);
  }

  redirect(`/checkout/confirmacion/${number}`);
}

export async function retryMercadoPagoPaymentAction(orderNumber: string) {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  const order = await prisma.order.findFirst({
    where: {
      orderNumber,
      userId: session.user.id,
      paymentProvider: "mercado_pago",
      paymentStatus: { in: ["PENDING", "FAILED", "CANCELLED"] },
    },
  });

  if (!order) redirect(`/checkout/confirmacion/${orderNumber}`);

  let initPoint: string | undefined;
  try {
    if (order.paymentStatus === "FAILED" || order.paymentStatus === "CANCELLED") {
      await reserveStockForOrder(order.id, session.user.id);
    }
    initPoint = await createMercadoPagoPreferenceForOrder(order.orderNumber);
  } catch (error) {
    await prisma.paymentAttempt.create({
      data: {
        orderId: order.id,
        provider: "mercado_pago",
        status: "preference_retry_error",
        errorMessage: error instanceof Error ? error.message : "Error desconocido al reintentar pago.",
      },
    });
  }

  if (initPoint) redirect(initPoint);
  redirect(`/checkout/confirmacion/${orderNumber}?payment=retry-error`);
}

export async function retryStripePaymentAction(orderNumber: string) {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  const order = await prisma.order.findFirst({
    where: {
      orderNumber,
      userId: session.user.id,
      paymentProvider: "stripe",
      paymentStatus: { in: ["PENDING", "FAILED", "CANCELLED"] },
    },
  });

  if (!order) redirect(`/checkout/confirmacion/${orderNumber}`);

  if (order.paymentStatus === "FAILED" || order.paymentStatus === "CANCELLED") {
    await reserveStockForOrder(order.id, session.user.id);
  }

  redirect(`/checkout/stripe/${order.orderNumber}`);
}
