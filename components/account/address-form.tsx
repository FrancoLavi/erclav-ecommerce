import type { Address } from "@prisma/client";

const inputClass = "mt-2 h-11 w-full rounded-md border border-black/15 bg-white px-3 text-sm outline-none focus:border-neutral-950";

export function AddressForm({ address, action, submitLabel }: { address?: Address; action: (formData: FormData) => void | Promise<void>; submitLabel: string }) {
  return <form action={action} className="grid gap-4 sm:grid-cols-2">
    <Field label="Nombre de la direccion" name="label" defaultValue={address?.label ?? ""} placeholder="Casa, trabajo..." required={false} />
    <label className="block"><span className="text-sm font-bold">Tipo</span><select name="type" defaultValue={address?.type ?? "SHIPPING"} className={inputClass}><option value="SHIPPING">Envio</option><option value="BILLING">Facturacion</option></select></label>
    <Field label="Nombre" name="firstName" defaultValue={address?.firstName ?? ""} autoComplete="given-name" />
    <Field label="Apellido" name="lastName" defaultValue={address?.lastName ?? ""} autoComplete="family-name" />
    <Field label="Telefono" name="phone" defaultValue={address?.phone ?? ""} autoComplete="tel" required={false} />
    <Field label="Calle" name="street" defaultValue={address?.street ?? ""} autoComplete="address-line1" />
    <Field label="Numero" name="number" defaultValue={address?.number ?? ""} required={false} />
    <Field label="Piso / departamento" name="apartment" defaultValue={address?.apartment ?? ""} autoComplete="address-line2" required={false} />
    <Field label="Ciudad" name="city" defaultValue={address?.city ?? ""} autoComplete="address-level2" />
    <Field label="Provincia" name="province" defaultValue={address?.province ?? ""} autoComplete="address-level1" />
    <Field label="Codigo postal" name="postalCode" defaultValue={address?.postalCode ?? ""} autoComplete="postal-code" />
    <Field label="Pais" name="country" defaultValue={address?.country ?? "AR"} autoComplete="country" />
    <div className="sm:col-span-2"><button className="h-11 rounded-full bg-neutral-950 px-5 text-sm font-bold text-white hover:bg-neutral-800">{submitLabel}</button></div>
  </form>;
}

function Field({ label, name, defaultValue, placeholder, autoComplete, required = true }: { label: string; name: string; defaultValue: string; placeholder?: string; autoComplete?: string; required?: boolean }) {
  return <label className="block"><span className="text-sm font-bold">{label}</span><input name={name} defaultValue={defaultValue} placeholder={placeholder} autoComplete={autoComplete} required={required} className={inputClass} /></label>;
}
