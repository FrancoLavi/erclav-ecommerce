import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { StripePaymentShell } from "@/components/checkout/stripe/stripe-payment-shell";
import { StoreShell } from "@/components/store/store-shell";
import { money } from "@/lib/format";
import { createStripePaymentIntent } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Pagar con Stripe | ErcLav",
  robots: { index: false, follow: false },
};

type StripeCheckoutPageProps = {
  params: Promise<{ orderNumber: string }>;
};

export default async function StripeCheckoutPage({ params }: StripeCheckoutPageProps) {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  const { orderNumber } = await params;
  const order = await prisma.order.findFirst({
    where: {
      orderNumber,
      userId: session.user.id,
      paymentProvider: "stripe",
    },
    include: { user: true, items: true },
  });

  if (!order) redirect("/checkout");
  if (order.paymentStatus === "PAID") redirect(`/checkout/confirmacion/${order.orderNumber}`);

  let paymentIntentId = order.paymentExternalId;
  let clientSecret: string | null = null;

  if (paymentIntentId) {
    const { stripe } = await import("@/lib/stripe");
    const intent = await stripe().paymentIntents.retrieve(paymentIntentId);
    clientSecret = intent.client_secret;
  } else {
    const intent = await createStripePaymentIntent({
      orderId: order.id,
      orderNumber: order.orderNumber,
      amount: Number(order.total),
      currency: order.currency,
      customerEmail: order.user.email,
    });
    paymentIntentId = intent.id;
    clientSecret = intent.client_secret;

    await prisma.$transaction([
      prisma.order.update({
        where: { id: order.id },
        data: {
          paymentExternalId: intent.id,
          paymentStatus: "PENDING",
          paymentStatusDetail: intent.status,
        },
      }),
      prisma.paymentAttempt.create({
        data: {
          orderId: order.id,
          provider: "stripe",
          externalPaymentId: intent.id,
          status: intent.status,
          statusDetail: intent.last_payment_error?.message,
          rawResponse: JSON.parse(JSON.stringify(intent)),
        },
      }),
    ]);
  }

  if (!clientSecret) redirect(`/checkout/confirmacion/${order.orderNumber}?payment=stripe-error`);

  return (
    <StoreShell>
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold uppercase text-neutral-500">Stripe</p>
        <h1 className="mt-2 text-4xl font-black tracking-tight">Pago internacional</h1>
        <p className="mt-3 text-neutral-600">
          Orden {order.orderNumber} · Total {money(order.total.toString(), order.currency)}
        </p>
        <section className="mt-8 rounded-lg bg-white p-5 shadow-sm ring-1 ring-black/5">
          <StripePaymentShell clientSecret={clientSecret} orderNumber={order.orderNumber} />
        </section>
      </main>
    </StoreShell>
  );
}
