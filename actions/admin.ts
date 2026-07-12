"use server";

import { mkdir, writeFile } from "fs/promises";
import path from "path";

import type { CouponDiscountType, OrderStatus, RoleName } from "@prisma/client";
import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { auth } from "@/auth";
import { sendInvoiceEmail, sendOrderCancelledEmail, sendOrderStatusEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";

type ActionState = {
  ok: boolean;
  message: string;
};

const emptyState: ActionState = {
  ok: false,
  message: "",
};

const productSchema = z.object({
  name: z.string().trim().min(2),
  slug: z.string().trim().min(2),
  description: z.string().trim().optional(),
  sku: z.string().trim().optional(),
  brandId: z.string().trim().optional(),
  basePrice: z.coerce.number().positive(),
  salePrice: z.coerce.number().positive().optional(),
  isActive: z.coerce.boolean().default(true),
});

const categorySchema = z.object({
  name: z.string().trim().min(2),
  slug: z.string().trim().min(2),
  description: z.string().trim().optional(),
  parentId: z.string().trim().optional(),
  isActive: z.coerce.boolean().default(true),
});

const brandSchema = z.object({
  name: z.string().trim().min(2),
  slug: z.string().trim().min(2),
  description: z.string().trim().optional(),
  logoUrl: z.string().trim().optional(),
  isActive: z.coerce.boolean().default(true),
});

const couponSchema = z.object({
  code: z.string().trim().min(2).transform((value) => value.toUpperCase()),
  description: z.string().trim().optional(),
  discountType: z.enum(["PERCENTAGE", "FIXED_AMOUNT"]),
  discountValue: z.coerce.number().positive(),
  minimumSubtotal: z.coerce.number().nonnegative().optional(),
  maxDiscount: z.coerce.number().positive().optional(),
  usageLimit: z.coerce.number().int().positive().optional(),
  perUserLimit: z.coerce.number().int().positive().optional(),
  startsAt: z.string().trim().optional(),
  endsAt: z.string().trim().optional(),
  isActive: z.coerce.boolean().default(true),
});

async function requireAdmin() {
  const session = await auth();

  if (!session?.user?.roles.includes("ADMIN")) {
    redirect("/auth/login");
  }

  return session;
}

function textValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() ? value : undefined;
}

function checkboxValue(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

function parseOptionalDate(value?: string) {
  return value ? new Date(value) : undefined;
}

function firstError(error: z.ZodError) {
  return error.issues[0]?.message ?? "Revisa los datos e intenta otra vez.";
}

async function saveProductImages(files: File[]) {
  const extensions: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/avif": ".avif",
  };
  const validFiles = files.filter((file) => file.size > 0 && file.size <= 8 * 1024 * 1024 && Boolean(extensions[file.type]));

  if (!validFiles.length) {
    return [];
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads", "products");
  await mkdir(uploadDir, { recursive: true });

  const urls: string[] = [];

  for (const file of validFiles) {
    const extension = extensions[file.type];
    const fileName = `${Date.now()}-${crypto.randomUUID()}${extension}`;
    const bytes = await file.arrayBuffer();
    await writeFile(path.join(uploadDir, fileName), Buffer.from(bytes));
    urls.push(`/uploads/products/${fileName}`);
  }

  return urls;
}

function selectedIds(formData: FormData, key: string) {
  return formData.getAll(key).filter((value): value is string => typeof value === "string" && value.length > 0);
}

function variantRows(formData: FormData) {
  const skus = formData.getAll("variantSku");
  const ids = formData.getAll("variantId");
  const colors = formData.getAll("variantColor");
  const sizes = formData.getAll("variantSize");
  const prices = formData.getAll("variantPrice");
  const quantities = formData.getAll("variantQuantity");

  return skus
    .map((sku, index) => ({
      id: typeof ids[index] === "string" ? ids[index] : "",
      sku: typeof sku === "string" ? sku.trim() : "",
      color: typeof colors[index] === "string" ? colors[index].trim() : "",
      size: typeof sizes[index] === "string" ? sizes[index].trim() : "",
      price: typeof prices[index] === "string" && prices[index] ? prices[index] : undefined,
      quantity: typeof quantities[index] === "string" && quantities[index] ? Number(quantities[index]) : 0,
    }))
    .filter((row) => row.sku);
}

export async function createProductAction(_: ActionState = emptyState, formData: FormData) {
  void _;
  await requireAdmin();

  const parsed = productSchema.safeParse({
    name: textValue(formData, "name"),
    slug: textValue(formData, "slug"),
    description: textValue(formData, "description"),
    sku: textValue(formData, "sku"),
    brandId: textValue(formData, "brandId"),
    basePrice: textValue(formData, "basePrice"),
    salePrice: textValue(formData, "salePrice"),
    isActive: checkboxValue(formData, "isActive"),
  });

  if (!parsed.success) {
    return { ok: false, message: firstError(parsed.error) };
  }

  const categoryIds = selectedIds(formData, "categoryIds");
  const variants = variantRows(formData);
  const imageUrls = await saveProductImages(formData.getAll("images").filter((file): file is File => file instanceof File));

  const product = await prisma.product.create({
    data: {
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description,
      sku: parsed.data.sku,
      brandId: parsed.data.brandId,
      basePrice: parsed.data.basePrice,
      salePrice: parsed.data.salePrice,
      isActive: parsed.data.isActive,
      categories: {
        create: categoryIds.map((categoryId) => ({ categoryId })),
      },
      images: {
        create: imageUrls.map((url, index) => ({
          url,
          position: index,
          isPrimary: index === 0,
        })),
      },
      variants: {
        create: variants.map((variant) => ({
          sku: variant.sku,
          color: variant.color || null,
          size: variant.size || null,
          price: variant.price,
          stock: {
            create: {
              quantity: variant.quantity,
            },
          },
        })),
      },
    },
  });

  revalidatePath("/admin/productos");
  revalidateTag("catalog");
  redirect(`/admin/productos/${product.id}/editar`);
}

export async function updateProductAction(productId: string, _: ActionState = emptyState, formData: FormData) {
  void _;
  await requireAdmin();

  const parsed = productSchema.safeParse({
    name: textValue(formData, "name"),
    slug: textValue(formData, "slug"),
    description: textValue(formData, "description"),
    sku: textValue(formData, "sku"),
    brandId: textValue(formData, "brandId"),
    basePrice: textValue(formData, "basePrice"),
    salePrice: textValue(formData, "salePrice"),
    isActive: checkboxValue(formData, "isActive"),
  });

  if (!parsed.success) {
    return { ok: false, message: firstError(parsed.error) };
  }

  const categoryIds = selectedIds(formData, "categoryIds");
  const variants = variantRows(formData);
  const imageUrls = await saveProductImages(formData.getAll("images").filter((file): file is File => file instanceof File));

  await prisma.$transaction(async (tx) => {
    await tx.product.update({
      where: { id: productId },
      data: {
        name: parsed.data.name,
        slug: parsed.data.slug,
        description: parsed.data.description,
        sku: parsed.data.sku,
        brandId: parsed.data.brandId,
        basePrice: parsed.data.basePrice,
        salePrice: parsed.data.salePrice,
        isActive: parsed.data.isActive,
      },
    });

    await tx.productCategory.deleteMany({ where: { productId } });
    await tx.productCategory.createMany({
      data: categoryIds.map((categoryId) => ({ productId, categoryId })),
      skipDuplicates: true,
    });

    for (const variant of variants) {
      if (variant.id) {
        const currentStock = await tx.stock.findUnique({ where: { variantId: variant.id } });
        await tx.productVariant.update({
          where: { id: variant.id },
          data: {
            sku: variant.sku,
            color: variant.color || null,
            size: variant.size || null,
            price: variant.price,
          },
        });
        await tx.stock.upsert({
          where: { variantId: variant.id },
          update: { quantity: variant.quantity },
          create: { variantId: variant.id, quantity: variant.quantity },
        });
        if (currentStock && currentStock.quantity !== variant.quantity) {
          await tx.stockMovement.create({
            data: {
              variantId: variant.id,
              type: "ADJUSTMENT",
              quantity: variant.quantity - currentStock.quantity,
              previousQty: currentStock.quantity,
              newQty: variant.quantity,
              reason: "Actualizacion desde panel admin",
            },
          });
        }
      } else {
        await tx.productVariant.create({
          data: {
            productId,
            sku: variant.sku,
            color: variant.color || null,
            size: variant.size || null,
            price: variant.price,
            stock: { create: { quantity: variant.quantity } },
          },
        });
      }
    }

    if (imageUrls.length) {
      const lastImage = await tx.productImage.findFirst({
        where: { productId },
        orderBy: { position: "desc" },
      });
      const start = (lastImage?.position ?? -1) + 1;
      await tx.productImage.createMany({
        data: imageUrls.map((url, index) => ({
          productId,
          url,
          position: start + index,
          isPrimary: start + index === 0,
        })),
      });
    }
  });

  revalidatePath("/admin/productos");
  revalidatePath(`/admin/productos/${productId}/editar`);
  revalidateTag("catalog");
  return { ok: true, message: "Producto actualizado." };
}

export async function deleteProductAction(productId: string) {
  await requireAdmin();
  await prisma.product.update({ where: { id: productId }, data: { isActive: false } });
  revalidatePath("/admin/productos");
  revalidateTag("catalog");
}

export async function deleteProductImageAction(imageId: string, productId: string) {
  await requireAdmin();
  await prisma.productImage.delete({ where: { id: imageId } });
  revalidatePath(`/admin/productos/${productId}/editar`);
  revalidateTag("catalog");
}

export async function createCategoryAction(_: ActionState = emptyState, formData: FormData) {
  void _;
  await requireAdmin();
  const parsed = categorySchema.safeParse({
    name: textValue(formData, "name"),
    slug: textValue(formData, "slug"),
    description: textValue(formData, "description"),
    parentId: textValue(formData, "parentId"),
    isActive: checkboxValue(formData, "isActive"),
  });

  if (!parsed.success) return { ok: false, message: firstError(parsed.error) };

  await prisma.category.create({ data: parsed.data });
  revalidatePath("/admin/categorias");
  revalidateTag("catalog");
  return { ok: true, message: "Categoria creada." };
}

export async function createBrandAction(_: ActionState = emptyState, formData: FormData) {
  void _;
  await requireAdmin();
  const parsed = brandSchema.safeParse({
    name: textValue(formData, "name"),
    slug: textValue(formData, "slug"),
    description: textValue(formData, "description"),
    logoUrl: textValue(formData, "logoUrl"),
    isActive: checkboxValue(formData, "isActive"),
  });

  if (!parsed.success) return { ok: false, message: firstError(parsed.error) };

  await prisma.brand.create({ data: parsed.data });
  revalidatePath("/admin/marcas");
  revalidateTag("catalog");
  return { ok: true, message: "Marca creada." };
}

export async function updateOrderStatusAction(orderId: string, formData: FormData) {
  await requireAdmin();
  const status = textValue(formData, "status") as OrderStatus | undefined;
  if (!status) return;

  const previousOrder = await prisma.order.findUnique({
    where: { id: orderId },
    select: { status: true },
  });

  await prisma.order.update({
    where: { id: orderId },
    data: {
      status,
      paidAt: status === "PAID" ? new Date() : undefined,
      shippedAt: status === "SHIPPED" ? new Date() : undefined,
      deliveredAt: status === "DELIVERED" ? new Date() : undefined,
      cancelledAt: status === "CANCELLED" ? new Date() : undefined,
    },
  });

  if (previousOrder?.status !== status) {
    await sendOrderStatusEmail(orderId, status);
    if (status === "PAID") await sendInvoiceEmail(orderId);
    if (status === "CANCELLED") await sendOrderCancelledEmail(orderId, "Cancelada desde el panel administrador.");
  }

  revalidatePath("/admin/ordenes");
}

export async function updateUserAction(userId: string, formData: FormData) {
  await requireAdmin();
  const isActive = checkboxValue(formData, "isActive");
  const roleNames = selectedIds(formData, "roles") as RoleName[];

  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id: userId }, data: { isActive } });
    await tx.userRole.deleteMany({ where: { userId } });
    const roles = await tx.role.findMany({ where: { name: { in: roleNames } } });
    await tx.userRole.createMany({
      data: roles.map((role) => ({ userId, roleId: role.id })),
      skipDuplicates: true,
    });
  });

  revalidatePath("/admin/usuarios");
}

export async function createCouponAction(_: ActionState = emptyState, formData: FormData) {
  void _;
  await requireAdmin();
  const parsed = couponSchema.safeParse({
    code: textValue(formData, "code"),
    description: textValue(formData, "description"),
    discountType: textValue(formData, "discountType"),
    discountValue: textValue(formData, "discountValue"),
    minimumSubtotal: textValue(formData, "minimumSubtotal"),
    maxDiscount: textValue(formData, "maxDiscount"),
    usageLimit: textValue(formData, "usageLimit"),
    perUserLimit: textValue(formData, "perUserLimit"),
    startsAt: textValue(formData, "startsAt"),
    endsAt: textValue(formData, "endsAt"),
    isActive: checkboxValue(formData, "isActive"),
  });

  if (!parsed.success) return { ok: false, message: firstError(parsed.error) };

  await prisma.coupon.create({
    data: {
      code: parsed.data.code,
      description: parsed.data.description,
      discountType: parsed.data.discountType as CouponDiscountType,
      discountValue: parsed.data.discountValue,
      minimumSubtotal: parsed.data.minimumSubtotal,
      maxDiscount: parsed.data.maxDiscount,
      usageLimit: parsed.data.usageLimit,
      perUserLimit: parsed.data.perUserLimit,
      startsAt: parseOptionalDate(parsed.data.startsAt),
      endsAt: parseOptionalDate(parsed.data.endsAt),
      isActive: parsed.data.isActive,
    },
  });
  revalidatePath("/admin/cupones");
  return { ok: true, message: "Cupon creado." };
}

export async function toggleCouponAction(couponId: string, isActive: boolean) {
  await requireAdmin();
  await prisma.coupon.update({ where: { id: couponId }, data: { isActive } });
  revalidatePath("/admin/cupones");
}
