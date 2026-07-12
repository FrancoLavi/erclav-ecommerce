"use client";

import { useActionState } from "react";
import Image from "next/image";
import type { Brand, Category, Product, ProductImage, ProductVariant, Stock } from "@prisma/client";
import { ImagePlus, Plus } from "lucide-react";

import { createProductAction, updateProductAction } from "@/actions/admin";
import { ActionMessage } from "@/components/admin/action-message";
import { AdminSubmitButton } from "@/components/admin/admin-submit-button";
import { Field, inputClass, secondaryButtonClass, textareaClass } from "@/components/admin/ui";

type ProductWithRelations = Product & {
  categories: { categoryId: string }[];
  images: ProductImage[];
  variants: (ProductVariant & { stock: Stock | null })[];
};

type ProductFormProps = {
  product?: ProductWithRelations;
  categories: Category[];
  brands: Brand[];
};

const initialState = {
  ok: false,
  message: "",
};

const emptyVariants = Array.from({ length: 4 }, () => ({
  id: "",
  sku: "",
  color: "",
  size: "",
  price: "",
  quantity: "",
}));

export function ProductForm({ product, categories, brands }: ProductFormProps) {
  const action = product ? updateProductAction.bind(null, product.id) : createProductAction;
  const [state, formAction] = useActionState(action, initialState);
  const selectedCategories = new Set(product?.categories.map((category) => category.categoryId) ?? []);
  const variants = product?.variants.length
    ? [
        ...product.variants.map((variant) => ({
          id: variant.id,
          sku: variant.sku,
          color: variant.color ?? "",
          size: variant.size ?? "",
          price: variant.price?.toString() ?? "",
          quantity: variant.stock?.quantity.toString() ?? "0",
        })),
        ...emptyVariants.slice(0, 2),
      ]
    : emptyVariants;

  return (
    <form action={formAction} className="space-y-6">
      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-950">Informacion principal</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Nombre">
              <input name="name" defaultValue={product?.name} required className={inputClass} />
            </Field>
            <Field label="Slug">
              <input name="slug" defaultValue={product?.slug} required className={inputClass} />
            </Field>
            <Field label="SKU general">
              <input name="sku" defaultValue={product?.sku ?? ""} className={inputClass} />
            </Field>
            <Field label="Marca">
              <select name="brandId" defaultValue={product?.brandId ?? ""} className={inputClass}>
                <option value="">Sin marca</option>
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Precio base">
              <input
                name="basePrice"
                type="number"
                step="0.01"
                min="0"
                defaultValue={product?.basePrice.toString()}
                required
                className={inputClass}
              />
            </Field>
            <Field label="Precio oferta">
              <input
                name="salePrice"
                type="number"
                step="0.01"
                min="0"
                defaultValue={product?.salePrice?.toString() ?? ""}
                className={inputClass}
              />
            </Field>
          </div>
          <div className="mt-4">
            <Field label="Descripcion">
              <textarea name="description" defaultValue={product?.description ?? ""} className={textareaClass} />
            </Field>
          </div>
          <label className="mt-4 flex items-center gap-2 text-sm font-medium text-slate-700">
            <input name="isActive" type="checkbox" defaultChecked={product?.isActive ?? true} className="h-4 w-4" />
            Producto activo
          </label>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-950">Categorias</h2>
          <div className="mt-4 max-h-80 space-y-2 overflow-auto pr-1">
            {categories.map((category) => (
              <label key={category.id} className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  name="categoryIds"
                  type="checkbox"
                  value={category.id}
                  defaultChecked={selectedCategories.has(category.id)}
                  className="h-4 w-4"
                />
                {category.name}
              </label>
            ))}
            {!categories.length ? <p className="text-sm text-slate-500">Todavia no hay categorias.</p> : null}
          </div>
        </section>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <Plus className="h-4 w-4 text-slate-500" aria-hidden />
          <h2 className="text-base font-semibold text-slate-950">Variantes y stock</h2>
        </div>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="text-slate-500">
              <tr>
                <th className="pb-3 font-medium">SKU</th>
                <th className="pb-3 font-medium">Color</th>
                <th className="pb-3 font-medium">Talle</th>
                <th className="pb-3 font-medium">Precio</th>
                <th className="pb-3 font-medium">Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {variants.map((variant, index) => (
                <tr key={`${variant.id}-${index}`}>
                  <td className="py-2">
                    <input type="hidden" name="variantId" defaultValue={variant.id} />
                    <input name="variantSku" defaultValue={variant.sku} className={inputClass} />
                  </td>
                  <td className="py-2">
                    <input name="variantColor" defaultValue={variant.color} className={inputClass} />
                  </td>
                  <td className="py-2">
                    <input name="variantSize" defaultValue={variant.size} className={inputClass} />
                  </td>
                  <td className="py-2">
                    <input name="variantPrice" type="number" step="0.01" min="0" defaultValue={variant.price} className={inputClass} />
                  </td>
                  <td className="py-2">
                    <input name="variantQuantity" type="number" min="0" defaultValue={variant.quantity} className={inputClass} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <ImagePlus className="h-4 w-4 text-slate-500" aria-hidden />
          <h2 className="text-base font-semibold text-slate-950">Imagenes</h2>
        </div>
        <input
          name="images"
          type="file"
          accept="image/*"
          multiple
          className="mt-5 block w-full rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-600"
        />
        {product?.images.length ? (
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {product.images.map((image) => (
              <div key={image.id} className="overflow-hidden rounded-md border border-slate-200">
                <Image
                  src={image.url}
                  alt={image.altText ?? product.name}
                  width={320}
                  height={128}
                  className="h-32 w-full object-cover"
                />
                <div className="p-3 text-xs text-slate-500">{image.isPrimary ? "Principal" : "Galeria"}</div>
              </div>
            ))}
          </div>
        ) : null}
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <AdminSubmitButton label={product ? "Actualizar producto" : "Crear producto"} />
        <a href="/admin/productos" className={secondaryButtonClass}>
          Volver
        </a>
        <ActionMessage ok={state.ok} message={state.message} />
      </div>
    </form>
  );
}
