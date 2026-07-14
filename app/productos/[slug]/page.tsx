import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { notFound } from "next/navigation";
import { Heart, ShieldCheck, Star, Truck } from "lucide-react";

import { toggleFavoriteAction } from "@/actions/store";
import { AddToCartForm } from "@/components/store/add-to-cart-form";
import { ProductCard } from "@/components/store/product-card";
import { ProductGallery } from "@/components/store/product-gallery";
import { StoreShell } from "@/components/store/store-shell";
import { money, shortDate } from "@/lib/format";
import { getProductBySlug } from "@/lib/catalog-data";
import { productImageUrl } from "@/lib/product-image";
import { whatsappUrl } from "@/lib/whatsapp";

const ReviewForm = dynamic(() => import("@/components/store/review-form").then((module) => module.ReviewForm));
export const revalidate = 300;

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = (await getProductBySlug(slug))?.product;

  if (!product) return {};

  return {
    title: product.name,
    description: product.description ?? `Compra ${product.name} en ErcLav.`,
    openGraph: {
      title: `${product.name} | ErcLav`,
      description: product.description ?? `Compra ${product.name} en ErcLav.`,
      images: product.images[0] ? [{ url: productImageUrl(product.images[0].url) }] : undefined,
      type: "website",
      url: `/productos/${product.slug}`,
    },
    alternates: { canonical: `/productos/${product.slug}` },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const data = await getProductBySlug(slug);
  const product = data?.product;

  if (!product || !product.isActive) notFound();

  const related = data.related;

  const avg =
    product.reviews.length > 0
      ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length
      : 0;
  const price = product.salePrice ?? product.basePrice;
  const whatsappHref = whatsappUrl(
    `Hola, quisiera mas informacion sobre ${product.name}: ${process.env.AUTH_URL ?? "http://localhost:3000"}/productos/${product.slug}`,
  );

  return (
    <StoreShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "Product", name: product.name, description: product.description, image: product.images.map((image) => productImageUrl(image.url)), sku: product.sku, brand: { "@type": "Brand", name: product.brand?.name ?? "ErcLav" }, offers: { "@type": "Offer", priceCurrency: "ARS", price: Number(price), availability: product.variants.some((variant) => (variant.stock?.quantity ?? 0) - (variant.stock?.reservedQuantity ?? 0) > 0) ? "https://schema.org/InStock" : "https://schema.org/OutOfStock", url: `${process.env.AUTH_URL ?? "http://localhost:3000"}/productos/${product.slug}` }, aggregateRating: product.reviews.length ? { "@type": "AggregateRating", ratingValue: avg.toFixed(1), reviewCount: product.reviews.length } : undefined }).replaceAll("<", "\\u003c") }} />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <ProductGallery images={product.images} name={product.name} />
          <section className="lg:sticky lg:top-32 lg:self-start">
            <div className="rounded-lg border border-black/10 bg-white p-5 shadow-sm sm:p-6">
              <p className="text-sm font-bold uppercase text-neutral-500">{product.brand?.name ?? "ErcLav"}</p>
              <h1 className="mt-2 text-4xl font-black leading-tight tracking-tight">{product.name}</h1>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <p className="text-3xl font-black">{money(price.toString())}</p>
                {product.salePrice ? (
                  <p className="rounded-full bg-neutral-100 px-3 py-1 text-sm font-bold text-neutral-500 line-through">
                    {money(product.basePrice.toString())}
                  </p>
                ) : null}
              </div>
              <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-neutral-600">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" aria-hidden />
                {avg ? avg.toFixed(1) : "Sin reviews"} · {product.reviews.length} opiniones
              </div>
              <p className="mt-6 leading-7 text-neutral-600">{product.description ?? "Producto seleccionado por ErcLav."}</p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="flex items-center gap-3 rounded-lg bg-[#f7f7f5] p-3 text-sm font-semibold text-neutral-700">
                  <Truck className="h-5 w-5 text-[#1e6bff]" aria-hidden />
                  Envios claros
                </div>
                <div className="flex items-center gap-3 rounded-lg bg-[#f7f7f5] p-3 text-sm font-semibold text-neutral-700">
                  <ShieldCheck className="h-5 w-5 text-[#2f7d32]" aria-hidden />
                  Compra protegida
                </div>
              </div>
              <div className="mt-8">
                <AddToCartForm variants={product.variants} />
              </div>
              <form action={toggleFavoriteAction.bind(null, product.id)} className="mt-3">
                <button className="flex h-12 w-full items-center justify-center gap-2 rounded-full border border-neutral-300 bg-white text-sm font-bold transition hover:border-neutral-950 hover:bg-neutral-50">
                  <Heart className="h-4 w-4" aria-hidden />
                  Agregar a wishlist
                </button>
              </form>
              {whatsappHref ? (
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#25D366] px-5 text-sm font-bold text-neutral-950 transition hover:bg-[#20bd5a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2"
                >
                  Consultar este producto por WhatsApp
                </a>
              ) : null}
            </div>
          </section>
        </div>

        <section className="mt-16 grid gap-8 lg:grid-cols-[380px_1fr]">
          <ReviewForm productId={product.id} />
          <div>
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-bold uppercase text-neutral-500">Comunidad</p>
                <h2 className="mt-2 text-3xl font-black tracking-tight">Reviews</h2>
              </div>
              <p className="text-sm font-semibold text-neutral-500">{product.reviews.length} opiniones</p>
            </div>
            <div className="mt-5 space-y-4">
              {product.reviews.map((review) => (
                <article key={review.id} className="rounded-lg border border-black/10 bg-white p-5">
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-bold">{review.user.name ?? review.user.firstName}</p>
                    <p className="text-xs text-neutral-500">{shortDate(review.createdAt)}</p>
                  </div>
                  <p className="mt-2 text-sm font-bold">{review.rating} estrellas · {review.title ?? "Opinion"}</p>
                  <p className="mt-2 text-sm leading-6 text-neutral-600">{review.comment}</p>
                </article>
              ))}
              {!product.reviews.length ? (
                <div className="rounded-lg border border-black/10 bg-white p-6 text-sm text-neutral-500">
                  Todavia no hay reviews.
                </div>
              ) : null}
            </div>
          </div>
        </section>

        {related.length ? (
          <section className="mt-16">
            <p className="text-sm font-bold uppercase text-neutral-500">Tambien te puede gustar</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight">Productos relacionados</h2>
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </section>
        ) : null}
      </main>
    </StoreShell>
  );
}
