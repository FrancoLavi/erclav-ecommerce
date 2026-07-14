import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { productImageUrl } from "@/lib/product-image";
import type { AssistantReply, ShoppingAssistantProvider } from "@/lib/assistant/types";

const stopWords = new Set([
  "algo", "busco", "comprar", "con", "de", "del", "el", "en", "la", "las", "lo", "los", "me",
  "disponibilidad", "disponible", "desde", "hasta", "mas", "menos", "mostrar", "para", "por", "producto",
  "productos", "que", "quiero", "recomenda", "recomendas", "sin", "stock", "tenes", "tienen", "un", "una",
  "unos", "unas", "ver",
]);

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function includesTerm(message: string, value: string) {
  const term = normalize(value);
  return new RegExp(`(^|[^a-z0-9])${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}($|[^a-z0-9])`).test(message);
}

function parseAmount(raw: string, suffix?: string) {
  const normalized = raw.replace(/\s/g, "");
  const value = normalized.includes(".") && normalized.split(".").at(-1)?.length === 3
    ? Number(normalized.replaceAll(".", "").replace(",", "."))
    : Number(normalized.replace(",", "."));
  if (!Number.isFinite(value)) return undefined;
  return suffix ? value * 1_000 : value;
}

function priceRange(message: string) {
  const amount = "([\\d.,]+)\\s*(mil|k)?";
  const max = message.match(new RegExp(`(?:hasta|menos de|maximo|tope|por debajo de)\\s*\\$?\\s*${amount}`));
  const min = message.match(new RegExp(`(?:desde|mas de|minimo|por encima de)\\s*\\$?\\s*${amount}`));
  return {
    max: max ? parseAmount(max[1], max[2]) : undefined,
    min: min ? parseAmount(min[1], min[2]) : undefined,
  };
}

function faqReply(message: string): AssistantReply | null {
  if (/^(hola|buenas|buen dia|buenas tardes|buenas noches|ayuda)\b/.test(message)) {
    return {
      message: "Hola. Puedo ayudarte a encontrar productos o responder dudas sobre envios, pagos, stock y pedidos.",
      products: [],
      suggestions: ["Buscar por menos de $80.000", "Como son los envios?", "Que medios de pago aceptan?"],
    };
  }
  if (/envio|entrega|demora|retiro/.test(message)) {
    return {
      message: "Tenemos envio estandar de 3 a 6 dias habiles por $6.500, express de 24 a 48 horas por $12.500 y retiro sin costo. El envio estandar es gratis desde $180.000 luego de descuentos.",
      products: [], suggestions: ["Ver productos destacados", "Que medios de pago aceptan?", "Hablar por WhatsApp"],
    };
  }
  if (/pago|tarjeta|transferencia|mercado pago|stripe|efectivo/.test(message)) {
    return {
      message: "Podes pagar con Mercado Pago, Stripe internacional, tarjeta de credito o debito, transferencia bancaria y efectivo al retirar. La disponibilidad final se confirma en el checkout.",
      products: [], suggestions: ["Como son los envios?", "Ver productos con oferta", "Hablar por WhatsApp"],
    };
  }
  if (/cambio|devolucion|devolver|garantia/.test(message)) {
    return {
      message: "Para cambios, devoluciones o garantias necesitamos revisar tu compra. Podes continuar por WhatsApp y el equipo te ayuda personalmente.",
      products: [], suggestions: ["Hablar por WhatsApp", "Donde veo mis pedidos?"],
    };
  }
  if (/pedido|orden|seguimiento|estado de compra/.test(message)) {
    return {
      message: "Inicia sesion y entra en Mi cuenta > Mis pedidos para ver el estado, detalle e historial de tus compras.",
      products: [], suggestions: ["Ir a mis pedidos", "Hablar por WhatsApp"],
    };
  }
  if (/cupon|codigo|descuento/.test(message) && !/oferta/.test(message)) {
    return {
      message: "Los cupones vigentes se ingresan durante el checkout. El sistema valida automaticamente fechas, monto minimo y limite de uso.",
      products: [], suggestions: ["Ver productos con oferta", "Como son los envios?"],
    };
  }
  if (/contacto|whatsapp|persona|asesor/.test(message)) {
    return {
      message: "Podes continuar por WhatsApp desde el boton que aparece debajo de esta conversacion.",
      products: [], suggestions: ["Hablar por WhatsApp", "Buscar productos"],
    };
  }
  return null;
}

async function catalogReply(rawMessage: string): Promise<AssistantReply> {
  const message = normalize(rawMessage);
  const [categories, brands, variants] = await Promise.all([
    prisma.category.findMany({ where: { isActive: true }, select: { name: true, slug: true } }),
    prisma.brand.findMany({ where: { isActive: true }, select: { name: true, slug: true } }),
    prisma.productVariant.findMany({ where: { isActive: true, product: { isActive: true } }, select: { color: true, size: true }, distinct: ["color", "size"] }),
  ]);

  const category = categories.find((item) => includesTerm(message, item.name) || includesTerm(message, item.slug));
  const brand = brands.find((item) => includesTerm(message, item.name) || includesTerm(message, item.slug));
  const colors = [...new Set(variants.map((item) => item.color).filter((value): value is string => Boolean(value)))];
  const sizes = [...new Set(variants.map((item) => item.size).filter((value): value is string => Boolean(value)))];
  const color = colors.find((value) => includesTerm(message, value));
  const size = sizes.find((value) => includesTerm(message, value));
  const range = priceRange(message);
  const wantsOffer = /oferta|rebaja|descuento/.test(message);
  const wantsStock = /stock|disponible|disponibilidad|tienen/.test(message);
  const removed = [category?.name, category?.slug, brand?.name, brand?.slug, color, size].filter(Boolean).map((value) => normalize(value as string));
  const terms = message.replace(/[$.,]/g, " ").split(/\s+/)
    .filter((term) => term.length > 1 && !stopWords.has(term) && !removed.includes(term) && !/^\d+$/.test(term)).slice(0, 5);

  const priceFilters: Prisma.ProductWhereInput[] = [];
  if (range.min !== undefined) priceFilters.push({ OR: [{ salePrice: { gte: range.min } }, { salePrice: null, basePrice: { gte: range.min } }] });
  if (range.max !== undefined) priceFilters.push({ OR: [{ salePrice: { lte: range.max } }, { salePrice: null, basePrice: { lte: range.max } }] });
  const where: Prisma.ProductWhereInput = {
    isActive: true,
    ...(category ? { categories: { some: { category: { slug: category.slug } } } } : {}),
    ...(brand ? { brand: { slug: brand.slug } } : {}),
    ...(wantsOffer ? { salePrice: { not: null } } : {}),
    ...(color || size || wantsStock ? { variants: { some: { isActive: true, ...(color ? { color: { equals: color, mode: "insensitive" } } : {}), ...(size ? { size: { equals: size, mode: "insensitive" } } : {}), ...(wantsStock ? { stock: { quantity: { gt: 0 } } } : {}) } } } : {}),
    ...(terms.length ? { OR: terms.flatMap((term) => [
      { name: { contains: term, mode: "insensitive" as const } },
      { description: { contains: term, mode: "insensitive" as const } },
      { brand: { name: { contains: term, mode: "insensitive" as const } } },
    ]) } : {}),
    ...(priceFilters.length ? { AND: priceFilters } : {}),
  };

  const found = await prisma.product.findMany({
    where, take: 24, orderBy: wantsOffer ? { salePrice: "asc" } : { createdAt: "desc" },
    include: { brand: { select: { name: true } }, images: { orderBy: { position: "asc" }, take: 1, select: { url: true } }, variants: { where: { isActive: true }, include: { stock: true } } },
  });
  const ranked = found.map((product) => {
    const matchingVariants = product.variants.filter((variant) => (!color || normalize(variant.color ?? "") === normalize(color)) && (!size || normalize(variant.size ?? "") === normalize(size)));
    const available = matchingVariants.reduce((total, variant) => total + Math.max(0, (variant.stock?.quantity ?? 0) - (variant.stock?.reservedQuantity ?? 0)), 0);
    const searchable = normalize(`${product.name} ${product.description ?? ""} ${product.brand?.name ?? ""}`);
    const score = terms.reduce((total, term) => total + (normalize(product.name).includes(term) ? 5 : searchable.includes(term) ? 1 : 0), 0);
    return { product, matchingVariants, available, score };
  }).filter((item) => !wantsStock || item.available > 0).sort((a, b) => b.score - a.score || b.available - a.available).slice(0, 4);

  if (!ranked.length) return {
    message: "No encontre productos que coincidan con todo eso. Proba quitando algun filtro o decime que presupuesto y tipo de producto preferis.",
    products: [], suggestions: ["Ver productos destacados", "Buscar por menos de $80.000", "Hablar por WhatsApp"],
  };
  const products = ranked.map(({ product, matchingVariants, available }) => ({
    id: product.id, name: product.name, slug: product.slug, brand: product.brand?.name ?? "ErcLav",
    price: Number(product.salePrice ?? product.basePrice), originalPrice: product.salePrice ? Number(product.basePrice) : null,
    image: product.images[0] ? productImageUrl(product.images[0].url) : null, available,
    colors: [...new Set(matchingVariants.map((variant) => variant.color).filter((value): value is string => Boolean(value)))],
    sizes: [...new Set(matchingVariants.map((variant) => variant.size).filter((value): value is string => Boolean(value)))],
  }));
  return {
    message: products.length === 1 ? "Encontre esta opcion para vos." : `Encontre ${products.length} opciones que coinciden con tu busqueda.`,
    products, suggestions: ["Mostrar productos con oferta", "Como son los envios?", "Hablar por WhatsApp"],
  };
}

export const deterministicAssistant: ShoppingAssistantProvider = {
  async respond({ message }) {
    const normalized = normalize(message.trim());
    return faqReply(normalized) ?? catalogReply(message);
  },
};
