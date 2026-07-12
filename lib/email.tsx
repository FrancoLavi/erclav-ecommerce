import type { OrderStatus, Prisma } from "@prisma/client";
import { render } from "@react-email/render";
import { Resend } from "resend";
import type { ReactElement } from "react";

import {
  InvoiceEmail,
  OrderCancelledEmail,
  OrderConfirmationEmail,
  OrderStatusEmail,
  PasswordResetEmail,
  VerificationEmail,
  WelcomeEmail,
} from "@/emails/templates";
import { money } from "@/lib/format";
import { prisma } from "@/lib/prisma";

const defaultFrom = "ErcLav <onboarding@resend.dev>";

const statusLabels: Record<OrderStatus, string> = {
  PENDING: "Pendiente",
  PAID: "Pagado",
  CONFIRMED: "Confirmado",
  PROCESSING: "En preparacion",
  SHIPPED: "Enviado",
  DELIVERED: "Entregado",
  CANCELLED: "Cancelado",
  REFUNDED: "Reembolsado",
};

type EmailOptions = {
  to: string;
  subject: string;
  text?: string;
  react?: ReactElement;
};

function resendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  return apiKey ? new Resend(apiKey) : null;
}

function appUrl() {
  return process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000";
}

function fromAddress() {
  return process.env.EMAIL_FROM || defaultFrom;
}

function replyToAddress() {
  return process.env.EMAIL_REPLY_TO || undefined;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function plainTextFromHtml(html: string) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function jsonValue(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

async function logEmailError(action: string, error: unknown, metadata?: Record<string, unknown>) {
  try {
    await prisma.logEntry.create({
      data: {
        level: "ERROR",
        action,
        entityType: "Email",
        message: error instanceof Error ? error.message : "Error desconocido enviando email",
        metadata: metadata ? jsonValue(metadata) : undefined,
      },
    });
  } catch (logError) {
    console.error("[email log error]", logError);
  }
}

export async function sendEmail({ to, subject, text, react }: EmailOptions) {
  const html = react ? await render(react) : `<p>${escapeHtml(text ?? "")}</p>`;
  const plainText = text ?? plainTextFromHtml(html);
  const resend = resendClient();

  if (!resend) {
    console.info("[email dev]", { to, subject, text: plainText });
    return;
  }

  const { error } = await resend.emails.send({
    from: fromAddress(),
    to,
    subject,
    html,
    text: plainText,
    replyTo: replyToAddress(),
  });

  if (error) {
    throw new Error(error.message);
  }
}

async function safeSendEmail(action: string, options: EmailOptions) {
  try {
    await sendEmail(options);
  } catch (error) {
    await logEmailError(action, error, { to: options.to, subject: options.subject });
  }
}

function displayName(user?: { name: string | null; firstName: string | null; email: string }) {
  return user?.name || user?.firstName || user?.email || "Cliente";
}

async function getOrderEmailData(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: { select: { email: true, firstName: true, name: true } },
      items: true,
    },
  });

  if (!order) return null;

  return {
    order,
    name: displayName(order.user),
    orderUrl: `${appUrl()}/checkout/confirmacion/${order.orderNumber}`,
    total: money(order.total.toString(), order.currency),
    lines: order.items.map((item) => ({
      name: [item.productName, item.color, item.size].filter(Boolean).join(" / "),
      quantity: item.quantity,
      unitPrice: money(item.unitPrice.toString(), order.currency),
      total: money(item.total.toString(), order.currency),
    })),
  };
}

export async function sendVerificationEmail({
  to,
  name,
  verifyUrl,
}: {
  to: string;
  name: string;
  verifyUrl: string;
}) {
  await safeSendEmail("email.verification.send_error", {
    to,
    subject: "Verifica tu cuenta en ErcLav",
    text: `Verifica tu email entrando a este enlace: ${verifyUrl}`,
    react: <VerificationEmail name={name} verifyUrl={verifyUrl} />,
  });
}

export async function sendWelcomeEmail({ to, name }: { to: string; name: string }) {
  await safeSendEmail("email.welcome.send_error", {
    to,
    subject: "Bienvenido a ErcLav",
    text: `Hola ${name}, tu cuenta de ErcLav ya esta lista.`,
    react: <WelcomeEmail name={name} storeUrl={appUrl()} />,
  });
}

export async function sendPasswordResetEmail({
  to,
  name,
  resetUrl,
}: {
  to: string;
  name: string;
  resetUrl: string;
}) {
  await safeSendEmail("email.password_reset.send_error", {
    to,
    subject: "Restablece tu contrasena de ErcLav",
    text: `Restablece tu contrasena entrando a este enlace: ${resetUrl}`,
    react: <PasswordResetEmail name={name} resetUrl={resetUrl} />,
  });
}

export async function sendOrderConfirmationEmail(orderId: string) {
  const data = await getOrderEmailData(orderId);
  if (!data) return;

  await safeSendEmail("email.order_confirmation.send_error", {
    to: data.order.user.email,
    subject: `Confirmacion de compra ${data.order.orderNumber}`,
    text: `Recibimos tu orden ${data.order.orderNumber}. Total: ${data.total}.`,
    react: (
      <OrderConfirmationEmail
        name={data.name}
        orderNumber={data.order.orderNumber}
        total={data.total}
        orderUrl={data.orderUrl}
      />
    ),
  });
}

export async function sendOrderStatusEmail(orderId: string, status: OrderStatus) {
  const data = await getOrderEmailData(orderId);
  if (!data) return;

  const label = statusLabels[status] ?? status;
  await safeSendEmail("email.order_status.send_error", {
    to: data.order.user.email,
    subject: `Tu pedido ${data.order.orderNumber}: ${label}`,
    text: `Tu orden ${data.order.orderNumber} ahora esta en estado ${label}.`,
    react: (
      <OrderStatusEmail
        name={data.name}
        orderNumber={data.order.orderNumber}
        status={label}
        orderUrl={data.orderUrl}
      />
    ),
  });
}

export async function sendInvoiceEmail(orderId: string) {
  const data = await getOrderEmailData(orderId);
  if (!data) return;

  await safeSendEmail("email.invoice.send_error", {
    to: data.order.user.email,
    subject: `Factura de tu orden ${data.order.orderNumber}`,
    text: `Comprobante de compra de la orden ${data.order.orderNumber}. Total: ${data.total}.`,
    react: (
      <InvoiceEmail
        name={data.name}
        orderNumber={data.order.orderNumber}
        total={data.total}
        lines={data.lines}
      />
    ),
  });
}

export async function sendOrderCancelledEmail(orderId: string, reason?: string) {
  const data = await getOrderEmailData(orderId);
  if (!data) return;

  await safeSendEmail("email.order_cancelled.send_error", {
    to: data.order.user.email,
    subject: `Orden ${data.order.orderNumber} cancelada`,
    text: `La orden ${data.order.orderNumber} fue cancelada.${reason ? ` Motivo: ${reason}` : ""}`,
    react: <OrderCancelledEmail name={data.name} orderNumber={data.order.orderNumber} reason={reason} />,
  });
}
