import { unstable_cache } from "next/cache";
import { cache } from "react";

import { catalogWhere, type CatalogFilters } from "@/lib/catalog-filters";
import { prisma } from "@/lib/prisma";

const productCardSelect = {
  id: true,
  name: true,
  slug: true,
  basePrice: true,
  salePrice: true,
  brand: { select: { name: true } },
  images: { orderBy: { position: "asc" as const }, take: 1, select: { url: true, altText: true } },
};

const navigationCategoriesCached = unstable_cache(
  () => prisma.category.findMany({ where: { isActive: true, parentId: null }, orderBy: { name: "asc" }, take: 6, select: { id: true, name: true, slug: true } }),
  ["store-navigation-categories"],
  { revalidate: 3600, tags: ["catalog", "categories"] },
);

export const getNavigationCategories = cache(navigationCategoriesCached);

const homeCatalogCached = unstable_cache(async () => {
  const [categories, featured, newest] = await Promise.all([
    prisma.category.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, take: 8, select: { id: true, name: true, slug: true, description: true } }),
    prisma.product.findMany({ where: { isActive: true }, orderBy: { createdAt: "asc" }, take: 4, select: productCardSelect }),
    prisma.product.findMany({ where: { isActive: true }, orderBy: { createdAt: "desc" }, take: 8, select: productCardSelect }),
  ]);
  return { categories, featured, newest };
}, ["home-catalog"], { revalidate: 300, tags: ["catalog", "products", "categories"] });

export const getHomeCatalog = cache(homeCatalogCached);

const facetsCached = unstable_cache(async () => {
  const [categories, brands, variants] = await Promise.all([
    prisma.category.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { name: true, slug: true } }),
    prisma.brand.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { name: true, slug: true } }),
    prisma.productVariant.findMany({ where: { isActive: true, product: { isActive: true } }, select: { color: true, size: true }, distinct: ["color", "size"] }),
  ]);
  return { categories, brands, variants };
}, ["catalog-facets"], { revalidate: 1800, tags: ["catalog", "categories", "brands", "products"] });

export const getCatalogFacets = cache(facetsCached);

export async function getCatalogProducts(filters: CatalogFilters, page: number, pageSize = 24) {
  const where = catalogWhere(filters);
  const orderBy = filters.sort === "price-desc" ? { basePrice: "desc" as const } : filters.sort === "price-asc" ? { basePrice: "asc" as const } : { createdAt: "desc" as const };
  const [products, total] = await Promise.all([
    prisma.product.findMany({ where, orderBy, skip: (page - 1) * pageSize, take: pageSize, select: { ...productCardSelect, createdAt: true, reviews: { select: { rating: true } }, variants: { select: { id: true } } } }),
    prisma.product.count({ where }),
  ]);

  const variantIds = products.flatMap((product) => product.variants.map((variant) => variant.id));
  const sales = variantIds.length ? await prisma.orderItem.groupBy({ by: ["variantId"], where: { variantId: { in: variantIds } }, _sum: { quantity: true } }) : [];
  const salesByVariant = new Map(sales.map((item) => [item.variantId, item._sum.quantity ?? 0]));
  const enriched = products.map((product) => ({
    ...product,
    rating: product.reviews.length ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length : 0,
    sold: product.variants.reduce((sum, variant) => sum + (salesByVariant.get(variant.id) ?? 0), 0),
  }));
  if (filters.sort === "best-rating") enriched.sort((a, b) => b.rating - a.rating);
  if (filters.sort === "best-selling") enriched.sort((a, b) => b.sold - a.sold);
  return { products: enriched, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

const productBySlugCached = unstable_cache(async (slug: string) => {
  const product = await prisma.product.findUnique({ where: { slug }, include: {
    brand: { select: { name: true } }, images: { orderBy: { position: "asc" }, select: { url: true, altText: true } },
    variants: { where: { isActive: true }, include: { stock: true }, orderBy: { createdAt: "asc" } },
    categories: { include: { category: { select: { id: true, name: true, slug: true } } } },
    reviews: { where: { isVisible: true }, select: { id: true, rating: true, title: true, comment: true, createdAt: true, user: { select: { name: true, firstName: true } } }, orderBy: { createdAt: "desc" }, take: 8 },
  }});
  if (!product) return null;
  const related = await prisma.product.findMany({ where: { isActive: true, id: { not: product.id }, categories: { some: { categoryId: { in: product.categories.map((item) => item.categoryId) } } } }, take: 4, select: productCardSelect });
  return { product, related };
}, ["product-detail"], { revalidate: 300, tags: ["catalog", "products"] });

export const getProductBySlug = cache(productBySlugCached);

const categoryBySlugCached = unstable_cache((slug: string) => prisma.category.findUnique({ where: { slug }, include: {
  products: { where: { product: { isActive: true } }, include: { product: { select: productCardSelect } }, take: 48 },
  children: { where: { isActive: true }, select: { id: true, name: true, slug: true } },
}}), ["category-detail"], { revalidate: 600, tags: ["catalog", "categories", "products"] });

export const getCategoryBySlug = cache(categoryBySlugCached);
