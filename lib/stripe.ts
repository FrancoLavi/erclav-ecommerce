import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export function stripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("Falta configurar STRIPE_SECRET_KEY en .env");
  }

  stripeClient ??= new Stripe(secretKey);
  return stripeClient;
}

const zeroDecimalCurrencies = new Set([
  "bif",
  "clp",
  "djf",
  "gnf",
  "jpy",
  "kmf",
  "krw",
  "mga",
  "pyg",
  "rwf",
  "ugx",
  "vnd",
  "vuv",
  "xaf",
  "xof",
  "xpf",
]);

export function toStripeAmount(amount: number, currency: string) {
  const normalizedCurrency = currency.toLowerCase();
  return zeroDecimalCurrencies.has(normalizedCurrency) ? Math.round(amount) : Math.round(amount * 100);
}

export function fromStripeStatus(status: Stripe.PaymentIntent.Status) {
  if (status === "succeeded") return "PAID";
  if (status === "canceled") return "CANCELLED";
  if (status === "requires_payment_method") return "FAILED";
  if (status === "requires_capture" || status === "processing") return "AUTHORIZED";
  return "PENDING";
}

export async function createStripePaymentIntent({
  orderId,
  orderNumber,
  amount,
  currency,
  customerEmail,
}: {
  orderId: string;
  orderNumber: string;
  amount: number;
  currency: string;
  customerEmail: string;
}) {
  return stripe().paymentIntents.create(
    {
      amount: toStripeAmount(amount, currency),
      currency: currency.toLowerCase(),
      automatic_payment_methods: {
        enabled: true,
      },
      receipt_email: customerEmail,
      metadata: {
        order_id: orderId,
        order_number: orderNumber,
      },
      description: `Orden ${orderNumber} - ErcLav`,
    },
    {
      idempotencyKey: `order-${orderId}`,
    },
  );
}
