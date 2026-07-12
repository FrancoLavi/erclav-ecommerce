"use client";

import { useActionState } from "react";
import type { Category } from "@prisma/client";

import { createCategoryAction } from "@/actions/admin";
import { ActionMessage } from "@/components/admin/action-message";
import { AdminSubmitButton } from "@/components/admin/admin-submit-button";
import { Field, inputClass, textareaClass } from "@/components/admin/ui";

const initialState = { ok: false, message: "" };

export function CategoryForm({ categories }: { categories: Category[] }) {
  const [state, formAction] = useActionState(createCategoryAction, initialState);

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
      <Field label="Categoria padre">
        <select name="parentId" className={inputClass}>
          <option value="">Sin padre</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Descripcion">
        <textarea name="description" className={textareaClass} />
      </Field>
      <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
        <input name="isActive" type="checkbox" defaultChecked className="h-4 w-4" />
        Categoria activa
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <AdminSubmitButton label="Crear categoria" />
        <ActionMessage ok={state.ok} message={state.message} />
      </div>
    </form>
  );
}
