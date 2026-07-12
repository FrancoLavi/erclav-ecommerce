"use client";

import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

import { StripePaymentForm } from "@/components/checkout/stripe/stripe-payment-form";

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

export function StripePaymentShell({
  clientSecret,
  orderNumber,
}: {
  clientSecret: string;
  orderNumber: string;
}) {
  if (!stripePromise) {
    return (
      <p className="rounded-md bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
        Falta configurar NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.
      </p>
    );
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: "stripe",
          variables: {
            borderRadius: "8px",
            colorPrimary: "#111111",
          },
        },
      }}
    >
      <StripePaymentForm orderNumber={orderNumber} />
    </Elements>
  );
}
