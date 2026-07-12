import Link from "next/link";

import { AuthFormShell } from "@/components/auth/auth-form-shell";
import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  return (
    <AuthFormShell
      title="Crear cuenta"
      subtitle="Te vamos a pedir verificar tu email antes de permitir el ingreso."
      footer={
        <>
          Ya tenes cuenta?{" "}
          <Link href="/auth/login" className="font-semibold text-slate-950">
            Inicia sesion
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthFormShell>
  );
}
