import type { OrderStatus, PaymentStatus } from "@prisma/client";

export const orderStatusLabel: Record<OrderStatus, string> = {
  PENDING: "Pendiente", CONFIRMED: "Confirmado", PAID: "Pagado", PROCESSING: "En preparacion",
  SHIPPED: "En camino", DELIVERED: "Entregado", CANCELLED: "Cancelado", REFUNDED: "Reembolsado",
};

export const paymentStatusLabel: Record<PaymentStatus, string> = {
  PENDING: "Pago pendiente", AUTHORIZED: "Pago autorizado", PAID: "Pago aprobado",
  FAILED: "Pago fallido", REFUNDED: "Reembolsado", CANCELLED: "Pago cancelado",
};

export function orderStatusClass(status: OrderStatus) {
  if (["DELIVERED", "PAID", "CONFIRMED"].includes(status)) return "bg-emerald-50 text-emerald-700";
  if (["CANCELLED", "REFUNDED"].includes(status)) return "bg-red-50 text-red-700";
  if (["SHIPPED", "PROCESSING"].includes(status)) return "bg-blue-50 text-blue-700";
  return "bg-amber-50 text-amber-700";
}

export function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}
