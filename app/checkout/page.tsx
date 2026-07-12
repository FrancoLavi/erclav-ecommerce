import type { Metadata } from "next";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { CreditCard, MapPin, PackageCheck, Ticket } from "lucide-react";

import { createOrderAction } from "@/actions/checkout";
import { getCart } from "@/actions/store";
import { auth } from "@/auth";
import { CheckoutSummary } from "@/components/checkout/checkout-summary";
import { StoreShell } from "@/components/store/store-shell";
import {
  calculateCheckoutTotals,
  normalizePaymentMethod,
  normalizeShippingMethod,
  paymentMethods,
  shippingMethods,
} from "@/lib/checkout";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Checkout | ErcLav",
  description: "Finaliza tu compra en ErcLav.",
  robots: { index: false, follow: false },
};

type CheckoutPageProps = {
  searchParams: Promise<{
    coupon?: string;
    shipping?: string;
    payment?: string;
    error?: string;
  }>;
};

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  const params = await searchParams;
  const cart = await getCart();
  if (!cart?.items.length) redirect("/productos");

  const shippingMethod = normalizeShippingMethod(params.shipping);
  const paymentMethod = normalizePaymentMethod(params.payment);
  const couponCode = params.coupon?.trim().toUpperCase();
  const coupon = couponCode ? await prisma.coupon.findUnique({ where: { code: couponCode } }) : null;
  const subtotal = cart.items.reduce((sum, item) => sum + Number(item.unitPrice) * item.quantity, 0);
  const totals = calculateCheckoutTotals({ subtotal, coupon, shippingMethod });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { addresses: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  const address = user?.addresses[0];

  return (
    <StoreShell>
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold uppercase text-neutral-500">Checkout</p>
        <h1 className="mt-2 text-4xl font-black tracking-tight">Finalizar compra</h1>
        {params.error ? (
          <p className="mt-4 rounded-md bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            No pudimos confirmar la compra. Revisa datos, stock y carrito.
          </p>
        ) : null}

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
          <div className="space-y-6">
            <section className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-black/5">
              <div className="flex items-center gap-2">
                <Ticket className="h-5 w-5 text-neutral-500" aria-hidden />
                <h2 className="text-lg font-black">Cupón, envío y pago</h2>
              </div>
              <form action="/checkout" className="mt-5 grid gap-4 sm:grid-cols-3">
                <input name="coupon" defaultValue={couponCode ?? ""} placeholder="Cupón" className="h-11 rounded-md border border-neutral-300 px-3 text-sm outline-none focus:border-neutral-950" />
                <select name="shipping" defaultValue={shippingMethod} className="h-11 rounded-md border border-neutral-300 bg-white px-3 text-sm outline-none focus:border-neutral-950">
                  {Object.entries(shippingMethods).map(([key, method]) => (
                    <option key={key} value={key}>
                      {method.label}
                    </option>
                  ))}
                </select>
                <select name="payment" defaultValue={paymentMethod} className="h-11 rounded-md border border-neutral-300 bg-white px-3 text-sm outline-none focus:border-neutral-950">
                  {Object.entries(paymentMethods).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
                <button className="h-11 rounded-full bg-neutral-950 px-5 text-sm font-semibold text-white sm:col-span-3">
                  Actualizar resumen
                </button>
              </form>
            </section>

            <form action={createOrderAction} className="space-y-6">
              <input type="hidden" name="couponCode" value={couponCode ?? ""} />
              <input type="hidden" name="shippingMethod" value={shippingMethod} />
              <input type="hidden" name="paymentMethod" value={paymentMethod} />

              <section className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-black/5">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-neutral-500" aria-hidden />
                  <h2 className="text-lg font-black">Dirección</h2>
                </div>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <Field label="Nombre" name="firstName" defaultValue={address?.firstName ?? user?.firstName ?? ""} />
                  <Field label="Apellido" name="lastName" defaultValue={address?.lastName ?? user?.lastName ?? ""} />
                  <Field label="Teléfono" name="phone" defaultValue={address?.phone ?? user?.phone ?? ""} />
                  <Field label="Código postal" name="postalCode" defaultValue={address?.postalCode ?? ""} />
                  <Field label="Calle" name="street" defaultValue={address?.street ?? ""} />
                  <Field label="Número" name="number" defaultValue={address?.number ?? ""} />
                  <Field label="Piso/depto" name="apartment" defaultValue={address?.apartment ?? ""} required={false} />
                  <Field label="Ciudad" name="city" defaultValue={address?.city ?? ""} />
                  <Field label="Provincia" name="province" defaultValue={address?.province ?? ""} />
                  <Field label="País" name="country" defaultValue={address?.country ?? "AR"} />
                </div>
                <textarea name="notes" placeholder="Notas para la entrega" className="mt-4 min-h-24 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-950" />
              </section>

              <section className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-black/5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Info icon={<PackageCheck className="h-5 w-5" />} title={shippingMethods[shippingMethod].label} text={shippingMethods[shippingMethod].description} />
                  <Info icon={<CreditCard className="h-5 w-5" />} title={paymentMethods[paymentMethod]} text="La orden queda registrada para continuar el cobro." />
                </div>
                <button className="mt-6 h-12 w-full rounded-full bg-neutral-950 px-6 text-sm font-semibold text-white hover:bg-neutral-800">
                  Confirmar compra
                </button>
              </section>
            </form>
          </div>

          <CheckoutSummary cart={cart} totals={totals} couponCode={couponCode} />
        </div>
      </main>
    </StoreShell>
  );
}

function Field({
  label,
  name,
  defaultValue,
  required = true,
}: {
  label: string;
  name: string;
  defaultValue: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-neutral-700">{label}</span>
      <input
        name={name}
        defaultValue={defaultValue}
        required={required}
        className="mt-2 h-11 w-full rounded-md border border-neutral-300 px-3 text-sm outline-none focus:border-neutral-950"
      />
    </label>
  );
}

function Info({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-lg border border-neutral-200 p-4">
      <div className="flex items-center gap-2 text-neutral-500">{icon}</div>
      <p className="mt-3 font-semibold">{title}</p>
      <p className="mt-1 text-sm text-neutral-500">{text}</p>
    </div>
  );
}
