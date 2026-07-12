import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { auth } from "@/auth";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await auth();

  if (!session?.user?.roles.includes("ADMIN")) {
    redirect("/auth/login");
  }

  return children;
}
