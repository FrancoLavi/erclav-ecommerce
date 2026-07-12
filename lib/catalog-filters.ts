import type { Prisma } from "@prisma/client";

export type CatalogSort =
  | "newest"
  | "price-desc"
  | "price-asc"
  | "best-rating"
  | "best-selling";

export type CatalogFilters = {
  q?: string;
  minPrice?: number;
  maxPrice?: number;
  category?: string;
  brand?: string;
  color?: string;
  size?: string;
  inStock?: boolean;
  sort: CatalogSort;
};

export function parseCatalogFilters(searchParams: Record<string, string | string[] | undefined>): CatalogFilters {
  const getString = (key: string) => {
    const value = searchParams[key];
    return Array.isArray(value) ? value[0] : value;
  };

  const numberValue = (key: string) => {
    const value = Number(getString(key));
    return Number.isFinite(value) && value >= 0 ? value : undefined;
  };

  const sort = getString("sort");

  return {
    q: getString("q")?.trim() || undefined,
    minPrice: numberValue("minPrice"),
    maxPrice: numberValue("maxPrice"),
    category: getString("category") || undefined,
    brand: getString("brand") || undefined,
    color: getString("color") || undefined,
    size: getString("size") || undefined,
    inStock: getString("stock") === "1",
    sort:
      sort === "price-desc" ||
      sort === "price-asc" ||
      sort === "best-rating" ||
      sort === "best-selling" ||
      sort === "newest"
        ? sort
        : "newest",
  };
}

export function catalogWhere(filters: CatalogFilters): Prisma.ProductWhereInput {
  const priceFilters: Prisma.ProductWhereInput[] = [];

  if (filters.minPrice !== undefined) {
    priceFilters.push({
      OR: [{ salePrice: { gte: filters.minPrice } }, { salePrice: null, basePrice: { gte: filters.minPrice } }],
    });
  }

  if (filters.maxPrice !== undefined) {
    priceFilters.push({
      OR: [{ salePrice: { lte: filters.maxPrice } }, { salePrice: null, basePrice: { lte: filters.maxPrice } }],
    });
  }

  return {
    isActive: true,
    ...(filters.q
      ? {
          OR: [
            { name: { contains: filters.q, mode: "insensitive" } },
            { description: { contains: filters.q, mode: "insensitive" } },
            { brand: { name: { contains: filters.q, mode: "insensitive" } } },
            { sku: { contains: filters.q, mode: "insensitive" } },
            { variants: { some: { sku: { contains: filters.q, mode: "insensitive" } } } },
          ],
        }
      : {}),
    ...(filters.category ? { categories: { some: { category: { slug: filters.category } } } } : {}),
    ...(filters.brand ? { brand: { slug: filters.brand } } : {}),
    ...(filters.color || filters.size || filters.inStock
      ? {
          variants: {
            some: {
              isActive: true,
              ...(filters.color ? { color: { equals: filters.color, mode: "insensitive" } } : {}),
              ...(filters.size ? { size: { equals: filters.size, mode: "insensitive" } } : {}),
              ...(filters.inStock ? { stock: { quantity: { gt: 0 } } } : {}),
            },
          },
        }
      : {}),
    ...(priceFilters.length ? { AND: priceFilters } : {}),
  };
}

export function activeFilterCount(filters: CatalogFilters) {
  return [
    filters.q,
    filters.minPrice,
    filters.maxPrice,
    filters.category,
    filters.brand,
    filters.color,
    filters.size,
    filters.inStock,
  ].filter(Boolean).length;
}
