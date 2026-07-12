"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { CheckCircle2, LoaderCircle, Save } from "lucide-react";

import { changePasswordAction, updateProfileAction } from "@/actions/account";

const initialState = { ok: false, message: "" };
const inputClass = "mt-2 h-11 w-full rounded-md border border-black/15 bg-white px-3 text-sm outline-none transition focus:border-neutral-950 focus:ring-2 focus:ring-black/5";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return <button disabled={pending} className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-neutral-950 px-5 text-sm font-bold text-white transition hover:bg-neutral-800 disabled:opacity-60">{pending ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden /> : <Save className="h-4 w-4" aria-hidden />}{pending ? "Guardando..." : label}</button>;
}

function Message({ ok, message }: { ok: boolean; message: string }) {
  if (!message) return null;
  return <p className={ok ? "flex items-center gap-2 text-sm font-semibold text-emerald-700" : "text-sm font-semibold text-red-700"}>{ok ? <CheckCircle2 className="h-4 w-4" aria-hidden /> : null}{message}</p>;
}

export function ProfileForm({ user }: { user: { firstName: string; lastName: string; email: string; phone: string | null; documentNumber: string | null } }) {
  const [state, action] = useActionState(updateProfileAction, initialState);
  return <form action={action} className="space-y-5">
    <div className="grid gap-4 sm:grid-cols-2"><Field label="Nombre" name="firstName" defaultValue={user.firstName} autoComplete="given-name" /><Field label="Apellido" name="lastName" defaultValue={user.lastName} autoComplete="family-name" /></div>
    <label className="block"><span className="text-sm font-bold">Email</span><input value={user.email} disabled className={`${inputClass} cursor-not-allowed bg-neutral-100 text-neutral-500`} /><span className="mt-2 block text-xs text-neutral-500">El email de acceso no se puede cambiar desde aqui.</span></label>
    <div className="grid gap-4 sm:grid-cols-2"><Field label="Telefono" name="phone" defaultValue={user.phone ?? ""} autoComplete="tel" required={false} /><Field label="Documento" name="documentNumber" defaultValue={user.documentNumber ?? ""} required={false} /></div>
    <Message {...state} /><SubmitButton label="Guardar cambios" />
  </form>;
}

export function PasswordForm() {
  const [state, action] = useActionState(changePasswordAction, initialState);
  return <form action={action} className="space-y-5">
    <Field label="Contrasena actual" name="currentPassword" type="password" autoComplete="current-password" />
    <div className="grid gap-4 sm:grid-cols-2"><Field label="Nueva contrasena" name="newPassword" type="password" autoComplete="new-password" /><Field label="Repetir nueva contrasena" name="confirmPassword" type="password" autoComplete="new-password" /></div>
    <p className="text-xs leading-5 text-neutral-500">Usa al menos 8 caracteres, una mayuscula, una minuscula y un numero.</p>
    <Message {...state} /><SubmitButton label="Actualizar contrasena" />
  </form>;
}

function Field({ label, name, defaultValue, type = "text", autoComplete, required = true }: { label: string; name: string; defaultValue?: string; type?: string; autoComplete?: string; required?: boolean }) {
  return <label className="block"><span className="text-sm font-bold">{label}</span><input name={name} type={type} defaultValue={defaultValue} autoComplete={autoComplete} required={required} className={inputClass} /></label>;
}
