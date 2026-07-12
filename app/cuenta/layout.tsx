import Link from "next/link";
import { redirect } from "next/navigation";
import { BadgeCheck, LogOut } from "lucide-react";

import { logoutAction } from "@/actions/auth";
import { auth } from "@/auth";
import { AccountNav } from "@/components/account/account-nav";
import { StoreShell } from "@/components/store/store-shell";
import { initials } from "@/lib/account";
import { prisma } from "@/lib/prisma";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/auth/login?callbackUrl=/cuenta");
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { name: true, firstName: true, lastName: true, email: true, emailVerified: true } });
  if (!user) redirect("/auth/login");
  const name = user.name || `${user.firstName} ${user.lastName}`.trim();

  return <StoreShell><main className="min-h-[70vh] bg-[#f7f7f5]">
    <section className="border-b border-black/10 bg-white"><div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-7 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
      <Link href="/cuenta" className="flex min-w-0 items-center gap-4"><span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-neutral-950 text-lg font-black text-white">{initials(name || user.email)}</span><span className="min-w-0"><span className="block truncate text-xl font-black">{name}</span><span className="mt-1 flex items-center gap-1 truncate text-sm text-neutral-500"><BadgeCheck className={`h-4 w-4 ${user.emailVerified ? "text-emerald-600" : "text-neutral-400"}`} aria-hidden />{user.email}</span></span></Link>
      <form action={logoutAction}><button className="inline-flex h-10 items-center gap-2 rounded-full border border-black/10 bg-white px-4 text-sm font-bold hover:border-neutral-950"><LogOut className="h-4 w-4" aria-hidden />Cerrar sesion</button></form>
    </div></section>
    <div className="mx-auto grid max-w-7xl gap-6 px-4 py-7 sm:px-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:px-8">
      <aside className="min-w-0 lg:sticky lg:top-32 lg:self-start"><AccountNav /></aside>
      <div className="min-w-0 space-y-6">{children}</div>
    </div>
  </main></StoreShell>;
}
