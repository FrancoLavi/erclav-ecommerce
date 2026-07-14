import type { Prisma } from "@prisma/client";

import { orderStatusLabel, paymentStatusLabel } from "@/lib/account";
import { prisma } from "@/lib/prisma";
import { productImageUrl } from "@/lib/product-image";
import type {
  AssistantConversationContext,
  AssistantReply,
  ShoppingAssistantProvider,
} from "@/lib/assistant/types";

const stopWords = new Set([
  "algo", "busco", "comprar", "con", "de", "del", "el", "en", "la", "las", "lo", "los", "me",
  "disponibilidad", "disponible", "desde", "hasta", "mas", "menos", "mostrar", "para", "por", "producto",
  "productos", "que", "quiero", "recomenda", "recomendas", "sin", "solo", "stock", "tenes", "tienen", "un",
  "una", "unos", "unas", "ver",
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
  const maxMatches = [...message.matchAll(new RegExp(`(?:hasta|menos de|maximo|tope|por debajo de)\\s*\\$?\\s*${amount}`, "g"))];
  const minMatches = [...message.matchAll(new RegExp(`(?:desde|mas de|minimo|por encima de)\\s*\\$?\\s*${amount}`, "g"))];
  const max = maxMatches.at(-1);
  const min = minMatches.at(-1);
  return {
    max: max ? parseAmount(max[1], max[2]) : undefined,
    min: min ? parseAmount(min[1], min[2]) : undefined,
  };
}

function shouldRefineSearch(message: string, context?: AssistantConversationContext) {
  if (!context?.lastSearch) return false;
  return /^(y|con|sin|por|hasta|menos|mas|desde|solo|en|talle|color|pero|que tenga)\b/.test(
    normalize(message.trim()),
  );
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

async function orderReply(message: string, userId?: string): Promise<AssistantReply | null> {
  if (!/pedido|orden|seguimiento|estado de compra|mis compras/.test(message)) return null;

  if (!userId) {
    return {
      message: "Para consultar tus pedidos necesitas iniciar sesion. La cuenta protege el estado y los datos de cada compra.",
      products: [],
      suggestions: ["Iniciar sesion", "Ir a mis pedidos", "Hablar por WhatsApp"],
    };
  }

  const requestedNumber = message.toUpperCase().match(/\bER-\d{8}-[A-Z0-9]{6}\b/)?.[0];
  const orders = await prisma.order.findMany({
    where: {
      userId,
      ...(requestedNumber ? { orderNumber: requestedNumber } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: requestedNumber ? 1 : 3,
    select: {
      orderNumber: true,
      status: true,
      paymentStatus: true,
      total: true,
      currency: true,
      createdAt: true,
    },
  });

  if (!orders.length) {
    return {
      message: requestedNumber
        ? "No encontre ese pedido dentro de tu cuenta. Revisa el numero o entra en Mis pedidos."
        : "Todavia no tenes pedidos asociados a esta cuenta.",
      products: [],
      suggestions: ["Ir a mis pedidos", "Buscar productos", "Hablar por WhatsApp"],
    };
  }

  return {
    message: requestedNumber
      ? "Este es el estado actual de tu pedido."
      : orders.length === 1
        ? "Encontre tu pedido mas reciente."
        : "Estos son tus ultimos pedidos.",
    products: [],
    orders: orders.map((order) => ({
      orderNumber: order.orderNumber,
      status: order.status,
      statusLabel: orderStatusLabel[order.status],
      paymentStatusLabel: paymentStatusLabel[order.paymentStatus],
      total: Number(order.total),
      currency: order.currency,
      createdAt: order.createdAt.toISOString(),
    })),
    suggestions: ["Ir a mis pedidos", "Buscar productos", "Hablar por WhatsApp"],
  };
}

async function catalogReply(
  rawMessage: string,
  context?: AssistantConversationContext,
): Promise<AssistantReply> {
  const effectiveMessage = shouldRefineSearch(rawMessage, context)
    ? `${context?.lastSearch} ${rawMessage}`.slice(0, 500) : rawMessage;
  const message = normalize(effectiveMessage);
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
    message: "No encontre productos que coincidan con todo eso. Proba quitando algun filtro o inicia una nueva busqueda.",
    products: [],
    suggestions: ["Nueva busqueda", "Buscar por menos de $80.000", "Hablar por WhatsApp"],
    context: { lastSearch: effectiveMessage },
  };
  const products = ranked.map(({ product, matchingVariants, available }) => ({
    id: product.id, name: product.name, slug: product.slug, brand: product.brand?.name ?? "ErcLav",
    price: Number(product.salePrice ?? product.basePrice), originalPrice: product.salePrice ? Number(product.basePrice) : null,
    image: product.images[0] ? productImageUrl(product.images[0].url) : null, available,
    colors: [...new Set(matchingVariants.map((variant) => variant.color).filter((value): value is string => Boolean(value)))],
    sizes: [...new Set(matchingVariants.map((variant) => variant.size).filter((value): value is string => Boolean(value)))],
    variants: matchingVariants.map((variant) => ({
      id: variant.id,
      color: variant.color,
      size: variant.size,
      price: Number(variant.price ?? product.salePrice ?? product.basePrice),
      available: Math.max(
        0,
        (variant.stock?.quantity ?? 0) - (variant.stock?.reservedQuantity ?? 0),
      ),
    })).sort((a, b) => b.available - a.available),
  }));
  return {
    message: products.length === 1 ? "Encontre esta opcion para vos." : `Encontre ${products.length} opciones que coinciden con tu busqueda.`,
    products,
    suggestions: ["Solo con stock", "Por menos de $100.000", "Nueva busqueda"],
    context: { lastSearch: effectiveMessage },
  };
}

export const deterministicAssistant: ShoppingAssistantProvider = {
  async respond({ message, context, userId }) {
    const normalized = normalize(message.trim());
    if (/^(reiniciar|nueva busqueda|empezar de nuevo|limpiar busqueda)$/.test(normalized)) {
      return {
        message: "Listo. Empecemos una nueva busqueda. Que tipo de producto necesitas?",
        products: [],
        suggestions: ["Ver productos destacados", "Buscar por menos de $80.000", "Ver productos con oferta"],
        context: {},
      };
    }
    return (await orderReply(normalized, userId)) ?? faqReply(normalized) ?? catalogReply(message, context);
  },
};
