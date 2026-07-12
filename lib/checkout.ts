import type { Coupon } from "@prisma/client";

export const shippingMethods = {
  standard: {
    label: "Envio estandar",
    description: "3 a 6 dias habiles",
    amount: 6500,
  },
  express: {
    label: "Envio express",
    description: "24 a 48 horas",
    amount: 12500,
  },
  pickup: {
    label: "Retiro en punto ErcLav",
    description: "Sin costo",
    amount: 0,
  },
} as const;

export const paymentMethods = {
  mercado_pago: "Mercado Pago",
  stripe: "Stripe internacional",
  card: "Tarjeta de credito/debito",
  transfer: "Transferencia bancaria",
  cash: "Efectivo al retirar",
} as const;

export type ShippingMethodKey = keyof typeof shippingMethods;
export type PaymentMethodKey = keyof typeof paymentMethods;

export function normalizeShippingMethod(value?: string): ShippingMethodKey {
  return value === "express" || value === "pickup" || value === "standard" ? value : "standard";
}

export function normalizePaymentMethod(value?: string): PaymentMethodKey {
  return value === "stripe" ||
    value === "card" ||
    value === "transfer" ||
    value === "cash" ||
    value === "mercado_pago"
    ? value
    : "mercado_pago";
}

export function calculateShipping(subtotal: number, method: ShippingMethodKey) {
  if (method === "standard" && subtotal >= 180000) return 0;
  return shippingMethods[method].amount;
}

export function calculateDiscount(subtotal: number, coupon?: Coupon | null) {
  if (!coupon || !coupon.isActive) return 0;

  const now = new Date();
  if (coupon.startsAt && coupon.startsAt > now) return 0;
  if (coupon.endsAt && coupon.endsAt < now) return 0;
  if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) return 0;
  if (coupon.minimumSubtotal && Number(coupon.minimumSubtotal) > subtotal) return 0;

  const rawDiscount =
    coupon.discountType === "PERCENTAGE"
      ? subtotal * (Number(coupon.discountValue) / 100)
      : Number(coupon.discountValue);

  return Math.min(rawDiscount, Number(coupon.maxDiscount ?? rawDiscount), subtotal);
}

export function calculateTax(taxableAmount: number) {
  return Math.round(taxableAmount * 0.21);
}

export function calculateCheckoutTotals({
  subtotal,
  coupon,
  shippingMethod,
}: {
  subtotal: number;
  coupon?: Coupon | null;
  shippingMethod: ShippingMethodKey;
}) {
  const discount = calculateDiscount(subtotal, coupon);
  const taxableSubtotal = Math.max(subtotal - discount, 0);
  const shipping = calculateShipping(taxableSubtotal, shippingMethod);
  const tax = calculateTax(taxableSubtotal);

  return {
    subtotal,
    discount,
    shipping,
    tax,
    total: taxableSubtotal + shipping + tax,
  };
}
