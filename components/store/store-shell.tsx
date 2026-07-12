import Link from "next/link";
import dynamic from "next/dynamic";
import { Heart, Search, ShieldCheck, ShoppingBag, User } from "lucide-react";

import { auth } from "@/auth";
import { getCart } from "@/actions/store";
import { getNavigationCategories } from "@/lib/catalog-data";

const CartDrawer = dynamic(() => import("@/components/store/cart-drawer").then((module) => module.CartDrawer), {
  loading: () => <span className="inline-flex h-10 w-10" aria-hidden />,
});

export async function StoreShell({ children }: { children: React.ReactNode }) {
  const [session, categories, cart] = await Promise.all([
    auth(),
    getNavigationCategories(),
    getCart(),
  ]);

  const cartCount = cart?.items.reduce((total, item) => total + item.quantity, 0) ?? 0;
  const drawerCart = cart
    ? {
        id: cart.id,
        items: cart.items.map((item) => ({
          id: item.id,
          quantity: item.quantity,
          unitPrice: item.unitPrice.toString(),
          variant: {
            id: item.variant.id,
            sku: item.variant.sku,
            color: item.variant.color,
            size: item.variant.size,
            product: {
              id: item.variant.product.id,
              name: item.variant.product.name,
              slug: item.variant.product.slug,
              images: item.variant.product.images.map((image) => ({
                id: image.id,
                url: image.url,
                altText: image.altText,
              })),
            },
          },
        })),
      }
    : null;

  return (
    <div className="min-h-screen bg-[#f7f7f5] text-neutral-950">
      <a href="#main-content" className="skip-link">Saltar al contenido principal</a>
      <header className="sticky top-0 z-40 border-b border-black/10 bg-white/95 backdrop-blur-xl">
        <div className="bg-neutral-950 px-4 py-2 text-center text-xs font-semibold text-white/75">
          Compra segura con stock actualizado, pagos protegidos y envios a todo el pais.
        </div>
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="text-2xl font-black tracking-tight">
            ErcLav
          </Link>
          <nav className="hidden items-center gap-5 text-sm font-semibold text-neutral-600 lg:flex">
            {categories.map((category) => (
              <Link key={category.id} href={`/productos?category=${category.slug}`} className="transition hover:text-neutral-950">
                {category.name}
              </Link>
            ))}
          </nav>
          <form action="/productos" className="ml-auto hidden max-w-sm flex-1 items-center rounded-full border border-black/5 bg-[#f2f0eb] px-4 shadow-inner md:flex">
            <Search className="h-4 w-4 text-neutral-500" aria-hidden />
            <input
              name="q"
              placeholder="Buscar productos"
              className="h-10 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-neutral-400"
            />
          </form>
          <div className="ml-auto flex items-center gap-2 md:ml-0">
            <Link href={session ? "/cuenta/favoritos" : "/favoritos"} className="grid h-10 w-10 place-items-center rounded-full transition hover:bg-neutral-100" aria-label="Favoritos">
              <Heart className="h-5 w-5" aria-hidden />
            </Link>
            <Link href={session ? "/cuenta" : "/auth/login"} className="grid h-10 w-10 place-items-center rounded-full transition hover:bg-neutral-100" aria-label="Cuenta">
              <User className="h-5 w-5" aria-hidden />
            </Link>
            <CartDrawer cart={drawerCart} count={cartCount}>
              <button className="relative grid h-10 w-10 place-items-center rounded-full transition hover:bg-neutral-100" aria-label="Carrito">
                <ShoppingBag className="h-5 w-5" aria-hidden />
                {cartCount ? (
                  <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-[#e41f26] px-1 text-xs font-bold text-white">
                    {cartCount}
                  </span>
                ) : null}
              </button>
            </CartDrawer>
          </div>
        </div>
        <div className="no-scrollbar mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 pb-3 sm:px-6 lg:hidden">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/productos?category=${category.slug}`}
              className="shrink-0 rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-neutral-700"
            >
              {category.name}
            </Link>
          ))}
        </div>
        <form action="/productos" className="border-t border-black/10 px-4 py-3 md:hidden">
          <div className="flex items-center rounded-full border border-black/5 bg-[#f2f0eb] px-4">
            <Search className="h-4 w-4 text-neutral-500" aria-hidden />
            <input name="q" placeholder="Buscar productos" className="h-10 flex-1 bg-transparent px-3 text-sm outline-none" />
          </div>
        </form>
      </header>
      <div id="main-content" tabIndex={-1}>{children}</div>
      <footer className="mt-16 border-t border-black/10 bg-neutral-950 text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-[1.2fr_0.8fr_0.8fr] lg:px-8">
          <div>
            <p className="text-2xl font-black">ErcLav</p>
            <p className="mt-3 max-w-sm text-sm leading-6 text-white/60">
              Ecommerce premium con catalogo curado, checkout seguro y experiencia rapida en todos los dispositivos.
            </p>
          </div>
          <div>
            <p className="text-sm font-bold uppercase text-white/50">Tienda</p>
            <div className="mt-4 grid gap-2 text-sm text-white/70">
              <Link href="/productos" className="hover:text-white">
                Productos
              </Link>
              <Link href={session ? "/cuenta/favoritos" : "/favoritos"} className="hover:text-white">
                Wishlist
              </Link>
              <Link href="/cuenta" className="hover:text-white">
                Mi cuenta
              </Link>
            </div>
          </div>
          <div className="flex items-start gap-3 text-sm text-white/70 md:justify-end">
            <ShieldCheck className="mt-1 h-5 w-5 shrink-0" aria-hidden />
            <span>Compras protegidas, stock actualizado y soporte postventa.</span>
          </div>
          <div className="border-t border-white/10 pt-6 text-sm text-white/50 md:col-span-3">
            © 2026 ErcLav. Todos los derechos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}
