"use client";

import { useActionState } from "react";

import { createBrandAction } from "@/actions/admin";
import { ActionMessage } from "@/components/admin/action-message";
import { AdminSubmitButton } from "@/components/admin/admin-submit-button";
import { Field, inputClass, textareaClass } from "@/components/admin/ui";

const initialState = { ok: false, message: "" };

export function BrandForm() {
  const [state, formAction] = useActionState(createBrandAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nombre">
          <input name="name" required className={inputClass} />
        </Field>
        <Field label="Slug">
          <input name="slug" required className={inputClass} />
        </Field>
      </div>
      <Field label="Logo URL">
        <input name="logoUrl" className={inputClass} />
      </Field>
      <Field label="Descripcion">
        <textarea name="description" className={textareaClass} />
      </Field>
      <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
        <input name="isActive" type="checkbox" defaultChecked className="h-4 w-4" />
        Marca activa
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <AdminSubmitButton label="Crear marca" />
        <ActionMessage ok={state.ok} message={state.message} />
      </div>
    </form>
  );
}
