import { SlidersHorizontal, X } from "lucide-react";
import Link from "next/link";

import type { CatalogFilters, CatalogSort } from "@/lib/catalog-filters";

type FilterOption = {
  label: string;
  value: string;
};

const sortOptions: { label: string; value: CatalogSort }[] = [
  { label: "Mas nuevos", value: "newest" },
  { label: "Mas vendidos", value: "best-selling" },
  { label: "Mayor precio", value: "price-desc" },
  { label: "Menor precio", value: "price-asc" },
  { label: "Mejor puntuacion", value: "best-rating" },
];

export function CatalogFilters({
  filters,
  categories,
  brands,
  colors,
  sizes,
  activeCount,
}: {
  filters: CatalogFilters;
  categories: FilterOption[];
  brands: FilterOption[];
  colors: string[];
  sizes: string[];
  activeCount: number;
}) {
  return (
    <aside className="rounded-lg border border-black/10 bg-white p-5 shadow-sm lg:sticky lg:top-32 lg:self-start">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-neutral-950 text-white">
            <SlidersHorizontal className="h-4 w-4" aria-hidden />
          </span>
          <h2 className="font-bold">Filtros</h2>
        </div>
        {activeCount ? (
          <Link href="/productos" className="inline-flex items-center gap-1 text-sm font-semibold text-neutral-500 hover:text-neutral-950">
            <X className="h-4 w-4" aria-hidden />
            Limpiar
          </Link>
        ) : null}
      </div>

      <form action="/productos" className="mt-6 space-y-5">
        <div>
          <label className="text-sm font-semibold text-neutral-700">Buscar</label>
          <input
            name="q"
            defaultValue={filters.q}
            placeholder="Producto, marca o SKU"
            className="mt-2 h-11 w-full rounded-md border border-neutral-300 bg-[#fbfaf8] px-3 text-sm outline-none transition focus:border-neutral-950 focus:bg-white"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-semibold text-neutral-700">Precio min.</label>
            <input
              name="minPrice"
              type="number"
              min="0"
              defaultValue={filters.minPrice}
              className="mt-2 h-11 w-full rounded-md border border-neutral-300 bg-[#fbfaf8] px-3 text-sm outline-none transition focus:border-neutral-950 focus:bg-white"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-neutral-700">Precio max.</label>
            <input
              name="maxPrice"
              type="number"
              min="0"
              defaultValue={filters.maxPrice}
              className="mt-2 h-11 w-full rounded-md border border-neutral-300 bg-[#fbfaf8] px-3 text-sm outline-none transition focus:border-neutral-950 focus:bg-white"
            />
          </div>
        </div>

        <FilterSelect label="Categoria" name="category" value={filters.category} options={categories} />
        <FilterSelect label="Marca" name="brand" value={filters.brand} options={brands} />
        <FilterSelect label="Color" name="color" value={filters.color} options={colors.map((value) => ({ label: value, value }))} />
        <FilterSelect label="Talle" name="size" value={filters.size} options={sizes.map((value) => ({ label: value, value }))} />

        <label className="flex items-center justify-between rounded-md border border-neutral-200 bg-[#fbfaf8] px-3 py-3 text-sm font-semibold text-neutral-700">
          Solo con stock
          <input name="stock" value="1" type="checkbox" defaultChecked={filters.inStock} className="h-4 w-4 accent-neutral-950" />
        </label>

        <FilterSelect label="Ordenar por" name="sort" value={filters.sort} options={sortOptions} />

        <button className="h-11 w-full rounded-full bg-neutral-950 px-5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-neutral-800">
          Aplicar filtros
        </button>
      </form>
    </aside>
  );
}

function FilterSelect({
  label,
  name,
  value,
  options,
}: {
  label: string;
  name: string;
  value?: string;
  options: FilterOption[];
}) {
  return (
    <div>
      <label className="text-sm font-semibold text-neutral-700">{label}</label>
      <select
        name={name}
        defaultValue={value ?? ""}
        className="mt-2 h-11 w-full rounded-md border border-neutral-300 bg-[#fbfaf8] px-3 text-sm outline-none transition focus:border-neutral-950 focus:bg-white"
      >
        <option value="">Todos</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
