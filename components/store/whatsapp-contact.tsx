"use client";

import { MessageCircle } from "lucide-react";
import { usePathname } from "next/navigation";

export function WhatsAppContact({ href }: { href: string | null }) {
  const pathname = usePathname();
  if (!href || /^\/productos\/[^/]+$/.test(pathname)) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contactar a ErcLav por WhatsApp"
      className="fixed bottom-5 right-4 z-30 inline-flex h-12 w-12 items-center justify-center gap-2 rounded-full bg-[#25D366] px-0 text-sm font-bold text-neutral-950 shadow-lg ring-1 ring-black/10 transition hover:bg-[#20bd5a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 sm:right-6 sm:w-auto sm:px-5"
    >
      <MessageCircle className="h-5 w-5" aria-hidden />
      <span className="hidden sm:inline">Consultar por WhatsApp</span>
    </a>
  );
}
