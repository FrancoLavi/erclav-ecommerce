import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { ProductCard } from "@/components/store/product-card";
import { StoreShell } from "@/components/store/store-shell";
import { prisma } from "@/lib/prisma";

export default async function FavoritesPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  const favorites = await prisma.favorite.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      product: {
        include: {
          brand: true,
          images: { orderBy: { position: "asc" }, take: 1 },
        },
      },
    },
  });

  return (
    <StoreShell>
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-black tracking-tight">Wishlist</h1>
        <p className="mt-3 text-neutral-600">Tus productos guardados para comprar despues.</p>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {favorites.map(({ product }) => <ProductCard key={product.id} product={product} />)}
        </div>
        {!favorites.length ? <p className="mt-8 text-sm text-neutral-500">Todavia no guardaste productos.</p> : null}
      </main>
    </StoreShell>
  );
}
