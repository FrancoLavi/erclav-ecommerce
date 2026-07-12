"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, X } from "lucide-react";

import { updateCartItemAction } from "@/actions/store";
import { money } from "@/lib/format";
import { productImageUrl } from "@/lib/product-image";

type Cart = {
  id: string;
  items: {
    id: string;
    quantity: number;
    unitPrice: string;
    variant: {
      id: string;
      sku: string;
      color: string | null;
      size: string | null;
      product: {
        id: string;
        name: string;
        slug: string;
        images: {
          id: string;
          url: string;
          altText: string | null;
        }[];
      };
    };
  }[];
} | null;

export function CartDrawer({
  children,
  cart,
  count,
}: {
  children: React.ReactNode;
  cart: Cart;
  count: number;
}) {
  const [open, setOpen] = useState(false);
  const total = cart?.items.reduce((sum, item) => sum + Number(item.unitPrice) * item.quantity, 0) ?? 0;

  return (
    <>
      <span className="inline-flex" onClick={() => setOpen(true)}>
        {children}
      </span>
      {open ? (
        <div className="fixed inset-0 z-50">
          <button className="absolute inset-0 bg-black/50 backdrop-blur-sm" aria-label="Cerrar carrito" onClick={() => setOpen(false)} />
          <aside role="dialog" aria-modal="true" aria-labelledby="cart-title" className="fixed inset-y-0 right-0 flex h-dvh w-full max-w-md flex-col overflow-hidden bg-[#f7f7f5] shadow-2xl">
            <div className="shrink-0 border-b border-black/10 bg-white p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p id="cart-title" className="text-xl font-black">Carrito</p>
                  <p className="text-sm text-neutral-500">{count} productos</p>
                </div>
                <button type="button" aria-label="Cerrar carrito" onClick={() => setOpen(false)} className="grid h-10 w-10 place-items-center rounded-full hover:bg-neutral-100">
                  <X className="h-5 w-5" aria-hidden />
                </button>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              {cart?.items.length ? (
                <div className="space-y-5">
                  {cart.items.map((item) => {
                    const image = item.variant.product.images[0];
                    return (
                      <div key={item.id} className="flex gap-3 rounded-lg border border-black/10 bg-white p-3 shadow-sm">
                        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-md bg-neutral-100">
                          {image ? <Image src={productImageUrl(image.url)} alt={item.variant.product.name} fill sizes="96px" className="object-cover" /> : null}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-2 text-sm font-semibold leading-5 text-neutral-950">{item.variant.product.name}</p>
                          <p className="mt-1 text-sm text-neutral-500">
                            {[item.variant.color, item.variant.size].filter(Boolean).join(" / ") || item.variant.sku}
                          </p>
                          <p className="mt-2 text-sm font-black">{money(item.unitPrice.toString())}</p>
                          <div className="mt-3 flex items-center gap-2">
                            <form action={updateCartItemAction.bind(null, item.id, item.quantity - 1)}>
                              <button aria-label={`Quitar una unidad de ${item.variant.product.name}`} className="grid h-8 w-8 place-items-center rounded-full border border-neutral-300 transition hover:border-neutral-950">
                                <Minus className="h-4 w-4" aria-hidden />
                              </button>
                            </form>
                            <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                            <form action={updateCartItemAction.bind(null, item.id, item.quantity + 1)}>
                              <button aria-label={`Agregar una unidad de ${item.variant.product.name}`} className="grid h-8 w-8 place-items-center rounded-full border border-neutral-300 transition hover:border-neutral-950">
                                <Plus className="h-4 w-4" aria-hidden />
                              </button>
                            </form>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-lg border border-black/10 bg-white p-6 text-center">
                  <p className="font-black">Tu carrito esta vacio.</p>
                  <p className="mt-2 text-sm text-neutral-500">Agrega productos para iniciar una compra.</p>
                </div>
              )}
            </div>
            <div className="shrink-0 border-t border-black/10 bg-white p-5">
              <div className="mb-4 flex items-center justify-between text-sm">
                <span className="text-neutral-500">Subtotal</span>
                <span className="font-semibold text-neutral-950">{money(total)}</span>
              </div>
              <Link href="/checkout" className="flex h-12 w-full items-center justify-center rounded-full bg-neutral-950 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-neutral-800">
                Iniciar compra
              </Link>
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
