import { redirect } from "next/navigation";
import { CircleUserRound } from "lucide-react";

import { auth } from "@/auth";
import { ProfileForm } from "@/components/account/account-forms";
import { AccountHeader, AccountPanel } from "@/components/account/account-ui";
import { shortDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export default async function ProfilePage() {
  const session = await auth(); if (!session?.user) redirect("/auth/login");
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { firstName: true, lastName: true, email: true, phone: true, documentNumber: true, createdAt: true, emailVerified: true } });
  if (!user) redirect("/auth/login");
  return <><AccountHeader eyebrow="Datos personales" title="Mi perfil" description="Mantené actualizados tus datos para agilizar futuras compras y entregas." />
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px]"><AccountPanel title="Editar perfil"><ProfileForm user={user} /></AccountPanel>
      <AccountPanel title="Estado de la cuenta"><div className="space-y-4 text-sm"><div className="grid h-14 w-14 place-items-center rounded-full bg-neutral-950 text-white"><CircleUserRound className="h-6 w-6" aria-hidden /></div><p><span className="block font-bold">Cliente desde</span><span className="text-neutral-500">{shortDate(user.createdAt)}</span></p><p><span className="block font-bold">Email</span><span className={user.emailVerified ? "text-emerald-700" : "text-amber-700"}>{user.emailVerified ? "Verificado" : "Pendiente de verificacion"}</span></p></div></AccountPanel></div>
  </>;
}
