import { updateOrderStatusAction } from "@/actions/admin";
import { AdminShell } from "@/components/admin/admin-shell";
import { OrderStatusSelect } from "@/components/admin/order-status-select";
import { money, shortDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";

const orderStatuses = ["PENDING", "CONFIRMED", "PAID", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"];

export default async function OrdersPage() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: true, items: true },
  });

  return (
    <AdminShell title="Ordenes" description="Consulta pedidos y cambia su estado operativo.">
      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Orden</th>
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Items</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Pago</th>
                <th className="px-4 py-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="px-4 py-4">
                    <p className="font-medium text-slate-950">{order.orderNumber}</p>
                    <p className="text-xs text-slate-500">{shortDate(order.createdAt)}</p>
                  </td>
                  <td className="px-4 py-4 text-slate-700">{order.user.email}</td>
                  <td className="px-4 py-4 text-slate-700">{order.items.length}</td>
                  <td className="px-4 py-4 font-medium text-slate-950">{money(order.total.toString(), order.currency)}</td>
                  <td className="px-4 py-4 text-slate-700">{order.paymentStatus}</td>
                  <td className="px-4 py-4">
                    <form action={updateOrderStatusAction.bind(null, order.id)}>
                      <OrderStatusSelect statuses={orderStatuses} value={order.status} />
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!orders.length ? <p className="p-5 text-sm text-slate-500">Todavia no hay ordenes.</p> : null}
      </section>
    </AdminShell>
  );
}
