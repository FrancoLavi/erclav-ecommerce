import { ShieldCheck } from "lucide-react";

import { updateUserAction } from "@/actions/admin";
import { AdminShell } from "@/components/admin/admin-shell";
import { secondaryButtonClass } from "@/components/admin/ui";
import { shortDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export default async function UsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      roles: { include: { role: true } },
      _count: { select: { orders: true } },
    },
  });

  return (
    <AdminShell title="Usuarios" description="Activa o desactiva cuentas y administra roles de acceso.">
      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Usuario</th>
                <th className="px-4 py-3 font-medium">Verificacion</th>
                <th className="px-4 py-3 font-medium">Ordenes</th>
                <th className="px-4 py-3 font-medium">Roles</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Accion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user) => {
                const roles = new Set(user.roles.map((item) => item.role.name));
                return (
                  <tr key={user.id}>
                    <td className="px-4 py-4">
                      <p className="font-medium text-slate-950">{user.name ?? `${user.firstName} ${user.lastName}`}</p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                      <p className="mt-1 text-xs text-slate-400">{shortDate(user.createdAt)}</p>
                    </td>
                    <td className="px-4 py-4 text-slate-700">{user.emailVerified ? "Verificado" : "Pendiente"}</td>
                    <td className="px-4 py-4 text-slate-700">{user._count.orders}</td>
                    <td className="px-4 py-4">
                      <form id={`user-${user.id}`} action={updateUserAction.bind(null, user.id)} className="flex gap-3">
                        <label className="flex items-center gap-2 text-slate-700">
                          <input name="roles" type="checkbox" value="CLIENT" defaultChecked={roles.has("CLIENT")} className="h-4 w-4" />
                          Cliente
                        </label>
                        <label className="flex items-center gap-2 text-slate-700">
                          <input name="roles" type="checkbox" value="ADMIN" defaultChecked={roles.has("ADMIN")} className="h-4 w-4" />
                          Admin
                        </label>
                      </form>
                    </td>
                    <td className="px-4 py-4">
                      <label className="flex items-center gap-2 text-slate-700">
                        <input form={`user-${user.id}`} name="isActive" type="checkbox" defaultChecked={user.isActive} className="h-4 w-4" />
                        Activo
                      </label>
                    </td>
                    <td className="px-4 py-4">
                      <button form={`user-${user.id}`} type="submit" className={secondaryButtonClass}>
                        <ShieldCheck className="h-4 w-4" aria-hidden />
                        Guardar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </AdminShell>
  );
}
