"use client";

import { useActionState } from "react";

import { resetPasswordAction } from "@/actions/auth";
import { SubmitButton } from "@/components/auth/submit-button";

const initialState = {
  ok: false,
  message: "",
};

type PasswordResetFormProps = {
  token: string;
};

export function PasswordResetForm({ token }: PasswordResetFormProps) {
  const [state, formAction] = useActionState(resetPasswordAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <label className="block">
        <span className="text-sm font-medium text-slate-700">Nueva contrasena</span>
        <input
          name="password"
          type="password"
          autoComplete="new-password"
          required
          className="mt-2 h-11 w-full rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-slate-950"
        />
      </label>
      {state.message ? (
        <p className={state.ok ? "text-sm text-emerald-700" : "text-sm text-red-700"}>
          {state.message}
        </p>
      ) : null}
      <SubmitButton pendingText="Actualizando...">Actualizar contrasena</SubmitButton>
    </form>
  );
}
