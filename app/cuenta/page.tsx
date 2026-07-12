import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight, Heart, MapPin, Package, ShoppingBag, Star, Truck } from "lucide-react";

import { auth } from "@/auth";
import { AccountHeader, AccountPanel, EmptyAccountState } from "@/components/account/account-ui";
import { orderStatusClass, orderStatusLabel } from "@/lib/account";
import { money, shortDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export default async function AccountPage() {
  const session = await auth(); if (!session?.user) redirect("/auth/login");
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, include: {
    orders: { orderBy: { createdAt: "desc" }, take: 3, include: { items: { take: 2 } } },
    favorites: { orderBy: { createdAt: "desc" }, take: 3, include: { product: { select: { name: true, slug: true } } } },
    _count: { select: { orders: true, favorites: true, addresses: true, reviews: true } },
  }});
  if (!user) redirect("/auth/login");

  return <>
    <AccountHeader eyebrow="Tu actividad" title={`Hola, ${user.firstName}`} description="Segui tus compras, administra tus datos y volve a pedir tus productos favoritos." action={<Link href="/productos" className="inline-flex h-11 items-center gap-2 rounded-full bg-neutral-950 px-5 text-sm font-bold text-white"><ShoppingBag className="h-4 w-4" aria-hidden />Ir a comprar</Link>} />
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Metric href="/cuenta/pedidos" icon={Package} label="Compras" value={user._count.orders} />
      <Metric href="/cuenta/favoritos" icon={Heart} label="Favoritos" value={user._count.favorites} />
      <Metric href="/cuenta/direcciones" icon={MapPin} label="Direcciones" value={user._count.addresses} />
      <Metric href="/cuenta/pedidos" icon={Star} label="Opiniones" value={user._count.reviews} />
    </div>
    <AccountPanel title="Ultimos pedidos" description="Estado y resumen de tus compras mas recientes.">
      {user.orders.length ? <div className="divide-y divide-black/10">{user.orders.map((order) => <Link key={order.id} href={`/cuenta/pedidos/${order.orderNumber}`} className="grid gap-3 py-4 first:pt-0 last:pb-0 sm:grid-cols-[1fr_auto] sm:items-center"><div><div className="flex flex-wrap items-center gap-2"><span className="font-black">{order.orderNumber}</span><span className={`rounded-full px-3 py-1 text-xs font-bold ${orderStatusClass(order.status)}`}>{orderStatusLabel[order.status]}</span></div><p className="mt-2 text-sm text-neutral-500">{shortDate(order.createdAt)} · {order.items.map((item) => item.productName).join(", ")}</p></div><div className="flex items-center justify-between gap-3"><span className="font-black">{money(order.total.toString(), order.currency)}</span><ChevronRight className="h-5 w-5 text-neutral-400" aria-hidden /></div></Link>)}</div> : <EmptyAccountState icon={Truck} title="Todavia no tenes pedidos" description="Tu historial y el seguimiento de envios van a aparecer aca."><Link href="/productos" className="inline-flex h-10 items-center rounded-full bg-neutral-950 px-4 text-sm font-bold text-white">Explorar productos</Link></EmptyAccountState>}
    </AccountPanel>
    {user.favorites.length ? <AccountPanel title="Guardados para despues"><div className="grid gap-3 sm:grid-cols-3">{user.favorites.map((favorite) => <Link key={favorite.productId} href={`/productos/${favorite.product.slug}`} className="rounded-md border border-black/10 p-4 font-bold hover:border-neutral-950">{favorite.product.name}<span className="mt-3 block text-sm font-semibold text-neutral-500">Ver producto</span></Link>)}</div></AccountPanel> : null}
  </>;
}

function Metric({ href, icon: Icon, label, value }: { href: string; icon: typeof Package; label: string; value: number }) {
  return <Link href={href} className="rounded-lg border border-black/10 bg-white p-5 shadow-sm transition hover:border-neutral-950"><div className="flex items-center justify-between"><span className="text-sm font-bold text-neutral-500">{label}</span><span className="grid h-9 w-9 place-items-center rounded-full bg-[#f2f0eb]"><Icon className="h-4 w-4" aria-hidden /></span></div><span className="mt-4 block text-3xl font-black">{value}</span></Link>;
}
