import { KeyRound, ShieldCheck } from "lucide-react";
import { PasswordForm } from "@/components/account/account-forms";
import { AccountHeader, AccountPanel } from "@/components/account/account-ui";

export default function SecurityPage() {
  return <><AccountHeader eyebrow="Acceso" title="Seguridad" description="Actualiza tu contraseña y protege el acceso a tu cuenta." />
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]"><AccountPanel title="Cambiar contrasena"><PasswordForm /></AccountPanel>
      <AccountPanel title="Proteccion activa"><div className="space-y-4"><SecurityItem icon={ShieldCheck} title="Hash seguro" text="Tu contrasena se almacena cifrada con bcrypt." /><SecurityItem icon={KeyRound} title="Sesiones protegidas" text="Las cookies de acceso son privadas, seguras y no se exponen al navegador." /></div></AccountPanel></div>
  </>;
}
function SecurityItem({ icon: Icon, title, text }: { icon: typeof ShieldCheck; title: string; text: string }) { return <div className="flex gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-700"><Icon className="h-5 w-5" aria-hidden /></span><div><p className="text-sm font-black">{title}</p><p className="mt-1 text-sm leading-5 text-neutral-500">{text}</p></div></div>; }
