"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, LoaderCircle, ShoppingBag } from "lucide-react";

import { addAssistantCartItemAction } from "@/actions/store";
import type { AssistantProduct, AssistantVariant } from "@/lib/assistant";

function formatMoney(value: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);
}

function variantLabel(variant: AssistantVariant) {
  return [variant.color, variant.size].filter(Boolean).join(" / ") || "Opcion unica";
}

export function AssistantProductResult({
  product,
  onOpenProduct,
}: {
  product: AssistantProduct;
  onOpenProduct(): void;
}) {
  const router = useRouter();
  const firstAvailable = product.variants.find((variant) => variant.available > 0);
  const [variantId, setVariantId] = useState(firstAvailable?.id ?? product.variants[0]?.id ?? "");
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const selected = useMemo(
    () => product.variants.find((variant) => variant.id === variantId),
    [product.variants, variantId],
  );
  const price = selected?.price ?? product.price;

  function addToCart() {
    if (!selected || selected.available <= 0 || pending) return;
    setStatus(null);
    startTransition(async () => {
      const result = await addAssistantCartItemAction(selected.id);
      setStatus(result);
      if (result.ok) router.refresh();
    });
  }

  return (
    <article className="rounded-lg bg-white p-2 shadow-sm ring-1 ring-black/5">
      <div className="flex min-h-20 items-center gap-3">
        <Link
          href={`/productos/${product.slug}`}
          onClick={onOpenProduct}
          className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md bg-[#ebe9e4]"
          aria-label={`Ver ${product.name}`}
        >
          {product.image ? (
            <Image src={product.image} alt={product.name} fill sizes="80px" className="object-cover" />
          ) : (
            <span className="grid h-full place-items-center text-xs text-neutral-500">Sin imagen</span>
          )}
        </Link>
        <div className="min-w-0 flex-1 py-1">
          <p className="truncate text-xs font-bold uppercase text-neutral-500">{product.brand}</p>
          <Link
            href={`/productos/${product.slug}`}
            onClick={onOpenProduct}
            className="mt-1 line-clamp-2 block text-sm font-bold leading-4 text-neutral-950 hover:underline"
          >
            {product.name}
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-sm font-black text-neutral-950">{formatMoney(price)}</span>
            {product.originalPrice && product.originalPrice > price ? (
              <span className="text-xs text-neutral-500 line-through">{formatMoney(product.originalPrice)}</span>
            ) : null}
            <span className={product.available > 0 ? "text-xs font-semibold text-emerald-700" : "text-xs font-semibold text-red-700"}>
              {product.available > 0 ? "Disponible" : "Sin stock"}
            </span>
          </div>
        </div>
        <Link
          href={`/productos/${product.slug}`}
          onClick={onOpenProduct}
          aria-label={`Abrir detalle de ${product.name}`}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-950"
        >
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>

      {product.variants.length ? (
        <div className="mt-2 flex items-center gap-2 border-t border-black/5 pt-2">
          <label htmlFor={`assistant-variant-${product.id}`} className="sr-only">
            Variante de {product.name}
          </label>
          {product.variants.length > 1 ? (
            <select
              id={`assistant-variant-${product.id}`}
              value={variantId}
              onChange={(event) => {
                setVariantId(event.target.value);
                setStatus(null);
              }}
              className="h-9 min-w-0 flex-1 rounded-md border border-black/10 bg-white px-2 text-xs font-semibold text-neutral-700 outline-none focus:border-black/30"
            >
              {product.variants.map((variant) => (
                <option key={variant.id} value={variant.id} disabled={variant.available <= 0}>
                  {variantLabel(variant)}{variant.available > 0 ? ` - ${variant.available} disp.` : " - Sin stock"}
                </option>
              ))}
            </select>
          ) : (
            <span className="min-w-0 flex-1 truncate px-1 text-xs font-semibold text-neutral-600">
              {variantLabel(product.variants[0])}
            </span>
          )}
          <button
            type="button"
            onClick={addToCart}
            disabled={!selected || selected.available <= 0 || pending}
            aria-label={`Agregar ${product.name} al carrito`}
            className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-md bg-neutral-950 px-3 text-xs font-bold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300"
          >
            {pending ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <ShoppingBag className="h-3.5 w-3.5" aria-hidden />}
            Agregar
          </button>
        </div>
      ) : null}

      {status ? (
        <p className={`mt-2 flex items-start gap-1.5 rounded-md px-2 py-1.5 text-xs font-semibold ${status.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`} aria-live="polite">
          {status.ok ? <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden /> : null}
          {status.message}
        </p>
      ) : null}
    </article>
  );
}
