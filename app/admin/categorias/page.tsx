import { AdminShell } from "@/components/admin/admin-shell";
import { CategoryForm } from "@/components/admin/category-form";
import { Panel } from "@/components/admin/ui";
import { prisma } from "@/lib/prisma";

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: [{ parentId: "asc" }, { name: "asc" }],
    include: { parent: true, _count: { select: { products: true, children: true } } },
  });

  return (
    <AdminShell title="Categorias" description="Organiza el catalogo con categorias y subcategorias.">
      <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
        <Panel title="Nueva categoria">
          <CategoryForm categories={categories} />
        </Panel>
        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Nombre</th>
                  <th className="px-4 py-3 font-medium">Padre</th>
                  <th className="px-4 py-3 font-medium">Productos</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {categories.map((category) => (
                  <tr key={category.id}>
                    <td className="px-4 py-4">
                      <p className="font-medium text-slate-950">{category.name}</p>
                      <p className="text-xs text-slate-500">{category.slug}</p>
                    </td>
                    <td className="px-4 py-4 text-slate-700">{category.parent?.name ?? "Raiz"}</td>
                    <td className="px-4 py-4 text-slate-700">{category._count.products}</td>
                    <td className="px-4 py-4 text-slate-700">{category.isActive ? "Activa" : "Inactiva"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
