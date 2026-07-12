"use client";

import { useFormStatus } from "react-dom";
import { Save } from "lucide-react";

import { buttonClass } from "@/components/admin/ui";

export function AdminSubmitButton({ label = "Guardar" }: { label?: string }) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending} className={buttonClass}>
      <Save className="h-4 w-4" aria-hidden />
      {pending ? "Guardando..." : label}
    </button>
  );
}
