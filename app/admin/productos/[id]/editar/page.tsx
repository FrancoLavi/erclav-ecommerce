import { notFound } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-shell";
import { ProductForm } from "@/components/admin/product-form";
import { prisma } from "@/lib/prisma";

type EditProductPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params;
  const [product, categories, brands] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: {
        categories: true,
        images: { orderBy: { position: "asc" } },
        variants: { include: { stock: true }, orderBy: { createdAt: "asc" } },
      },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.brand.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!product) {
    notFound();
  }

  return (
    <AdminShell title="Editar producto" description="Actualiza datos comerciales, imagenes, variantes y stock.">
      <ProductForm product={product} categories={categories} brands={brands} />
    </AdminShell>
  );
}
