import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingBag, Star } from "lucide-react";

import { toggleFavoriteAction } from "@/actions/store";
import { money } from "@/lib/format";

type ProductCardProps = {
  product: {
    id: string;
    name: string;
    slug: string;
    basePrice: { toString(): string };
    salePrice: { toString(): string } | null;
    brand?: { name: string } | null;
    images: { url: string; altText: string | null }[];
  };
};

export function ProductCard({ product }: ProductCardProps) {
  const image = product.images[0];
  const price = product.salePrice ?? product.basePrice;
  const hasSale = Boolean(product.salePrice);

  return (
    <article className="group">
      <Link href={`/productos/${product.slug}`} className="block">
        <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-[#ebe9e4] ring-1 ring-black/5">
          {image ? (
            <Image
              src={image.url}
              alt={image.altText ?? product.name}
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              className="object-cover transition duration-700 group-hover:scale-[1.04]"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-neutral-400">Sin imagen</div>
          )}
          <div className="absolute left-3 top-3 flex gap-2">
            {hasSale ? (
              <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-neutral-950 shadow-sm">
                Oferta
              </span>
            ) : (
              <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-neutral-700 shadow-sm">
                Nuevo
              </span>
            )}
          </div>
          <div className="absolute inset-x-3 bottom-3 translate-y-3 opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            <div className="flex items-center justify-center gap-2 rounded-full bg-neutral-950 px-4 py-3 text-sm font-semibold text-white shadow-xl">
              <ShoppingBag className="h-4 w-4" aria-hidden />
              Ver producto
            </div>
          </div>
        </div>
      </Link>
      <div className="mt-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase text-neutral-500">
            <span className="truncate">{product.brand?.name ?? "ErcLav"}</span>
            <span className="inline-flex items-center gap-1 text-neutral-400">
              <Star className="h-3.5 w-3.5 fill-neutral-300 text-neutral-300" aria-hidden />
              Premium
            </span>
          </div>
          <Link href={`/productos/${product.slug}`} className="mt-1 block font-semibold leading-5 text-neutral-950 transition hover:text-neutral-600">
            {product.name}
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <p className="text-sm font-black">{money(price.toString())}</p>
            {hasSale ? (
              <p className="text-xs font-semibold text-neutral-400 line-through">{money(product.basePrice.toString())}</p>
            ) : null}
          </div>
        </div>
        <form action={toggleFavoriteAction.bind(null, product.id)}>
          <button className="grid h-10 w-10 place-items-center rounded-full bg-white shadow-sm ring-1 ring-black/10 transition hover:-translate-y-0.5 hover:bg-neutral-50" aria-label={`Alternar ${product.name} en favoritos`}>
            <Heart className="h-4 w-4" aria-hidden />
          </button>
        </form>
      </div>
    </article>
  );
}
