import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { StoreShell } from "@/components/store/store-shell";
import { ProductCard } from "@/components/store/product-card";
import { getCategoryBySlug } from "@/lib/catalog-data";

export const revalidate = 600;

type CategoryPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return {};

  return {
    title: category.name,
    description: category.description ?? `Compra productos de ${category.name} en ErcLav.`,
    openGraph: {
      title: `${category.name} | ErcLav`,
      description: category.description ?? `Compra productos de ${category.name} en ErcLav.`,
      type: "website",
      url: `/categorias/${category.slug}`,
    },
    alternates: { canonical: `/categorias/${category.slug}` },
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category) notFound();

  return (
    <StoreShell>
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold uppercase text-neutral-500">Categoria</p>
        <h1 className="mt-2 text-4xl font-black tracking-tight">{category.name}</h1>
        <p className="mt-3 max-w-2xl text-neutral-600">{category.description ?? "Seleccion curada para comprar mejor."}</p>
        {category.children.length ? (
          <div className="mt-6 flex flex-wrap gap-2">
            {category.children.map((child) => (
              <Link key={child.id} href={`/productos?category=${child.slug}`} className="rounded-full bg-white px-4 py-2 text-sm font-semibold ring-1 ring-black/10">
                {child.name}
              </Link>
            ))}
          </div>
        ) : null}
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {category.products.map(({ product }) => <ProductCard key={product.id} product={product} />)}
        </div>
      </main>
    </StoreShell>
  );
}
