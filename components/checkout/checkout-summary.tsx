import Image from "next/image";

import { money } from "@/lib/format";

type Cart = Awaited<ReturnType<typeof import("@/actions/store").getCart>>;

export function CheckoutSummary({
  cart,
  totals,
  couponCode,
}: {
  cart: Cart;
  totals: {
    subtotal: number;
    discount: number;
    shipping: number;
    tax: number;
    total: number;
  };
  couponCode?: string;
}) {
  return (
    <aside className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-black/5 lg:sticky lg:top-28 lg:self-start">
      <h2 className="text-lg font-black">Resumen</h2>
      <div className="mt-5 space-y-4">
        {cart?.items.map((item) => {
          const image = item.variant.product.images[0];
          return (
            <div key={item.id} className="flex gap-3">
              <div className="relative h-16 w-16 overflow-hidden rounded-md bg-neutral-100">
                {image ? <Image src={image.url} alt={item.variant.product.name} fill sizes="64px" className="object-cover" /> : null}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{item.variant.product.name}</p>
                <p className="mt-1 text-xs text-neutral-500">
                  {item.quantity} x {money(item.unitPrice.toString())}
                </p>
              </div>
              <p className="text-sm font-semibold">{money(Number(item.unitPrice) * item.quantity)}</p>
            </div>
          );
        })}
      </div>
      <div className="mt-6 space-y-3 border-t border-black/10 pt-5 text-sm">
        <Row label="Subtotal" value={money(totals.subtotal)} />
        <Row label={couponCode ? `Descuento (${couponCode})` : "Descuento"} value={`-${money(totals.discount)}`} />
        <Row label="Envio" value={totals.shipping === 0 ? "Gratis" : money(totals.shipping)} />
        <Row label="Impuestos 21%" value={money(totals.tax)} />
        <div className="flex items-center justify-between border-t border-black/10 pt-4 text-base font-black">
          <span>Total</span>
          <span>{money(totals.total)}</span>
        </div>
      </div>
    </aside>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-neutral-500">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
