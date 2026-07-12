import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, CreditCard, MapPin, PackageCheck, RotateCcw, Truck } from "lucide-react";
import { reorderAction } from "@/actions/account";
import { retryMercadoPagoPaymentAction, retryStripePaymentAction } from "@/actions/checkout";
import { auth } from "@/auth";
import { AccountHeader, AccountPanel } from "@/components/account/account-ui";
import { orderStatusClass, orderStatusLabel, paymentStatusLabel } from "@/lib/account";
import { money, shortDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";

type AddressSnapshot = { firstName?: string; lastName?: string; street?: string; number?: string; apartment?: string; city?: string; province?: string; postalCode?: string; country?: string };

export default async function OrderDetailPage({ params }: { params: Promise<{ orderNumber: string }> }) {
  const session = await auth(); if (!session?.user) redirect("/auth/login");
  const { orderNumber } = await params;
  const order = await prisma.order.findFirst({ where: { orderNumber, userId: session.user.id }, include: { items: { orderBy: { createdAt: "asc" } }, paymentAttempts: { orderBy: { createdAt: "desc" }, take: 1 } } });
  if (!order) notFound();
  const address = order.shippingAddressSnapshot as AddressSnapshot;
  const canRetry = ["PENDING", "FAILED", "CANCELLED"].includes(order.paymentStatus);
  return <><AccountHeader eyebrow="Detalle de compra" title={`Pedido ${order.orderNumber}`} description={`Realizado el ${shortDate(order.createdAt)}`} action={<Link href="/cuenta/pedidos" className="inline-flex h-10 items-center gap-2 rounded-full border border-black/15 px-4 text-sm font-bold"><ArrowLeft className="h-4 w-4" aria-hidden />Volver</Link>} />
    <div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-3 py-2 text-xs font-bold ${orderStatusClass(order.status)}`}>{orderStatusLabel[order.status]}</span><span className="rounded-full bg-white px-3 py-2 text-xs font-bold text-neutral-600 ring-1 ring-black/10">{paymentStatusLabel[order.paymentStatus]}</span></div>
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]"><div className="space-y-6"><AccountPanel title="Productos"><div className="divide-y divide-black/10">{order.items.map((item) => <div key={item.id} className="grid gap-3 py-4 first:pt-0 last:pb-0 sm:grid-cols-[1fr_auto] sm:items-center"><div><p className="font-black">{item.productName}</p><p className="mt-1 text-sm text-neutral-500">{[item.color, item.size].filter(Boolean).join(" · ") || item.variantSku} · Cantidad: {item.quantity}</p></div><p className="font-black">{money(item.total.toString(), order.currency)}</p></div>)}</div></AccountPanel>
      <AccountPanel title="Estado del pedido"><div className="grid gap-4 sm:grid-cols-3"><Status icon={PackageCheck} label="Confirmacion" value={orderStatusLabel[order.status]} /><Status icon={Truck} label="Envio" value={order.shippedAt ? shortDate(order.shippedAt) : "Aun no despachado"} /><Status icon={CreditCard} label="Pago" value={paymentStatusLabel[order.paymentStatus]} /></div></AccountPanel></div>
      <aside className="space-y-6"><AccountPanel title="Resumen"><div className="space-y-3 text-sm"><Row label="Subtotal" value={money(order.subtotal.toString(), order.currency)} /><Row label="Descuento" value={`-${money(order.discountTotal.toString(), order.currency)}`} /><Row label="Envio" value={money(order.shippingTotal.toString(), order.currency)} /><Row label="Impuestos" value={money(order.taxTotal.toString(), order.currency)} /><div className="flex justify-between border-t border-black/10 pt-3 text-lg font-black"><span>Total</span><span>{money(order.total.toString(), order.currency)}</span></div></div></AccountPanel>
      <AccountPanel title="Entrega"><div className="flex gap-3 text-sm leading-6 text-neutral-600"><MapPin className="mt-1 h-5 w-5 shrink-0" aria-hidden /><p><strong className="block text-neutral-950">{address.firstName} {address.lastName}</strong>{address.street} {address.number}{address.apartment ? `, ${address.apartment}` : ""}<br />{address.city}, {address.province} · {address.postalCode}</p></div></AccountPanel>
      <div className="grid gap-3"><form action={reorderAction.bind(null, order.id)}><button className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-neutral-950 px-5 text-sm font-bold text-white"><RotateCcw className="h-4 w-4" aria-hidden />Comprar de nuevo</button></form>{canRetry && order.paymentProvider === "mercado_pago" ? <form action={retryMercadoPagoPaymentAction.bind(null, order.orderNumber)}><button className="h-11 w-full rounded-full bg-[#009ee3] px-5 text-sm font-bold text-white">Reintentar con Mercado Pago</button></form> : null}{canRetry && order.paymentProvider === "stripe" ? <form action={retryStripePaymentAction.bind(null, order.orderNumber)}><button className="h-11 w-full rounded-full bg-[#635bff] px-5 text-sm font-bold text-white">Reintentar con Stripe</button></form> : null}</div></aside></div>
  </>;
}

function Row({ label, value }: { label: string; value: string }) { return <div className="flex justify-between gap-4"><span className="text-neutral-500">{label}</span><span className="font-bold">{value}</span></div>; }
function Status({ icon: Icon, label, value }: { icon: typeof Truck; label: string; value: string }) { return <div className="rounded-md bg-[#f7f7f5] p-4"><Icon className="h-5 w-5" aria-hidden /><p className="mt-3 text-xs font-bold uppercase text-neutral-500">{label}</p><p className="mt-1 text-sm font-black">{value}</p></div>; }
