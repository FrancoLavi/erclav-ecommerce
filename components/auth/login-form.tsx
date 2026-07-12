"use client";

import { useActionState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { loginAction } from "@/actions/auth";
import { SubmitButton } from "@/components/auth/submit-button";

const initialState = {
  ok: false,
  message: "",
};

export function LoginForm() {
  const [state, formAction] = useActionState(loginAction, initialState);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (state.ok) {
      router.push(searchParams.get("callbackUrl") ?? "/");
      router.refresh();
    }
  }, [router, searchParams, state.ok]);

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
      <label className="block">
        <span className="text-sm font-medium text-slate-700">Contrasena</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="mt-2 h-11 w-full rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-slate-950"
        />
      </label>
      {state.message ? (
        <p className={state.ok ? "text-sm text-emerald-700" : "text-sm text-red-700"}>
          {state.message}
        </p>
      ) : null}
      <SubmitButton pendingText="Ingresando...">Ingresar</SubmitButton>
      <Link href="/auth/recuperar-password" className="block text-center text-sm text-slate-600">
        Olvide mi contrasena
      </Link>
    </form>
  );
}
