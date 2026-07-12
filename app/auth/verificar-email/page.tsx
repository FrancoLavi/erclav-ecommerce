import Link from "next/link";

import { verifyEmailToken } from "@/actions/auth";
import { AuthFormShell } from "@/components/auth/auth-form-shell";

type VerifyEmailPageProps = {
  searchParams: Promise<{
    token?: string;
  }>;
};

export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const { token } = await searchParams;
  const result = token
    ? await verifyEmailToken(token)
    : { ok: false, message: "Falta el token de verificacion." };

  return (
    <AuthFormShell
      title="Verificacion de email"
      subtitle={result.message}
      footer={
        <Link href="/auth/login" className="font-semibold text-slate-950">
          Ir al login
        </Link>
      }
    >
      <p className={result.ok ? "text-sm text-emerald-700" : "text-sm text-red-700"}>
        {result.ok ? "Tu cuenta ya esta habilitada." : "No pudimos verificar este enlace."}
      </p>
    </AuthFormShell>
  );
}
