"use server";

import { cookies } from "next/headers";
import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";

const cartCookieName = "erclav_cart_id";

const addToCartSchema = z.object({
  variantId: z.string().min(1),
  quantity: z.coerce.number().int().positive().default(1),
});

const reviewSchema = z.object({
  productId: z.string().min(1),
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().trim().optional(),
  comment: z.string().trim().optional(),
});

async function getOrCreateCart(userId?: string) {
  const cookieStore = await cookies();
  const cartId = cookieStore.get(cartCookieName)?.value;

  if (cartId) {
    const cart = await prisma.cart.findFirst({
      where: {
        id: cartId,
        status: "ACTIVE",
      },
    });
    if (cart) return cart;
  }

  const cart = await prisma.cart.create({
    data: {
      userId,
      status: "ACTIVE",
    },
  });

  cookieStore.set(cartCookieName, cart.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return cart;
}

export async function addToCartAction(formData: FormData) {
  if (!(await checkRateLimit("store:cart", { limit: 60, windowMs: 60 * 1000 })).allowed) return;
  const session = await auth();
  const parsed = addToCartSchema.safeParse({
    variantId: formData.get("variantId"),
    quantity: formData.get("quantity") ?? 1,
  });

  if (!parsed.success) return;

  const variant = await prisma.productVariant.findUnique({
    where: { id: parsed.data.variantId },
    select: { id: true, isActive: true, price: true, product: { select: { id: true, isActive: true, salePrice: true, basePrice: true, slug: true } } },
  });

  if (!variant || !variant.isActive || !variant.product.isActive) return;

  const cart = await getOrCreateCart(session?.user?.id);
  const unitPrice = variant.price ?? variant.product.salePrice ?? variant.product.basePrice;

  await prisma.cartItem.upsert({
    where: {
      cartId_variantId: {
        cartId: cart.id,
        variantId: variant.id,
      },
    },
    update: {
      quantity: { increment: parsed.data.quantity },
      unitPrice,
    },
    create: {
      cartId: cart.id,
      variantId: variant.id,
      quantity: parsed.data.quantity,
      unitPrice,
    },
  });

  revalidatePath("/");
  revalidatePath(`/productos/${variant.product.slug}`);
}

export async function addAssistantCartItemAction(variantId: string) {
  if (!(await checkRateLimit("store:assistant-cart", { limit: 30, windowMs: 60 * 1000 })).allowed) {
    return { ok: false, message: "Espera un momento antes de volver a agregar productos." };
  }

  const parsed = z.string().min(1).max(64).safeParse(variantId);
  if (!parsed.success) return { ok: false, message: "La variante seleccionada no es valida." };

  const session = await auth();
  const variant = await prisma.productVariant.findUnique({
    where: { id: parsed.data },
    select: {
      id: true,
      isActive: true,
      price: true,
      stock: { select: { quantity: true, reservedQuantity: true } },
      product: {
        select: { name: true, slug: true, isActive: true, salePrice: true, basePrice: true },
      },
    },
  });

  if (!variant?.isActive || !variant.product.isActive) {
    return { ok: false, message: "Este producto ya no esta disponible." };
  }

  const available = Math.max(0, (variant.stock?.quantity ?? 0) - (variant.stock?.reservedQuantity ?? 0));
  if (!available) return { ok: false, message: "Esta variante no tiene stock disponible." };

  const cart = await getOrCreateCart(session?.user?.id);
  const existing = await prisma.cartItem.findUnique({
    where: { cartId_variantId: { cartId: cart.id, variantId: variant.id } },
    select: { quantity: true },
  });

  if ((existing?.quantity ?? 0) >= available) {
    return { ok: false, message: "Ya tenes en el carrito todas las unidades disponibles." };
  }

  const unitPrice = variant.price ?? variant.product.salePrice ?? variant.product.basePrice;
  await prisma.cartItem.upsert({
    where: { cartId_variantId: { cartId: cart.id, variantId: variant.id } },
    update: { quantity: { increment: 1 }, unitPrice },
    create: { cartId: cart.id, variantId: variant.id, quantity: 1, unitPrice },
  });

  revalidatePath("/");
  revalidatePath("/checkout");
  revalidatePath(`/productos/${variant.product.slug}`);
  return { ok: true, message: `${variant.product.name} se agrego al carrito.` };
}

export async function updateCartItemAction(itemId: string, quantity: number) {
  const cookieStore = await cookies();
  const cartId = cookieStore.get(cartCookieName)?.value;
  if (!cartId) return;

  if (quantity <= 0) {
    await prisma.cartItem.deleteMany({ where: { id: itemId, cartId } });
  } else {
    await prisma.cartItem.updateMany({ where: { id: itemId, cartId }, data: { quantity } });
  }

  revalidatePath("/");
}

export async function toggleFavoriteAction(productId: string) {
  if (!(await checkRateLimit("store:favorite", { limit: 60, windowMs: 60 * 1000 })).allowed) return;
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/login");
  }

  const existing = await prisma.favorite.findUnique({
    where: {
      userId_productId: {
        userId: session.user.id,
        productId,
      },
    },
  });

  if (existing) {
    await prisma.favorite.delete({
      where: {
        userId_productId: {
          userId: session.user.id,
          productId,
        },
      },
    });
  } else {
    await prisma.favorite.create({
      data: {
        userId: session.user.id,
        productId,
      },
    });
  }

  revalidatePath("/");
  revalidatePath("/favoritos");
  revalidatePath("/cuenta/favoritos");
}

export async function createReviewAction(formData: FormData) {
  if (!(await checkRateLimit("store:review", { limit: 10, windowMs: 60 * 60 * 1000 })).allowed) return;
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  const parsed = reviewSchema.safeParse({
    productId: formData.get("productId"),
    rating: formData.get("rating"),
    title: formData.get("title"),
    comment: formData.get("comment"),
  });

  if (!parsed.success) return;

  await prisma.review.upsert({
    where: {
      userId_productId: {
        userId: session.user.id,
        productId: parsed.data.productId,
      },
    },
    update: {
      rating: parsed.data.rating,
      title: parsed.data.title,
      comment: parsed.data.comment,
      isVisible: true,
    },
    create: {
      userId: session.user.id,
      productId: parsed.data.productId,
      rating: parsed.data.rating,
      title: parsed.data.title,
      comment: parsed.data.comment,
    },
  });

  const product = await prisma.product.findUnique({ where: { id: parsed.data.productId }, select: { slug: true } });
  if (product) {
    revalidateTag("products");
    revalidatePath(`/productos/${product.slug}`);
  }
}

export async function getCart() {
  const cookieStore = await cookies();
  const cartId = cookieStore.get(cartCookieName)?.value;

  if (!cartId) return null;

  return prisma.cart.findFirst({
    where: { id: cartId, status: "ACTIVE" },
    select: {
      id: true,
      items: {
        select: {
          id: true,
          quantity: true,
          unitPrice: true,
          variant: {
            select: {
              id: true,
              sku: true,
              color: true,
              size: true,
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  images: { orderBy: { position: "asc" }, take: 1, select: { id: true, url: true, altText: true } },
                },
              },
            },
          },
        },
      },
    },
  });
}
