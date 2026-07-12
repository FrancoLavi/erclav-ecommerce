import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight, PackageSearch, RotateCcw } from "lucide-react";
import { reorderAction } from "@/actions/account";
import { auth } from "@/auth";
import { AccountHeader, EmptyAccountState } from "@/components/account/account-ui";
import { orderStatusClass, orderStatusLabel, paymentStatusLabel } from "@/lib/account";
import { money, shortDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const session = await auth(); if (!session?.user) redirect("/auth/login");
  const params = await searchParams;
  const orders = await prisma.order.findMany({ where: { userId: session.user.id }, orderBy: { createdAt: "desc" }, include: { items: { orderBy: { createdAt: "asc" }, take: 3 } } });
  return <><AccountHeader eyebrow="Historial de compras" title="Mis pedidos" description="Consulta el estado, el pago y el detalle de todas tus compras." />
    {params.error === "stock" ? <p className="rounded-md bg-amber-50 p-4 text-sm font-semibold text-amber-800">Los productos de ese pedido no tienen stock disponible en este momento.</p> : null}
    {orders.length ? <div className="space-y-4">{orders.map((order) => <article key={order.id} className="rounded-lg border border-black/10 bg-white p-5 shadow-sm"><div className="flex flex-col justify-between gap-4 border-b border-black/10 pb-4 sm:flex-row sm:items-start"><div><div className="flex flex-wrap items-center gap-2"><h2 className="font-black">Pedido {order.orderNumber}</h2><span className={`rounded-full px-3 py-1 text-xs font-bold ${orderStatusClass(order.status)}`}>{orderStatusLabel[order.status]}</span></div><p className="mt-2 text-sm text-neutral-500">{shortDate(order.createdAt)} · {paymentStatusLabel[order.paymentStatus]}</p></div><p className="text-xl font-black">{money(order.total.toString(), order.currency)}</p></div><div className="py-4"><p className="text-sm font-semibold text-neutral-700">{order.items.map((item) => `${item.quantity}x ${item.productName}`).join(" · ")}</p>{order.items.length === 3 ? <p className="mt-1 text-xs text-neutral-500">Puede haber mas productos en el detalle.</p> : null}</div><div className="flex flex-wrap gap-3"><Link href={`/cuenta/pedidos/${order.orderNumber}`} className="inline-flex h-10 items-center gap-2 rounded-full bg-neutral-950 px-4 text-sm font-bold text-white">Ver detalle<ChevronRight className="h-4 w-4" aria-hidden /></Link><form action={reorderAction.bind(null, order.id)}><button className="inline-flex h-10 items-center gap-2 rounded-full border border-black/15 px-4 text-sm font-bold hover:border-neutral-950"><RotateCcw className="h-4 w-4" aria-hidden />Comprar de nuevo</button></form></div></article>)}</div> : <EmptyAccountState icon={PackageSearch} title="No hay compras todavia" description="Cuando completes una compra, vas a poder seguirla y recomprarla desde aca."><Link href="/productos" className="inline-flex h-10 items-center rounded-full bg-neutral-950 px-4 text-sm font-bold text-white">Ir al catalogo</Link></EmptyAccountState>}
  </>;
}
