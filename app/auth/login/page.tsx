import Link from "next/link";
import { Suspense } from "react";

import { AuthFormShell } from "@/components/auth/auth-form-shell";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <AuthFormShell
      title="Iniciar sesion"
      subtitle="Ingresa con tu email y contrasena para acceder a tu cuenta."
      footer={
        <>
          No tenes cuenta?{" "}
          <Link href="/auth/registro" className="font-semibold text-slate-950">
            Registrate
          </Link>
        </>
      }
    >
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </AuthFormShell>
  );
}
