import type { Metadata } from "next";

import { CatalogFilters } from "@/components/store/catalog-filters";
import { ProductCard } from "@/components/store/product-card";
import { StoreShell } from "@/components/store/store-shell";
import { getCatalogFacets, getCatalogProducts } from "@/lib/catalog-data";
import { activeFilterCount, parseCatalogFilters } from "@/lib/catalog-filters";

export const metadata: Metadata = {
  title: "Productos",
  description: "Explora el catalogo completo de ErcLav con filtros por precio, marca, categoria, talle, color y stock.",
  alternates: { canonical: "/productos" },
  openGraph: { title: "Productos | ErcLav", description: "Catalogo filtrable de productos ErcLav.", type: "website", url: "/productos" },
};

type ProductsPageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };
const sortLabels = { newest: "Mas nuevos", "best-selling": "Mas vendidos", "price-desc": "Mayor precio", "price-asc": "Menor precio", "best-rating": "Mejor puntuacion" };

function pageHref(rawParams: Record<string, string | string[] | undefined>, page: number) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(rawParams)) {
    if (key === "page" || !value) continue;
    params.set(key, Array.isArray(value) ? value[0] : value);
  }
  params.set("page", String(page));
  return `/productos?${params.toString()}`;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const rawParams = await searchParams;
  const filters = parseCatalogFilters(rawParams);
  const rawPage = Array.isArray(rawParams.page) ? rawParams.page[0] : rawParams.page;
  const page = Math.max(1, Number.parseInt(rawPage ?? "1", 10) || 1);
  const [{ products, total, totalPages }, { categories, brands, variants }] = await Promise.all([
    getCatalogProducts(filters, page), getCatalogFacets(),
  ]);
  const colors = Array.from(new Set(variants.map((variant) => variant.color).filter(Boolean))) as string[];
  const sizes = Array.from(new Set(variants.map((variant) => variant.size).filter(Boolean))) as string[];
  const count = activeFilterCount(filters);

  return <StoreShell><main>
    <section className="border-b border-black/10 bg-white"><div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8"><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-bold uppercase text-neutral-500">Catalogo</p><h1 className="mt-2 text-4xl font-black sm:text-5xl">{filters.q ? `Busqueda: ${filters.q}` : "Productos"}</h1><p className="mt-3 max-w-2xl text-neutral-600">{total} resultados disponibles{count ? ` · ${count} filtros activos` : ""}. Filtra por marca, precio, talle, color y disponibilidad.</p></div><div className="rounded-lg border border-black/10 bg-[#f7f7f5] px-4 py-3 text-sm font-semibold text-neutral-600">Orden: {sortLabels[filters.sort]}</div></div></div></section>
    <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[300px_1fr] lg:px-8">
      <CatalogFilters filters={filters} activeCount={count} categories={categories.map((item) => ({ label: item.name, value: item.slug }))} brands={brands.map((item) => ({ label: item.name, value: item.slug }))} colors={colors} sizes={sizes} />
      <section aria-live="polite"><div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div>
        {!products.length ? <div className="rounded-lg border border-black/10 bg-white p-10 text-center"><p className="text-xl font-black">No encontramos productos.</p><p className="mt-2 text-sm text-neutral-500">Proba limpiar filtros o ampliar el rango de precio.</p></div> : null}
        {totalPages > 1 ? <nav aria-label="Paginacion del catalogo" className="mt-8 flex flex-wrap justify-center gap-2">{Array.from({ length: totalPages }, (_, index) => index + 1).map((number) => <a key={number} href={pageHref(rawParams, number)} aria-current={number === page ? "page" : undefined} aria-label={`Pagina ${number}`} className={number === page ? "grid h-10 w-10 place-items-center rounded-full bg-neutral-950 text-sm font-bold text-white" : "grid h-10 w-10 place-items-center rounded-full border border-black/15 bg-white text-sm font-bold hover:border-neutral-950"}>{number}</a>)}</nav> : null}
      </section>
    </div>
  </main></StoreShell>;
}
