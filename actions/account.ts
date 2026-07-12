"use server";

import bcrypt from "bcrypt";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";

export type AccountActionState = { ok: boolean; message: string };

const profileSchema = z.object({
  firstName: z.string().trim().min(2, "Ingresa tu nombre."),
  lastName: z.string().trim().min(2, "Ingresa tu apellido."),
  phone: z.string().trim().max(30).optional(),
  documentNumber: z.string().trim().max(30).optional(),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Ingresa tu contrasena actual."),
    newPassword: z
      .string()
      .min(8, "La nueva contrasena debe tener al menos 8 caracteres.")
      .regex(/[A-Z]/, "Agrega al menos una mayuscula.")
      .regex(/[a-z]/, "Agrega al menos una minuscula.")
      .regex(/[0-9]/, "Agrega al menos un numero."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Las contrasenas nuevas no coinciden.",
    path: ["confirmPassword"],
  });

const addressSchema = z.object({
  label: z.string().trim().max(40).optional(),
  type: z.enum(["SHIPPING", "BILLING"]).default("SHIPPING"),
  firstName: z.string().trim().min(2),
  lastName: z.string().trim().min(2),
  phone: z.string().trim().max(30).optional(),
  street: z.string().trim().min(2),
  number: z.string().trim().max(20).optional(),
  apartment: z.string().trim().max(20).optional(),
  city: z.string().trim().min(2),
  province: z.string().trim().min(2),
  postalCode: z.string().trim().min(3),
  country: z.string().trim().length(2).default("AR"),
});

async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");
  return session.user.id;
}

function firstError(error: z.ZodError) {
  return error.issues[0]?.message ?? "Revisa los datos e intenta otra vez.";
}

export async function updateProfileAction(
  _: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const userId = await requireUserId();
  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: firstError(parsed.error) };

  await prisma.user.update({
    where: { id: userId },
    data: {
      ...parsed.data,
      phone: parsed.data.phone || null,
      documentNumber: parsed.data.documentNumber || null,
      name: `${parsed.data.firstName} ${parsed.data.lastName}`,
    },
  });

  revalidatePath("/cuenta", "layout");
  return { ok: true, message: "Perfil actualizado correctamente." };
}

export async function changePasswordAction(
  _: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const rate = await checkRateLimit("account:password", { limit: 5, windowMs: 15 * 60 * 1000 });
  if (!rate.allowed) return { ok: false, message: "Demasiados intentos. Espera unos minutos." };
  const userId = await requireUserId();
  const parsed = passwordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: firstError(parsed.error) };

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true },
  });
  if (!user || !(await bcrypt.compare(parsed.data.currentPassword, user.passwordHash))) {
    return { ok: false, message: "La contrasena actual no es correcta." };
  }
  if (await bcrypt.compare(parsed.data.newPassword, user.passwordHash)) {
    return { ok: false, message: "La nueva contrasena debe ser diferente a la actual." };
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { passwordHash: await bcrypt.hash(parsed.data.newPassword, 12) },
    }),
    prisma.passwordResetToken.deleteMany({ where: { userId } }),
    prisma.session.deleteMany({ where: { userId } }),
    prisma.logEntry.create({
      data: { userId, action: "ACCOUNT_PASSWORD_CHANGED", entityType: "User", entityId: userId },
    }),
  ]);

  return { ok: true, message: "Contrasena actualizada correctamente." };
}

export async function createAddressAction(formData: FormData) {
  const userId = await requireUserId();
  const parsed = addressSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/cuenta/direcciones?error=datos");

  const count = await prisma.address.count({ where: { userId } });
  await prisma.address.create({
    data: {
      ...parsed.data,
      label: parsed.data.label || null,
      phone: parsed.data.phone || null,
      number: parsed.data.number || null,
      apartment: parsed.data.apartment || null,
      userId,
      isDefault: count === 0,
    },
  });
  revalidatePath("/cuenta", "layout");
  redirect("/cuenta/direcciones?created=1");
}

export async function updateAddressAction(addressId: string, formData: FormData) {
  const userId = await requireUserId();
  const parsed = addressSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/cuenta/direcciones?error=datos");

  await prisma.address.updateMany({
    where: { id: addressId, userId },
    data: {
      ...parsed.data,
      label: parsed.data.label || null,
      phone: parsed.data.phone || null,
      number: parsed.data.number || null,
      apartment: parsed.data.apartment || null,
    },
  });
  revalidatePath("/cuenta", "layout");
  redirect("/cuenta/direcciones?updated=1");
}

export async function setDefaultAddressAction(addressId: string) {
  const userId = await requireUserId();
  const address = await prisma.address.findFirst({ where: { id: addressId, userId } });
  if (!address) return;

  await prisma.$transaction([
    prisma.address.updateMany({ where: { userId, type: address.type }, data: { isDefault: false } }),
    prisma.address.update({ where: { id: address.id }, data: { isDefault: true } }),
  ]);
  revalidatePath("/cuenta", "layout");
}

export async function deleteAddressAction(addressId: string) {
  const userId = await requireUserId();
  const address = await prisma.address.findFirst({ where: { id: addressId, userId } });
  if (!address) return;

  await prisma.address.delete({ where: { id: address.id } });
  if (address.isDefault) {
    const replacement = await prisma.address.findFirst({
      where: { userId, type: address.type },
      orderBy: { createdAt: "desc" },
    });
    if (replacement) await prisma.address.update({ where: { id: replacement.id }, data: { isDefault: true } });
  }
  revalidatePath("/cuenta", "layout");
}

export async function setDefaultPaymentMethodAction(methodId: string) {
  const userId = await requireUserId();
  const method = await prisma.paymentMethod.findFirst({ where: { id: methodId, userId } });
  if (!method) return;

  await prisma.$transaction([
    prisma.paymentMethod.updateMany({ where: { userId }, data: { isDefault: false } }),
    prisma.paymentMethod.update({ where: { id: method.id }, data: { isDefault: true } }),
  ]);
  revalidatePath("/cuenta/pagos");
}

export async function deletePaymentMethodAction(methodId: string) {
  const userId = await requireUserId();
  const method = await prisma.paymentMethod.findFirst({ where: { id: methodId, userId } });
  if (!method) return;
  await prisma.paymentMethod.delete({ where: { id: method.id } });
  if (method.isDefault) {
    const replacement = await prisma.paymentMethod.findFirst({
      where: { userId, status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
    });
    if (replacement) {
      await prisma.paymentMethod.update({ where: { id: replacement.id }, data: { isDefault: true } });
    }
  }
  revalidatePath("/cuenta/pagos");
}

export async function reorderAction(orderId: string) {
  const userId = await requireUserId();
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId },
    include: {
      items: {
        include: {
          variant: { include: { stock: true, product: true } },
        },
      },
    },
  });
  if (!order) redirect("/cuenta/pedidos?error=pedido");

  const availableItems = order.items.filter((item) => {
    const available = (item.variant.stock?.quantity ?? 0) - (item.variant.stock?.reservedQuantity ?? 0);
    return item.variant.isActive && item.variant.product.isActive && available > 0;
  });
  if (!availableItems.length) redirect("/cuenta/pedidos?error=stock");

  const cookieStore = await cookies();
  const cookieCartId = cookieStore.get("erclav_cart_id")?.value;
  let cart = cookieCartId
    ? await prisma.cart.findFirst({ where: { id: cookieCartId, status: "ACTIVE" } })
    : null;

  if (!cart) {
    cart = await prisma.cart.create({ data: { userId, status: "ACTIVE" } });
    cookieStore.set("erclav_cart_id", cart.id, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  } else if (!cart.userId) {
    cart = await prisma.cart.update({ where: { id: cart.id }, data: { userId } });
  }

  for (const item of availableItems) {
    const available = (item.variant.stock?.quantity ?? 0) - (item.variant.stock?.reservedQuantity ?? 0);
    const existing = await prisma.cartItem.findUnique({
      where: { cartId_variantId: { cartId: cart.id, variantId: item.variantId } },
    });
    const quantity = Math.max(0, Math.min(item.quantity, available - (existing?.quantity ?? 0)));
    if (!quantity) continue;
    const unitPrice = item.variant.price ?? item.variant.product.salePrice ?? item.variant.product.basePrice;
    await prisma.cartItem.upsert({
      where: { cartId_variantId: { cartId: cart.id, variantId: item.variantId } },
      update: { quantity: { increment: quantity }, unitPrice },
      create: { cartId: cart.id, variantId: item.variantId, quantity, unitPrice },
    });
  }

  revalidatePath("/");
  redirect("/checkout?reordered=1");
}
