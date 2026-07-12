"use client";

import { useActionState } from "react";

import { registerAction } from "@/actions/auth";
import { SubmitButton } from "@/components/auth/submit-button";

const initialState = {
  ok: false,
  message: "",
};

export function RegisterForm() {
  const [state, formAction] = useActionState(registerAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Nombre</span>
          <input
            name="firstName"
            autoComplete="given-name"
            required
            className="mt-2 h-11 w-full rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-slate-950"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Apellido</span>
          <input
            name="lastName"
            autoComplete="family-name"
            required
            className="mt-2 h-11 w-full rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-slate-950"
          />
        </label>
      </div>
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
      <label className="block">
        <span className="text-sm font-medium text-slate-700">Contrasena</span>
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
      <SubmitButton pendingText="Creando cuenta...">Crear cuenta</SubmitButton>
    </form>
  );
}
