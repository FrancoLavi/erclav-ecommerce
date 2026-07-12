import { BadgeCheck, BadgeX } from "lucide-react";

import { toggleCouponAction } from "@/actions/admin";
import { AdminShell } from "@/components/admin/admin-shell";
import { CouponForm } from "@/components/admin/coupon-form";
import { Panel, secondaryButtonClass } from "@/components/admin/ui";
import { money, shortDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export default async function CouponsPage() {
  const coupons = await prisma.coupon.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { orders: true } } },
  });

  return (
    <AdminShell title="Cupones" description="Crea promociones, controla vigencia y activa o pausa codigos.">
      <div className="grid gap-6 xl:grid-cols-[480px_1fr]">
        <Panel title="Nuevo cupon">
          <CouponForm />
        </Panel>
        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Codigo</th>
                  <th className="px-4 py-3 font-medium">Descuento</th>
                  <th className="px-4 py-3 font-medium">Uso</th>
                  <th className="px-4 py-3 font-medium">Vigencia</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium">Accion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {coupons.map((coupon) => (
                  <tr key={coupon.id}>
                    <td className="px-4 py-4">
                      <p className="font-medium text-slate-950">{coupon.code}</p>
                      <p className="text-xs text-slate-500">{coupon.description ?? "Sin descripcion"}</p>
                    </td>
                    <td className="px-4 py-4 text-slate-700">
                      {coupon.discountType === "PERCENTAGE"
                        ? `${coupon.discountValue.toString()}%`
                        : money(coupon.discountValue.toString())}
                    </td>
                    <td className="px-4 py-4 text-slate-700">
                      {coupon.usageCount}/{coupon.usageLimit ?? "sin limite"}
                    </td>
                    <td className="px-4 py-4 text-slate-700">
                      {coupon.startsAt ? shortDate(coupon.startsAt) : "Ahora"} - {coupon.endsAt ? shortDate(coupon.endsAt) : "sin fin"}
                    </td>
                    <td className="px-4 py-4 text-slate-700">{coupon.isActive ? "Activo" : "Pausado"}</td>
                    <td className="px-4 py-4">
                      <form action={toggleCouponAction.bind(null, coupon.id, !coupon.isActive)}>
                        <button type="submit" className={secondaryButtonClass}>
                          {coupon.isActive ? (
                            <BadgeX className="h-4 w-4" aria-hidden />
                          ) : (
                            <BadgeCheck className="h-4 w-4" aria-hidden />
                          )}
                          {coupon.isActive ? "Pausar" : "Activar"}
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!coupons.length ? <p className="p-5 text-sm text-slate-500">Todavia no hay cupones.</p> : null}
        </section>
      </div>
    </AdminShell>
  );
}
