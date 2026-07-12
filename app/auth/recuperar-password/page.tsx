import Link from "next/link";

import { AuthFormShell } from "@/components/auth/auth-form-shell";
import { PasswordResetRequestForm } from "@/components/auth/password-reset-request-form";

export default function PasswordResetRequestPage() {
  return (
    <AuthFormShell
      title="Recuperar contrasena"
      subtitle="Enviaremos un enlace temporal si existe una cuenta activa con ese email."
      footer={
        <Link href="/auth/login" className="font-semibold text-slate-950">
          Volver al login
        </Link>
      }
    >
      <PasswordResetRequestForm />
    </AuthFormShell>
  );
}
