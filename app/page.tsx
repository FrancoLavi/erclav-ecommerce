import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, BadgeCheck, PackageCheck, ShieldCheck, Sparkles, Truck } from "lucide-react";

import { StoreShell } from "@/components/store/store-shell";
import { ProductCard } from "@/components/store/product-card";
import { money } from "@/lib/format";
import { getHomeCatalog } from "@/lib/catalog-data";

export const revalidate = 300;

export const metadata: Metadata = {
  title: { absolute: "ErcLav | Ecommerce premium" },
  description: "Descubri productos destacados, novedades y colecciones seleccionadas en ErcLav.",
  openGraph: {
    title: "ErcLav | Ecommerce premium",
    description: "Catalogo moderno con productos destacados, nuevos lanzamientos y compra segura.",
    url: "/",
    siteName: "ErcLav",
    type: "website",
  },
  alternates: { canonical: "/" },
};

const serviceHighlights = [
  { label: "Envios rapidos", text: "Seguimiento y entregas claras", icon: Truck },
  { label: "Pagos protegidos", text: "Mercado Pago, Stripe y checkout seguro", icon: ShieldCheck },
  { label: "Stock actualizado", text: "Disponibilidad sincronizada", icon: PackageCheck },
];

export default async function HomePage() {
  const { categories, featured, newest } = await getHomeCatalog();

  const heroProduct = featured[0] ?? newest[0];
  const heroImage = heroProduct?.images[0];
  const heroPrice = heroProduct ? heroProduct.salePrice ?? heroProduct.basePrice : null;

  return (
    <StoreShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "OnlineStore", name: "ErcLav", url: process.env.AUTH_URL ?? "http://localhost:3000", description: "Ecommerce premium con catalogo curado y compra segura.", currenciesAccepted: "ARS", paymentAccepted: "Mercado Pago, Stripe" }).replaceAll("<", "\\u003c") }} />
      <main>
        <section className="relative isolate overflow-hidden bg-[#080808] text-white">
          {heroImage ? (
            <Image
              src={heroImage.url}
              alt={heroProduct.name}
              fill
              priority
              sizes="100vw"
              quality={70}
              className="absolute inset-0 -z-10 object-cover opacity-35"
            />
          ) : null}
          <div className="absolute inset-0 -z-10 bg-black/55" />

          <div className="mx-auto grid min-h-[calc(100vh-76px)] max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[0.92fr_1.08fr] lg:px-8">
            <div className="max-w-2xl">
              <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white/80 backdrop-blur">
                <Sparkles className="h-4 w-4" aria-hidden />
                Seleccion premium 2026
              </p>
              <h1 className="mt-6 text-5xl font-black leading-[0.95] tracking-tight sm:text-7xl lg:text-8xl">
                ErcLav
              </h1>
              <p className="mt-6 max-w-xl text-base leading-8 text-white/72 sm:text-lg">
                Un ecommerce rapido, visual y confiable para descubrir productos curados, pagar seguro y comprar sin
                vueltas desde cualquier pantalla.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/productos"
                  className="inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 text-sm font-bold text-neutral-950 shadow-lg shadow-black/20 transition hover:-translate-y-0.5 hover:bg-neutral-100"
                >
                  Comprar ahora
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
                <Link
                  href="#nuevos"
                  className="inline-flex h-12 items-center rounded-full border border-white/25 px-6 text-sm font-bold text-white transition hover:bg-white/10"
                >
                  Ver novedades
                </Link>
              </div>
              <div className="mt-10 grid max-w-xl grid-cols-3 gap-3 text-sm">
                {["Checkout seguro", "Envios claros", "Soporte real"].map((item) => (
                  <div key={item} className="border-l border-white/20 pl-3 text-white/70">
                    <BadgeCheck className="mb-2 h-4 w-4 text-white" aria-hidden />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {heroProduct ? (
              <Link
                href={`/productos/${heroProduct.slug}`}
                className="group relative block overflow-hidden rounded-lg bg-white text-neutral-950 shadow-2xl shadow-black/30 ring-1 ring-white/15"
              >
                <div className="relative aspect-[5/4] bg-[#e8e4dc]">
                  {heroImage ? (
                    <Image
                      src={heroImage.url}
                      alt={heroProduct.name}
                      fill
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      quality={82}
                      className="object-cover transition duration-700 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-neutral-400">{heroProduct.name}</div>
                  )}
                </div>
                <div className="grid gap-4 p-5 sm:grid-cols-[1fr_auto] sm:items-end">
                  <div>
                    <p className="text-xs font-bold uppercase text-neutral-500">{heroProduct.brand?.name ?? "ErcLav"}</p>
                    <h2 className="mt-1 text-2xl font-black tracking-tight">{heroProduct.name}</h2>
                  </div>
                  {heroPrice ? <p className="text-xl font-black">{money(heroPrice.toString())}</p> : null}
                </div>
              </Link>
            ) : null}
          </div>
        </section>

        <section className="border-b border-black/5 bg-white">
          <div className="mx-auto grid max-w-7xl gap-3 px-4 py-5 sm:px-6 md:grid-cols-3 lg:px-8">
            {serviceHighlights.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="flex items-center gap-4 rounded-lg border border-black/10 bg-white p-4">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#edf7ee] text-[#1f6f3d]">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <div>
                    <p className="text-sm font-black">{item.label}</p>
                    <p className="mt-1 text-sm text-neutral-500">{item.text}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase text-neutral-500">Comprar por categoria</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Explora colecciones</h2>
            </div>
            <Link href="/productos" className="hidden text-sm font-bold text-neutral-600 hover:text-neutral-950 sm:block">
              Ver catalogo
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((category, index) => (
              <Link
                key={category.id}
                href={`/productos?category=${category.slug}`}
                className="group rounded-lg border border-black/10 bg-white p-5 transition hover:-translate-y-0.5 hover:border-neutral-950 hover:shadow-lg"
              >
                <div className="mb-5 h-1.5 w-14 rounded-full bg-[#e41f26]" style={{ backgroundColor: index % 3 === 1 ? "#1e6bff" : index % 3 === 2 ? "#2f7d32" : "#e41f26" }} />
                <p className="text-lg font-black">{category.name}</p>
                <p className="mt-2 min-h-10 text-sm leading-5 text-neutral-500">{category.description ?? "Explorar seleccion"}</p>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-neutral-950">
                  Ver productos
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" aria-hidden />
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="bg-[#efeee9] py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-6 flex items-end justify-between">
              <div>
                <p className="text-sm font-bold uppercase text-neutral-500">Seleccionados</p>
                <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Productos destacados</h2>
              </div>
              <Link href="/productos" className="hidden text-sm font-bold text-neutral-600 hover:text-neutral-950 sm:block">
                Ver todos
              </Link>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {featured.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>

        <section id="nuevos" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-6">
            <p className="text-sm font-bold uppercase text-neutral-500">Ultimos ingresos</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Productos nuevos</h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {newest.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      </main>
    </StoreShell>
  );
}
