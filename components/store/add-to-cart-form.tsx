"use client";

import { useMemo, useState } from "react";
import { ShoppingBag } from "lucide-react";

import { addToCartAction } from "@/actions/store";

type Variant = {
  id: string;
  sku: string;
  color: string | null;
  size: string | null;
  stock: { quantity: number; reservedQuantity: number } | null;
};

export function AddToCartForm({ variants }: { variants: Variant[] }) {
  const [variantId, setVariantId] = useState(variants[0]?.id ?? "");
  const selected = useMemo(() => variants.find((variant) => variant.id === variantId), [variantId, variants]);
  const available = selected ? (selected.stock?.quantity ?? 0) - (selected.stock?.reservedQuantity ?? 0) : 0;

  return (
    <form action={addToCartAction} className="space-y-4">
      <input type="hidden" name="variantId" value={variantId} />
      <div>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-bold text-neutral-800">Elegir variante</p>
          <p className="text-xs font-semibold text-neutral-500">{available > 0 ? `${available} disponibles` : "Sin stock"}</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
        {variants.map((variant) => (
          <button
            key={variant.id}
            type="button"
            onClick={() => setVariantId(variant.id)}
            className={
              variant.id === variantId
                ? "rounded-md border border-neutral-950 bg-neutral-950 px-4 py-3 text-left text-sm font-bold text-white"
                : "rounded-md border border-neutral-300 bg-white px-4 py-3 text-left text-sm font-semibold text-neutral-950 transition hover:border-neutral-950"
            }
          >
            {[variant.color, variant.size].filter(Boolean).join(" / ") || variant.sku}
          </button>
        ))}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <input name="quantity" type="number" min="1" max={Math.max(available, 1)} defaultValue="1" className="h-12 w-24 rounded-full border border-neutral-300 bg-white px-4 text-sm font-semibold outline-none focus:border-neutral-950" />
        <button
          type="submit"
          disabled={!selected || available <= 0}
          className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-neutral-950 px-6 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:hover:translate-y-0"
        >
          <ShoppingBag className="h-4 w-4" aria-hidden />
          {available > 0 ? "Agregar al carrito" : "Sin stock"}
        </button>
      </div>
    </form>
  );
}
