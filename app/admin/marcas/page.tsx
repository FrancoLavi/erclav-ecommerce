import { AdminShell } from "@/components/admin/admin-shell";
import { BrandForm } from "@/components/admin/brand-form";
import { Panel } from "@/components/admin/ui";
import { prisma } from "@/lib/prisma";

export default async function BrandsPage() {
  const brands = await prisma.brand.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true } } },
  });

  return (
    <AdminShell title="Marcas" description="Gestiona fabricantes y lineas comerciales del catalogo.">
      <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
        <Panel title="Nueva marca">
          <BrandForm />
        </Panel>
        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Marca</th>
                  <th className="px-4 py-3 font-medium">Productos</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {brands.map((brand) => (
                  <tr key={brand.id}>
                    <td className="px-4 py-4">
                      <p className="font-medium text-slate-950">{brand.name}</p>
                      <p className="text-xs text-slate-500">{brand.slug}</p>
                    </td>
                    <td className="px-4 py-4 text-slate-700">{brand._count.products}</td>
                    <td className="px-4 py-4 text-slate-700">{brand.isActive ? "Activa" : "Inactiva"}</td>
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
