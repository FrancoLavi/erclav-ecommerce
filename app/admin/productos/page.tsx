import Link from "next/link";
import Image from "next/image";
import { Edit, Plus, Trash2 } from "lucide-react";

import { deleteProductAction } from "@/actions/admin";
import { AdminShell } from "@/components/admin/admin-shell";
import { buttonClass, secondaryButtonClass } from "@/components/admin/ui";
import { money } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export default async function ProductsPage() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      brand: true,
      categories: { include: { category: true } },
      variants: { include: { stock: true } },
      images: { orderBy: { position: "asc" }, take: 1 },
    },
  });

  return (
    <AdminShell
      title="Productos"
      description="Alta, edicion, baja logica, imagenes, variantes y stock del catalogo."
      actions={
        <Link href="/admin/productos/nuevo" className={buttonClass}>
          <Plus className="h-4 w-4" aria-hidden />
          Nuevo producto
        </Link>
      }
    >
      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Producto</th>
                <th className="px-4 py-3 font-medium">Marca</th>
                <th className="px-4 py-3 font-medium">Categorias</th>
                <th className="px-4 py-3 font-medium">Precio</th>
                <th className="px-4 py-3 font-medium">Stock</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((product) => {
                const stock = product.variants.reduce((total, variant) => total + (variant.stock?.quantity ?? 0), 0);
                return (
                  <tr key={product.id}>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 overflow-hidden rounded-md bg-slate-100">
                          {product.images[0] ? (
                            <Image
                              src={product.images[0].url}
                              alt={product.name}
                              width={48}
                              height={48}
                              className="h-full w-full object-cover"
                            />
                          ) : null}
                        </div>
                        <div>
                          <p className="font-medium text-slate-950">{product.name}</p>
                          <p className="text-xs text-slate-500">{product.sku ?? product.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-slate-700">{product.brand?.name ?? "Sin marca"}</td>
                    <td className="px-4 py-4 text-slate-700">
                      {product.categories.map((item) => item.category.name).join(", ") || "Sin categorias"}
                    </td>
                    <td className="px-4 py-4 font-medium text-slate-950">{money(product.basePrice.toString())}</td>
                    <td className="px-4 py-4 text-slate-700">{stock}</td>
                    <td className="px-4 py-4">
                      <span className={product.isActive ? "text-emerald-700" : "text-slate-500"}>
                        {product.isActive ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex gap-2">
                        <Link href={`/admin/productos/${product.id}/editar`} className={secondaryButtonClass}>
                          <Edit className="h-4 w-4" aria-hidden />
                          Editar
                        </Link>
                        <form action={deleteProductAction.bind(null, product.id)}>
                          <button type="submit" className={secondaryButtonClass}>
                            <Trash2 className="h-4 w-4" aria-hidden />
                            Eliminar
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!products.length ? <p className="p-5 text-sm text-slate-500">Todavia no hay productos.</p> : null}
      </section>
    </AdminShell>
  );
}
