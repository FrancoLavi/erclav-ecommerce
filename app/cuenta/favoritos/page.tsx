import Link from "next/link";
import { redirect } from "next/navigation";
import { Heart } from "lucide-react";
import { auth } from "@/auth";
import { AccountHeader, EmptyAccountState } from "@/components/account/account-ui";
import { ProductCard } from "@/components/store/product-card";
import { prisma } from "@/lib/prisma";

export default async function AccountFavoritesPage() {
  const session = await auth(); if (!session?.user) redirect("/auth/login");
  const favorites = await prisma.favorite.findMany({ where: { userId: session.user.id }, orderBy: { createdAt: "desc" }, include: { product: { include: { brand: true, images: { orderBy: { position: "asc" }, take: 1 } } } } });
  return <><AccountHeader eyebrow="Tu seleccion" title="Favoritos" description={`${favorites.length} producto${favorites.length === 1 ? "" : "s"} guardado${favorites.length === 1 ? "" : "s"} para más tarde.`} />
    {favorites.length ? <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{favorites.map(({ product }) => <ProductCard key={product.id} product={product} />)}</div> : <EmptyAccountState icon={Heart} title="Tu lista esta vacia" description="Guarda productos con el corazon para encontrarlos rapido cuando quieras comprar."><Link href="/productos" className="inline-flex h-10 items-center rounded-full bg-neutral-950 px-4 text-sm font-bold text-white">Explorar productos</Link></EmptyAccountState>}
  </>;
}
