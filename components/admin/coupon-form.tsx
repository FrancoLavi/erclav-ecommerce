"use client";

import { useActionState } from "react";

import { createCouponAction } from "@/actions/admin";
import { ActionMessage } from "@/components/admin/action-message";
import { AdminSubmitButton } from "@/components/admin/admin-submit-button";
import { Field, inputClass, textareaClass } from "@/components/admin/ui";

const initialState = { ok: false, message: "" };

export function CouponForm() {
  const [state, formAction] = useActionState(createCouponAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Codigo">
          <input name="code" required className={inputClass} />
        </Field>
        <Field label="Tipo">
          <select name="discountType" className={inputClass}>
            <option value="PERCENTAGE">Porcentaje</option>
            <option value="FIXED_AMOUNT">Monto fijo</option>
          </select>
        </Field>
        <Field label="Valor">
          <input name="discountValue" type="number" min="0" step="0.01" required className={inputClass} />
        </Field>
        <Field label="Minimo compra">
          <input name="minimumSubtotal" type="number" min="0" step="0.01" className={inputClass} />
        </Field>
        <Field label="Tope descuento">
          <input name="maxDiscount" type="number" min="0" step="0.01" className={inputClass} />
        </Field>
        <Field label="Limite usos">
          <input name="usageLimit" type="number" min="1" className={inputClass} />
        </Field>
        <Field label="Limite por usuario">
          <input name="perUserLimit" type="number" min="1" className={inputClass} />
        </Field>
        <Field label="Inicio">
          <input name="startsAt" type="datetime-local" className={inputClass} />
        </Field>
        <Field label="Fin">
          <input name="endsAt" type="datetime-local" className={inputClass} />
        </Field>
      </div>
      <Field label="Descripcion">
        <textarea name="description" className={textareaClass} />
      </Field>
      <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
        <input name="isActive" type="checkbox" defaultChecked className="h-4 w-4" />
        Cupon activo
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <AdminSubmitButton label="Crear cupon" />
        <ActionMessage ok={state.ok} message={state.message} />
      </div>
    </form>
  );
}
