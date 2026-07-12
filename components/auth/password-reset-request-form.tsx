"use client";

import { useActionState } from "react";

import { requestPasswordResetAction } from "@/actions/auth";
import { SubmitButton } from "@/components/auth/submit-button";

const initialState = {
  ok: false,
  message: "",
};

export function PasswordResetRequestForm() {
  const [state, formAction] = useActionState(requestPasswordResetAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <label className="block">
        <span className="text-sm font-medium text-slate-700">Email</span>
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          className="mt-2 h-11 w-full rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-slate-950"
        />
      </label>
      {state.message ? (
        <p className={state.ok ? "text-sm text-emerald-700" : "text-sm text-red-700"}>
          {state.message}
        </p>
      ) : null}
      <SubmitButton pendingText="Enviando...">Enviar enlace</SubmitButton>
    </form>
  );
}
