"use client";

import { useState } from "react";
import { PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";

export function StripePaymentForm({ orderNumber }: { orderNumber: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!stripe || !elements) return;

    setIsSubmitting(true);
    setMessage("");

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/confirmacion/${orderNumber}`,
      },
    });

    if (error) {
      setMessage(error.message ?? "No pudimos procesar el pago.");
    }

    setIsSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <PaymentElement />
      {message ? <p className="rounded-md bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{message}</p> : null}
      <button
        disabled={!stripe || !elements || isSubmitting}
        className="h-12 w-full rounded-full bg-neutral-950 px-6 text-sm font-semibold text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300"
      >
        {isSubmitting ? "Procesando..." : "Pagar con Stripe"}
      </button>
    </form>
  );
}
