"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CreditCard, Heart, House, LockKeyhole, MapPin, Package, UserRound } from "lucide-react";

const items = [
  { href: "/cuenta", label: "Resumen", icon: House, exact: true },
  { href: "/cuenta/perfil", label: "Perfil", icon: UserRound },
  { href: "/cuenta/pedidos", label: "Mis pedidos", icon: Package },
  { href: "/cuenta/favoritos", label: "Favoritos", icon: Heart },
  { href: "/cuenta/direcciones", label: "Direcciones", icon: MapPin },
  { href: "/cuenta/pagos", label: "Metodos de pago", icon: CreditCard },
  { href: "/cuenta/seguridad", label: "Seguridad", icon: LockKeyhole },
];

export function AccountNav() {
  const pathname = usePathname();
  return (
    <nav className="no-scrollbar flex gap-2 overflow-x-auto lg:grid lg:gap-1" aria-label="Mi cuenta">
      {items.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link key={href} href={href} className={active ? "flex h-11 shrink-0 items-center gap-3 rounded-md bg-neutral-950 px-4 text-sm font-bold text-white" : "flex h-11 shrink-0 items-center gap-3 rounded-md px-4 text-sm font-semibold text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-950"}>
            <Icon className="h-4 w-4" aria-hidden />{label}
          </Link>
        );
      })}
    </nav>
  );
}
