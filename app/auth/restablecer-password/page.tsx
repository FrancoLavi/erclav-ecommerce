import Link from "next/link";

import { AuthFormShell } from "@/components/auth/auth-form-shell";
import { PasswordResetForm } from "@/components/auth/password-reset-form";

type ResetPasswordPageProps = {
  searchParams: Promise<{
    token?: string;
  }>;
};

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const { token } = await searchParams;

  return (
    <AuthFormShell
      title="Nueva contrasena"
      subtitle="El enlace es temporal. Elegi una contrasena segura para tu cuenta."
      footer={
        <Link href="/auth/login" className="font-semibold text-slate-950">
          Volver al login
        </Link>
      }
    >
      {token ? (
        <PasswordResetForm token={token} />
      ) : (
        <p className="text-sm text-red-700">Falta el token para restablecer la contrasena.</p>
      )}
    </AuthFormShell>
  );
}
