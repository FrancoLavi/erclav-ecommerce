import { NextResponse, type NextRequest } from "next/server";
import { revalidateTag } from "next/cache";
import type { Prisma } from "@prisma/client";

import { sendInvoiceEmail, sendOrderCancelledEmail, sendOrderStatusEmail } from "@/lib/email";
import {
  getMercadoPagoPayment,
  mapMercadoPagoPaymentStatus,
  verifyMercadoPagoSignature,
} from "@/lib/mercadopago";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function jsonValue(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function paymentIdFromPayload(body: unknown, url: URL) {
  const dataId = url.searchParams.get("data.id") ?? url.searchParams.get("id");
  if (dataId) return dataId;

  if (typeof body === "object" && body && "data" in body) {
    const data = (body as { data?: { id?: string | number } }).data;
    if (data?.id) return String(data.id);
  }

  if (typeof body === "object" && body && "id" in body) {
    const id = (body as { id?: string | number }).id;
    if (id) return String(id);
  }

  return null;
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
    const newQty = previousQty - item.quantity;
    const releaseQty = Math.min(previousReserved, item.quantity);

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
        reason: "Pago aprobado en Mercado Pago",
        reference: order.orderNumber,
      },
    });
  }
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const url = new URL(request.url);
  const paymentId = paymentIdFromPayload(body, url);
  const signatureOk = verifyMercadoPagoSignature({
    signature: request.headers.get("x-signature"),
    requestId: request.headers.get("x-request-id"),
    dataId: paymentId,
  });

  if (!signatureOk) {
    await prisma.logEntry.create({
      data: {
        level: "WARN",
        action: "mercadopago.webhook.invalid_signature",
        message: "Firma invalida en webhook de Mercado Pago",
        metadata: jsonValue({ body }),
      },
    });
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  if (!paymentId) {
    await prisma.logEntry.create({
      data: {
        level: "WARN",
        action: "mercadopago.webhook.missing_payment_id",
        message: "Webhook sin payment id",
        metadata: jsonValue({ body }),
      },
    });
    return NextResponse.json({ ok: true });
  }

  try {
    const payment = await getMercadoPagoPayment(paymentId);
    const orderNumber = payment.external_reference ?? String(payment.metadata?.order_number ?? "");
    const order = await prisma.order.findUnique({ where: { orderNumber } });

    if (!order) {
      await prisma.logEntry.create({
        data: {
          level: "WARN",
          action: "mercadopago.webhook.order_not_found",
          entityType: "Payment",
          entityId: paymentId,
          message: `No se encontro orden para Mercado Pago payment ${paymentId}`,
          metadata: jsonValue({ payment }),
        },
      });
      return NextResponse.json({ ok: true });
    }

    const mappedStatus = mapMercadoPagoPaymentStatus(payment.status);
    const wasPaid = order.paymentStatus === "PAID";

    await prisma.$transaction([
      prisma.order.update({
        where: { id: order.id },
        data: {
          paymentProvider: "mercado_pago",
          paymentExternalId: String(payment.id),
          paymentStatus: mappedStatus,
          paymentStatusDetail: payment.status_detail,
          status: mappedStatus === "PAID" ? "PAID" : mappedStatus === "CANCELLED" ? "CANCELLED" : order.status,
          paidAt: mappedStatus === "PAID" ? new Date() : order.paidAt,
          cancelledAt: mappedStatus === "CANCELLED" ? new Date() : order.cancelledAt,
        },
      }),
      prisma.paymentAttempt.create({
        data: {
          orderId: order.id,
          provider: "mercado_pago",
          externalPaymentId: String(payment.id),
          status: payment.status,
          statusDetail: payment.status_detail,
          rawResponse: jsonValue(payment),
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
      await releaseReservation(order.id, `Pago ${payment.status} en Mercado Pago`);
      revalidateTag("products");
      if (mappedStatus === "CANCELLED") {
        await sendOrderCancelledEmail(order.id, "Pago cancelado en Mercado Pago.");
      } else {
        await sendOrderStatusEmail(order.id, order.status);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    await prisma.logEntry.create({
      data: {
        level: "ERROR",
        action: "mercadopago.webhook.error",
        entityType: "Payment",
        entityId: paymentId,
        message: error instanceof Error ? error.message : "Error desconocido en webhook de Mercado Pago",
        metadata: jsonValue({ body }),
      },
    });
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
