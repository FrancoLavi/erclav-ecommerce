"use client";

import { useState } from "react";
import Image from "next/image";

import { productImageUrl } from "@/lib/product-image";

export function ProductGallery({
  images,
  name,
}: {
  images: { url: string; altText: string | null }[];
  name: string;
}) {
  const [active, setActive] = useState(images[0] ? productImageUrl(images[0].url) : undefined);

  return (
    <div className="grid gap-3 lg:grid-cols-[88px_1fr]">
      <div className="order-2 flex gap-3 overflow-x-auto lg:order-1 lg:flex-col">
        {images.map((image) => (
          <button
            key={image.url}
            type="button"
            onClick={() => setActive(productImageUrl(image.url))}
            aria-label={`Ver imagen de ${image.altText ?? name}`}
            aria-pressed={productImageUrl(image.url) === active}
            className={
              productImageUrl(image.url) === active
                ? "relative h-20 w-20 shrink-0 overflow-hidden rounded-md bg-neutral-100 ring-2 ring-neutral-950"
                : "relative h-20 w-20 shrink-0 overflow-hidden rounded-md bg-neutral-100 ring-1 ring-black/10 transition hover:ring-neutral-500"
            }
          >
            <Image src={productImageUrl(image.url)} alt={image.altText ?? name} fill sizes="80px" className="object-cover" />
          </button>
        ))}
      </div>
      <div className="relative order-1 aspect-[4/5] overflow-hidden rounded-lg bg-[#ebe9e4] shadow-sm ring-1 ring-black/5 lg:order-2">
        {active ? (
          <Image src={active} alt={name} fill priority sizes="(max-width: 1024px) 100vw, 52vw" quality={85} className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-neutral-400">Sin imagen</div>
        )}
      </div>
    </div>
  );
}
