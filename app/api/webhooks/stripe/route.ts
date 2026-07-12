import { NextResponse, type NextRequest } from "next/server";
import { revalidateTag } from "next/cache";
import type { Prisma } from "@prisma/client";
import type Stripe from "stripe";

import { sendInvoiceEmail, sendOrderCancelledEmail, sendOrderStatusEmail } from "@/lib/email";
import { fromStripeStatus, stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function jsonValue(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

async function releaseReservation(orderId: string, reason: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { variant: { include: { stock: true } } } } },
  });
  if (!order) return;

  for (const item of order.items) {
    const previousReserved = item.variant.stock?.reservedQuantity ?? 0;
    const releaseQty = Math.min(previousReserved, item.quantity);
    if (releaseQty <= 0) continue;

    await prisma.stock.update({
      where: { variantId: item.variantId },
      data: { reservedQuantity: { decrement: releaseQty } },
    });
    await prisma.stockMovement.create({
      data: {
        variantId: item.variantId,
        orderId,
        type: "RELEASE",
        quantity: -releaseQty,
        previousQty: previousReserved,
        newQty: previousReserved - releaseQty,
        reason,
        reference: order.orderNumber,
      },
    });
  }
}

async function confirmReservedStock(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { variant: { include: { stock: true } } } } },
  });
  if (!order) return;

  for (const item of order.items) {
    const previousQty = item.variant.stock?.quantity ?? 0;
    const previousReserved = item.variant.stock?.reservedQuantity ?? 0;
    const releaseQty = Math.min(previousReserved, item.quantity);
    const newQty = previousQty - item.quantity;

    await prisma.stock.update({
      where: { variantId: item.variantId },
      data: {
        quantity: newQty,
        reservedQuantity: { decrement: releaseQty },
      },
    });
    await prisma.stockMovement.create({
      data: {
        variantId: item.variantId,
        orderId,
        type: "SALE",
        quantity: -item.quantity,
        previousQty,
        newQty,
        reason: "Pago aprobado en Stripe",
        reference: order.orderNumber,
      },
    });
  }
}

async function handlePaymentIntent(paymentIntent: Stripe.PaymentIntent) {
  const orderNumber = paymentIntent.metadata.order_number;
  if (!orderNumber) return;

  const order = await prisma.order.findUnique({ where: { orderNumber } });
  if (!order) {
    await prisma.logEntry.create({
      data: {
        level: "WARN",
        action: "stripe.webhook.order_not_found",
        entityType: "PaymentIntent",
        entityId: paymentIntent.id,
        message: `No se encontro orden para Stripe PaymentIntent ${paymentIntent.id}`,
        metadata: jsonValue({ paymentIntent }),
      },
    });
    return;
  }

  const mappedStatus = fromStripeStatus(paymentIntent.status);
  const wasPaid = order.paymentStatus === "PAID";

  await prisma.$transaction([
    prisma.order.update({
      where: { id: order.id },
      data: {
        paymentProvider: "stripe",
        paymentExternalId: paymentIntent.id,
        paymentStatus: mappedStatus,
        paymentStatusDetail: paymentIntent.status,
        status: mappedStatus === "PAID" ? "PAID" : mappedStatus === "CANCELLED" ? "CANCELLED" : order.status,
        paidAt: mappedStatus === "PAID" ? new Date() : order.paidAt,
        cancelledAt: mappedStatus === "CANCELLED" ? new Date() : order.cancelledAt,
      },
    }),
    prisma.paymentAttempt.create({
      data: {
        orderId: order.id,
        provider: "stripe",
        externalPaymentId: paymentIntent.id,
        status: paymentIntent.status,
        statusDetail: paymentIntent.last_payment_error?.message,
        rawResponse: jsonValue(paymentIntent),
      },
    }),
  ]);

  if (mappedStatus === "PAID" && !wasPaid) {
    await confirmReservedStock(order.id);
    revalidateTag("products");
    await sendOrderStatusEmail(order.id, "PAID");
    await sendInvoiceEmail(order.id);
  }

  if (mappedStatus === "FAILED" || mappedStatus === "CANCELLED") {
    await releaseReservation(order.id, `Pago ${paymentIntent.status} en Stripe`);
    revalidateTag("products");
    if (mappedStatus === "CANCELLED") {
      await sendOrderCancelledEmail(order.id, "Pago cancelado en Stripe.");
    } else {
      await sendOrderStatusEmail(order.id, order.status);
    }
  }
}

export async function POST(request: NextRequest) {
  const payload = await request.text();
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    await prisma.logEntry.create({ data: { level: "ERROR", action: "stripe.webhook.missing_secret", message: "STRIPE_WEBHOOK_SECRET no esta configurado." } });
    return NextResponse.json({ ok: false }, { status: 503 });
  }

  let event: Stripe.Event;

  try {
    if (!signature) throw new Error("Falta header stripe-signature");
    event = stripe().webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error) {
    await prisma.logEntry.create({
      data: {
        level: "WARN",
        action: "stripe.webhook.invalid_signature",
        message: error instanceof Error ? error.message : "Webhook invalido de Stripe",
      },
    });
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  try {
    if (
      event.type === "payment_intent.succeeded" ||
      event.type === "payment_intent.payment_failed" ||
      event.type === "payment_intent.canceled" ||
      event.type === "payment_intent.processing" ||
      event.type === "payment_intent.requires_action"
    ) {
      await handlePaymentIntent(event.data.object as Stripe.PaymentIntent);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    await prisma.logEntry.create({
      data: {
        level: "ERROR",
        action: "stripe.webhook.error",
        message: error instanceof Error ? error.message : "Error desconocido en webhook de Stripe",
        metadata: jsonValue({ event }),
      },
    });
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
