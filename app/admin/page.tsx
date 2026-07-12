import Link from "next/link";
import { Plus } from "lucide-react";

import { AdminShell } from "@/components/admin/admin-shell";
import { Panel, StatCard, buttonClass } from "@/components/admin/ui";
import { money, shortDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export default async function AdminPage() {
  const [products, activeProducts, orders, users, coupons, recentOrders, lowStock] =
    await Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { isActive: true } }),
      prisma.order.aggregate({ _count: true, _sum: { total: true } }),
      prisma.user.count(),
      prisma.coupon.count({ where: { isActive: true } }),
      prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { user: true },
      }),
      prisma.stock.findMany({
        where: { quantity: { lte: 5 } },
        include: { variant: { include: { product: true } } },
        take: 5,
        orderBy: { quantity: "asc" },
      }),
    ]);

  return (
    <AdminShell
      title="Dashboard"
      description="Resumen operativo de catalogo, ventas, usuarios y alertas de inventario."
      actions={
        <Link href="/admin/productos/nuevo" className={buttonClass}>
          <Plus className="h-4 w-4" aria-hidden />
          Nuevo producto
        </Link>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Productos" value={activeProducts} detail={`${products} en total`} />
        <StatCard label="Ordenes" value={orders._count} detail={money(orders._sum.total?.toString() ?? 0)} />
        <StatCard label="Usuarios" value={users} detail="Cuentas registradas" />
        <StatCard label="Cupones activos" value={coupons} detail="Promociones disponibles" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="Ordenes recientes">
          <div className="space-y-4">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                <div>
                  <p className="font-medium text-slate-950">{order.orderNumber}</p>
                  <p className="text-sm text-slate-500">{order.user.email} · {shortDate(order.createdAt)}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-slate-950">{money(order.total.toString(), order.currency)}</p>
                  <p className="text-xs text-slate-500">{order.status}</p>
                </div>
              </div>
            ))}
            {!recentOrders.length ? <p className="text-sm text-slate-500">Todavia no hay ordenes.</p> : null}
          </div>
        </Panel>

        <Panel title="Stock bajo">
          <div className="space-y-4">
            {lowStock.map((stock) => (
              <div key={stock.id} className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                <div>
                  <p className="font-medium text-slate-950">{stock.variant.product.name}</p>
                  <p className="text-sm text-slate-500">{stock.variant.sku}</p>
                </div>
                <p className="text-sm font-semibold text-red-700">{stock.quantity} unidades</p>
              </div>
            ))}
            {!lowStock.length ? <p className="text-sm text-slate-500">Sin alertas de stock.</p> : null}
          </div>
        </Panel>
      </div>
    </AdminShell>
  );
}
