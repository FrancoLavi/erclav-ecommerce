import { redirect } from "next/navigation";
import { Check, CreditCard, LockKeyhole, Trash2 } from "lucide-react";
import { deletePaymentMethodAction, setDefaultPaymentMethodAction } from "@/actions/account";
import { auth } from "@/auth";
import { AccountHeader, AccountPanel, EmptyAccountState } from "@/components/account/account-ui";
import { prisma } from "@/lib/prisma";

const providerLabel: Record<string, string> = { CREDIT_CARD: "Tarjeta de credito", DEBIT_CARD: "Tarjeta de debito", MERCADO_PAGO: "Mercado Pago", BANK_TRANSFER: "Transferencia", CASH: "Efectivo", OTHER: "Otro metodo" };

export default async function PaymentMethodsPage() {
  const session = await auth(); if (!session?.user) redirect("/auth/login");
  const methods = await prisma.paymentMethod.findMany({ where: { userId: session.user.id, status: "ACTIVE" }, orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }] });
  return <><AccountHeader eyebrow="Pagos" title="Metodos de pago" description="Consulta y administra los medios tokenizados asociados a tu cuenta." />
    <AccountPanel title="Tus medios guardados" description="ErcLav nunca almacena el numero completo ni el codigo de seguridad de una tarjeta.">
      {methods.length ? <div className="grid gap-4 sm:grid-cols-2">{methods.map((method) => <div key={method.id} className="rounded-lg border border-black/10 p-5"><div className="flex items-start justify-between gap-4"><span className="grid h-11 w-11 place-items-center rounded-full bg-neutral-950 text-white"><CreditCard className="h-5 w-5" aria-hidden /></span>{method.isDefault ? <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700"><Check className="h-3.5 w-3.5" aria-hidden />Principal</span> : null}</div><h2 className="mt-4 font-black">{method.label || providerLabel[method.provider]}</h2><p className="mt-1 text-sm text-neutral-500">{method.brand ? `${method.brand} ` : ""}{method.last4 ? `terminada en ${method.last4}` : providerLabel[method.provider]}</p><div className="mt-5 flex flex-wrap gap-2">{!method.isDefault ? <form action={setDefaultPaymentMethodAction.bind(null, method.id)}><button className="h-9 rounded-full border border-black/15 px-3 text-xs font-bold hover:border-neutral-950">Usar como principal</button></form> : null}<form action={deletePaymentMethodAction.bind(null, method.id)}><button className="inline-flex h-9 items-center gap-2 rounded-full border border-red-200 px-3 text-xs font-bold text-red-700 hover:bg-red-50"><Trash2 className="h-4 w-4" aria-hidden />Eliminar</button></form></div></div>)}</div> : <EmptyAccountState icon={CreditCard} title="No hay medios guardados" description="Los proveedores compatibles pueden guardar un identificador seguro después de una compra. También podés elegir un medio nuevo en cada checkout." />}
    </AccountPanel>
    <div className="flex gap-3 rounded-lg border border-black/10 bg-white p-5 text-sm text-neutral-600"><LockKeyhole className="h-5 w-5 shrink-0 text-emerald-700" aria-hidden /><p><strong className="text-neutral-950">Pagos protegidos.</strong> Las tarjetas se procesan directamente mediante Stripe o Mercado Pago usando referencias seguras.</p></div>
  </>;
}
