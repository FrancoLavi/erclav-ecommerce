import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

import { retryMercadoPagoPaymentAction, retryStripePaymentAction } from "@/actions/checkout";
import { auth } from "@/auth";
import { StoreShell } from "@/components/store/store-shell";
import { money } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Compra confirmada | ErcLav",
  robots: { index: false, follow: false },
};

type ConfirmationPageProps = {
  params: Promise<{ orderNumber: string }>;
};

export default async function ConfirmationPage({ params }: ConfirmationPageProps) {
  const { orderNumber } = await params;
  const session = await auth();
  if (!session?.user) redirect(`/auth/login?callbackUrl=/checkout/confirmacion/${orderNumber}`);
  const order = await prisma.order.findFirst({
    where: { orderNumber, userId: session.user.id },
    include: { items: true, paymentAttempts: { orderBy: { createdAt: "desc" }, take: 1 } },
  });

  if (!order) notFound();

  return (
    <StoreShell>
      <main className="mx-auto flex min-h-[70vh] max-w-3xl flex-col justify-center px-4 py-12 text-center sm:px-6 lg:px-8">
        <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-600" aria-hidden />
        <h1 className="mt-6 text-4xl font-black tracking-tight">Compra confirmada</h1>
        <p className="mt-4 text-neutral-600">
          Recibimos tu orden <strong>{order.orderNumber}</strong>. Te vamos a contactar para continuar el proceso de pago y envío.
        </p>
        <div className="mx-auto mt-8 w-full max-w-md rounded-lg bg-white p-5 text-left shadow-sm ring-1 ring-black/5">
          <div className="flex justify-between text-sm">
            <span className="text-neutral-500">Items</span>
            <span className="font-semibold">{order.items.length}</span>
          </div>
          <div className="mt-3 flex justify-between text-sm">
            <span className="text-neutral-500">Total</span>
            <span className="font-semibold">{money(order.total.toString(), order.currency)}</span>
          </div>
          <div className="mt-3 flex justify-between text-sm">
            <span className="text-neutral-500">Estado</span>
            <span className="font-semibold">{order.status} / {order.paymentStatus}</span>
          </div>
          {order.paymentExternalId ? (
            <div className="mt-3 flex justify-between text-sm">
              <span className="text-neutral-500">Payment ID</span>
              <span className="font-semibold">{order.paymentExternalId}</span>
            </div>
          ) : null}
        </div>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {order.paymentProvider === "mercado_pago" && ["PENDING", "FAILED", "CANCELLED"].includes(order.paymentStatus) ? (
            <form action={retryMercadoPagoPaymentAction.bind(null, order.orderNumber)}>
              <button className="rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white">
                Reintentar pago
              </button>
            </form>
          ) : null}
          {order.paymentProvider === "stripe" && ["PENDING", "FAILED", "CANCELLED"].includes(order.paymentStatus) ? (
            <form action={retryStripePaymentAction.bind(null, order.orderNumber)}>
              <button className="rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white">
                Reintentar con Stripe
              </button>
            </form>
          ) : null}
          <Link href="/productos" className="rounded-full bg-neutral-950 px-6 py-3 text-sm font-semibold text-white">
            Seguir comprando
          </Link>
          <Link href="/cuenta" className="rounded-full border border-neutral-300 px-6 py-3 text-sm font-semibold text-neutral-950">
            Ir a mi cuenta
          </Link>
        </div>
      </main>
    </StoreShell>
  );
}
