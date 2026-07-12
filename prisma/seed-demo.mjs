import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const image = (id) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1200&q=85`;

const categories = [
  { name: "Calzado", slug: "calzado", description: "Zapatillas, sneakers y calzado urbano premium." },
  { name: "Indumentaria", slug: "indumentaria", description: "Prendas versatiles para uso diario y entrenamiento." },
  { name: "Accesorios", slug: "accesorios", description: "Detalles funcionales para completar cualquier look." },
  { name: "Tecnologia", slug: "tecnologia", description: "Dispositivos y accesorios inteligentes." },
  { name: "Hogar", slug: "hogar", description: "Objetos modernos para espacios cuidados." },
  { name: "Destacados", slug: "destacados", description: "Seleccion editorial con los productos mas atractivos." },
  { name: "Nuevos", slug: "nuevos", description: "Ultimos ingresos al catalogo." },
];

const brands = [
  { name: "Nike", slug: "nike", description: "Performance y estilo deportivo." },
  { name: "Apple", slug: "apple", description: "Tecnologia premium para todos los dias." },
  { name: "Adidas", slug: "adidas", description: "Clasicos urbanos y deportivos." },
  { name: "Puma", slug: "puma", description: "Diseño deportivo con energia urbana." },
  { name: "Sony", slug: "sony", description: "Audio y tecnologia confiable." },
  { name: "ErcLav Studio", slug: "erclav-studio", description: "Linea propia curada por ErcLav." },
];

const products = [
  {
    name: "Nike Air Urban Pulse",
    slug: "nike-air-urban-pulse",
    brand: "nike",
    categories: ["calzado", "destacados", "nuevos"],
    description: "Sneaker urbano con silueta limpia, amortiguacion suave y presencia premium.",
    basePrice: 189000,
    salePrice: 169000,
    sku: "NK-AUP",
    images: [image("1542291026-7eec264c27ff"), image("1549298916-b41d501d3772")],
    variants: [
      { color: "Negro", size: "40", stock: 12 },
      { color: "Negro", size: "41", stock: 8 },
      { color: "Blanco", size: "42", stock: 10 },
    ],
  },
  {
    name: "Adidas Court Minimal",
    slug: "adidas-court-minimal",
    brand: "adidas",
    categories: ["calzado", "destacados"],
    description: "Zapatilla blanca minimalista para looks casuales y oficina flexible.",
    basePrice: 142000,
    salePrice: null,
    sku: "AD-COURT",
    images: [image("1525966222134-fcfa99b8ae77"), image("1608231387042-66d1773070a5")],
    variants: [
      { color: "Blanco", size: "39", stock: 7 },
      { color: "Blanco", size: "40", stock: 11 },
      { color: "Gris", size: "41", stock: 5 },
    ],
  },
  {
    name: "Puma Runner Flex",
    slug: "puma-runner-flex",
    brand: "puma",
    categories: ["calzado", "nuevos"],
    description: "Ligera, comoda y lista para moverse entre entrenamiento y ciudad.",
    basePrice: 132000,
    salePrice: 119000,
    sku: "PM-RF",
    images: [image("1460353581641-37baddab0fa2"), image("1491553895911-0055eca6402d")],
    variants: [
      { color: "Azul", size: "40", stock: 6 },
      { color: "Azul", size: "42", stock: 9 },
      { color: "Negro", size: "43", stock: 3 },
    ],
  },
  {
    name: "Campera Tech Shell",
    slug: "campera-tech-shell",
    brand: "erclav-studio",
    categories: ["indumentaria", "destacados"],
    description: "Campera liviana repelente al agua con corte moderno y bolsillos ocultos.",
    basePrice: 98000,
    salePrice: null,
    sku: "ER-TSHELL",
    images: [image("1523398002811-999ca8dec234"), image("1515886657613-9f3515b0c78f")],
    variants: [
      { color: "Negro", size: "S", stock: 4 },
      { color: "Negro", size: "M", stock: 10 },
      { color: "Verde", size: "L", stock: 5 },
    ],
  },
  {
    name: "Hoodie Premium Core",
    slug: "hoodie-premium-core",
    brand: "erclav-studio",
    categories: ["indumentaria", "nuevos"],
    description: "Buzo pesado de algodon con calce relajado y terminaciones suaves.",
    basePrice: 76000,
    salePrice: 69000,
    sku: "ER-HOOD",
    images: [image("1556821840-3a63f95609a7"), image("1516762689617-e1cffcef479d")],
    variants: [
      { color: "Gris", size: "S", stock: 6 },
      { color: "Gris", size: "M", stock: 12 },
      { color: "Negro", size: "L", stock: 8 },
    ],
  },
  {
    name: "Remera Essential Pack",
    slug: "remera-essential-pack",
    brand: "erclav-studio",
    categories: ["indumentaria"],
    description: "Pack de dos remeras basicas premium con cuello resistente.",
    basePrice: 42000,
    salePrice: null,
    sku: "ER-TEE2",
    images: [image("1521572163474-6864f9cf17ab"), image("1503342217505-b0a15ec3261c")],
    variants: [
      { color: "Blanco", size: "S", stock: 18 },
      { color: "Blanco", size: "M", stock: 16 },
      { color: "Negro", size: "L", stock: 13 },
    ],
  },
  {
    name: "Apple Watch Sport Loop",
    slug: "apple-watch-sport-loop",
    brand: "apple",
    categories: ["tecnologia", "accesorios", "destacados"],
    description: "Reloj inteligente con correa deportiva, metricas de salud y pantalla brillante.",
    basePrice: 449000,
    salePrice: 419000,
    sku: "AP-WATCH-SL",
    images: [image("1434493789847-2f02dc6ca35d"), image("1516574187841-cb9cc2ca948b")],
    variants: [
      { color: "Negro", size: "41mm", stock: 5 },
      { color: "Azul", size: "45mm", stock: 4 },
      { color: "Blanco", size: "45mm", stock: 6 },
    ],
  },
  {
    name: "AirPods Noise Control",
    slug: "airpods-noise-control",
    brand: "apple",
    categories: ["tecnologia", "accesorios", "nuevos"],
    description: "Auriculares compactos con cancelacion de ruido y audio espacial.",
    basePrice: 329000,
    salePrice: null,
    sku: "AP-AIR-NC",
    images: [image("1606220945770-b5b6c2c55bf1"), image("1588423771073-b8903fbb85b5")],
    variants: [
      { color: "Blanco", size: "Unico", stock: 14 },
      { color: "Negro", size: "Unico", stock: 2 },
    ],
  },
  {
    name: "Sony WH Studio",
    slug: "sony-wh-studio",
    brand: "sony",
    categories: ["tecnologia", "destacados"],
    description: "Auriculares over-ear con sonido profundo, autonomia extendida y diseño sobrio.",
    basePrice: 289000,
    salePrice: 259000,
    sku: "SN-WH-ST",
    images: [image("1505740420928-5e560c06d30e"), image("1484704849700-f032a568e944")],
    variants: [
      { color: "Negro", size: "Unico", stock: 9 },
      { color: "Beige", size: "Unico", stock: 7 },
    ],
  },
  {
    name: "Mochila Commuter Pro",
    slug: "mochila-commuter-pro",
    brand: "erclav-studio",
    categories: ["accesorios", "destacados"],
    description: "Mochila urbana impermeable con compartimento para notebook y organizadores.",
    basePrice: 88000,
    salePrice: 79000,
    sku: "ER-BACK-PRO",
    images: [image("1553062407-98eeb64c6a62"), image("1500530855697-b586d89ba3ee")],
    variants: [
      { color: "Negro", size: "20L", stock: 11 },
      { color: "Verde", size: "20L", stock: 6 },
    ],
  },
  {
    name: "Gorra Logo Low",
    slug: "gorra-logo-low",
    brand: "nike",
    categories: ["accesorios"],
    description: "Gorra de perfil bajo con ajuste metalico y logo bordado.",
    basePrice: 36000,
    salePrice: null,
    sku: "NK-CAP-LOW",
    images: [image("1521369909029-2afed882baee"), image("1514327605112-b887c0e61c0a")],
    variants: [
      { color: "Negro", size: "Unico", stock: 20 },
      { color: "Blanco", size: "Unico", stock: 15 },
    ],
  },
  {
    name: "Botella Steel 750",
    slug: "botella-steel-750",
    brand: "erclav-studio",
    categories: ["accesorios", "hogar"],
    description: "Botella termica de acero inoxidable, minimalista y resistente.",
    basePrice: 31000,
    salePrice: 27900,
    sku: "ER-BOTTLE",
    images: [image("1602143407151-7111542de6e8"), image("1523362628745-0c100150b504")],
    variants: [
      { color: "Negro", size: "750ml", stock: 13 },
      { color: "Blanco", size: "750ml", stock: 10 },
      { color: "Azul", size: "750ml", stock: 8 },
    ],
  },
  {
    name: "Lampara Desk Glow",
    slug: "lampara-desk-glow",
    brand: "erclav-studio",
    categories: ["hogar", "nuevos"],
    description: "Lampara de escritorio con intensidad regulable y terminacion mate.",
    basePrice: 65000,
    salePrice: null,
    sku: "ER-DESK-GLOW",
    images: [image("1507473885765-e6ed057f782c"), image("1494438639946-1ebd1d20bf85")],
    variants: [
      { color: "Negro", size: "Unico", stock: 5 },
      { color: "Blanco", size: "Unico", stock: 7 },
    ],
  },
  {
    name: "Organizador Modular",
    slug: "organizador-modular",
    brand: "erclav-studio",
    categories: ["hogar"],
    description: "Set modular para escritorio, baño o cocina con piezas combinables.",
    basePrice: 54000,
    salePrice: 49000,
    sku: "ER-MOD-ORG",
    images: [image("1497366754035-f200968a6e72"), image("1519710164239-da123dc03ef4")],
    variants: [
      { color: "Gris", size: "Set", stock: 9 },
      { color: "Beige", size: "Set", stock: 4 },
    ],
  },
  {
    name: "Teclado Compact Pro",
    slug: "teclado-compact-pro",
    brand: "sony",
    categories: ["tecnologia"],
    description: "Teclado compacto inalambrico con teclas silenciosas y bateria extendida.",
    basePrice: 112000,
    salePrice: null,
    sku: "SN-KEY-PRO",
    images: [image("1587829741301-dc798b83add3"), image("1516321318423-f06f85e504b3")],
    variants: [
      { color: "Negro", size: "ES", stock: 6 },
      { color: "Blanco", size: "ES", stock: 4 },
    ],
  },
  {
    name: "Mouse Precision Air",
    slug: "mouse-precision-air",
    brand: "apple",
    categories: ["tecnologia", "accesorios"],
    description: "Mouse liviano con desplazamiento suave y bateria recargable.",
    basePrice: 98000,
    salePrice: 89900,
    sku: "AP-MOUSE-AIR",
    images: [image("1527814050087-3793815479db"), image("1615663245857-ac93bb7c39e7")],
    variants: [
      { color: "Blanco", size: "Unico", stock: 12 },
      { color: "Negro", size: "Unico", stock: 8 },
    ],
  },
  {
    name: "Short Training Flow",
    slug: "short-training-flow",
    brand: "adidas",
    categories: ["indumentaria"],
    description: "Short tecnico de secado rapido con bolsillos laterales.",
    basePrice: 52000,
    salePrice: 45900,
    sku: "AD-SHORT-F",
    images: [image("1517836357463-d25dfeac3438"), image("1515886657613-9f3515b0c78f")],
    variants: [
      { color: "Negro", size: "S", stock: 10 },
      { color: "Negro", size: "M", stock: 14 },
      { color: "Azul", size: "L", stock: 6 },
    ],
  },
  {
    name: "Pantalon Cargo Soft",
    slug: "pantalon-cargo-soft",
    brand: "puma",
    categories: ["indumentaria", "destacados"],
    description: "Cargo suave con corte recto, bolsillos utilitarios y cintura elastica.",
    basePrice: 87000,
    salePrice: null,
    sku: "PM-CARGO-S",
    images: [image("1473966968600-fa801b869a1a"), image("1503342394128-c104d54dba01")],
    variants: [
      { color: "Verde", size: "S", stock: 5 },
      { color: "Verde", size: "M", stock: 8 },
      { color: "Negro", size: "L", stock: 3 },
    ],
  },
  {
    name: "Bolso Weekend Carry",
    slug: "bolso-weekend-carry",
    brand: "erclav-studio",
    categories: ["accesorios", "nuevos"],
    description: "Bolso de viaje compacto con lona resistente y manijas reforzadas.",
    basePrice: 99000,
    salePrice: 89000,
    sku: "ER-WEEKEND",
    images: [image("1514477917009-389c76a86b68"), image("1553062407-98eeb64c6a62")],
    variants: [
      { color: "Negro", size: "35L", stock: 7 },
      { color: "Beige", size: "35L", stock: 5 },
    ],
  },
  {
    name: "Alfombra Texture Calm",
    slug: "alfombra-texture-calm",
    brand: "erclav-studio",
    categories: ["hogar", "destacados"],
    description: "Alfombra de textura suave para living o dormitorio con tonos neutros.",
    basePrice: 118000,
    salePrice: null,
    sku: "ER-RUG-CALM",
    images: [image("1513161455079-7dc1de15ef3e"), image("1505693416388-ac5ce068fe85")],
    variants: [
      { color: "Beige", size: "160x230", stock: 4 },
      { color: "Gris", size: "200x300", stock: 2 },
    ],
  },
];

const reviewers = [
  { email: "cliente1@erclav.local", firstName: "Sofia", lastName: "Martinez" },
  { email: "cliente2@erclav.local", firstName: "Lucas", lastName: "Pereyra" },
  { email: "cliente3@erclav.local", firstName: "Valentina", lastName: "Rojas" },
  { email: "cliente4@erclav.local", firstName: "Mateo", lastName: "Sosa" },
];

async function ensureRoles() {
  const clientRole = await prisma.role.upsert({
    where: { name: "CLIENT" },
    update: {},
    create: { name: "CLIENT", description: "Cliente de la tienda" },
  });

  return { clientRole };
}

async function seedUsers() {
  const { clientRole } = await ensureRoles();
  const passwordHash = await bcrypt.hash("Cliente123", 12);

  return Promise.all(
    reviewers.map(async (reviewer) => {
      const user = await prisma.user.upsert({
        where: { email: reviewer.email },
        update: {},
        create: {
          email: reviewer.email,
          passwordHash,
          firstName: reviewer.firstName,
          lastName: reviewer.lastName,
          name: `${reviewer.firstName} ${reviewer.lastName}`,
          emailVerified: new Date(),
          roles: {
            create: { roleId: clientRole.id },
          },
        },
      });

      await prisma.userRole.upsert({
        where: {
          userId_roleId: {
            userId: user.id,
            roleId: clientRole.id,
          },
        },
        update: {},
        create: {
          userId: user.id,
          roleId: clientRole.id,
        },
      });

      return user;
    }),
  );
}

async function seedTaxonomy() {
  const categoryMap = new Map();
  const brandMap = new Map();

  for (const category of categories) {
    const saved = await prisma.category.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        description: category.description,
        isActive: true,
      },
      create: {
        ...category,
        isActive: true,
      },
    });
    categoryMap.set(category.slug, saved);
  }

  for (const brand of brands) {
    const saved = await prisma.brand.upsert({
      where: { slug: brand.slug },
      update: {
        name: brand.name,
        description: brand.description,
        isActive: true,
      },
      create: {
        ...brand,
        isActive: true,
      },
    });
    brandMap.set(brand.slug, saved);
  }

  return { categoryMap, brandMap };
}

async function seedProducts(categoryMap, brandMap) {
  const savedProducts = [];

  for (const product of products) {
    const brand = brandMap.get(product.brand);

    const savedProduct = await prisma.product.upsert({
      where: { slug: product.slug },
      update: {
        name: product.name,
        description: product.description,
        sku: product.sku,
        basePrice: product.basePrice,
        salePrice: product.salePrice,
        brandId: brand?.id,
        isActive: true,
      },
      create: {
        name: product.name,
        slug: product.slug,
        description: product.description,
        sku: product.sku,
        basePrice: product.basePrice,
        salePrice: product.salePrice,
        brandId: brand?.id,
        isActive: true,
      },
    });

    await prisma.productCategory.deleteMany({ where: { productId: savedProduct.id } });
    await prisma.productCategory.createMany({
      data: product.categories.map((slug) => ({
        productId: savedProduct.id,
        categoryId: categoryMap.get(slug).id,
      })),
      skipDuplicates: true,
    });

    await prisma.productImage.deleteMany({ where: { productId: savedProduct.id } });
    await prisma.productImage.createMany({
      data: product.images.map((url, index) => ({
        productId: savedProduct.id,
        url,
        altText: product.name,
        position: index,
        isPrimary: index === 0,
      })),
    });

    for (const variant of product.variants) {
      const savedVariant = await prisma.productVariant.upsert({
        where: {
          productId_color_size: {
            productId: savedProduct.id,
            color: variant.color,
            size: variant.size,
          },
        },
        update: {
          sku: `${product.sku}-${variant.color}-${variant.size}`.replace(/\s+/g, "-").toUpperCase(),
          isActive: true,
        },
        create: {
          productId: savedProduct.id,
          sku: `${product.sku}-${variant.color}-${variant.size}`.replace(/\s+/g, "-").toUpperCase(),
          color: variant.color,
          size: variant.size,
          isActive: true,
        },
      });

      await prisma.stock.upsert({
        where: { variantId: savedVariant.id },
        update: {
          quantity: variant.stock,
          reservedQuantity: 0,
          lowStockAlert: 3,
        },
        create: {
          variantId: savedVariant.id,
          quantity: variant.stock,
          reservedQuantity: 0,
          lowStockAlert: 3,
        },
      });
    }

    savedProducts.push(savedProduct);
  }

  return savedProducts;
}

async function seedReviews(savedProducts, users) {
  for (const [index, product] of savedProducts.entries()) {
    const selectedUsers = users.slice(0, 3);

    for (const [reviewIndex, user] of selectedUsers.entries()) {
      await prisma.review.upsert({
        where: {
          userId_productId: {
            userId: user.id,
            productId: product.id,
          },
        },
        update: {
          rating: 4 + ((index + reviewIndex) % 2),
          title: "Muy buena compra",
          comment: "Producto con excelente terminacion, buena presentacion y entrega correcta.",
          isVisible: true,
        },
        create: {
          userId: user.id,
          productId: product.id,
          rating: 4 + ((index + reviewIndex) % 2),
          title: "Muy buena compra",
          comment: "Producto con excelente terminacion, buena presentacion y entrega correcta.",
          isVisible: true,
        },
      });
    }
  }
}

async function seedOrders(savedProducts, users) {
  const firstVariants = await prisma.productVariant.findMany({
    where: { productId: { in: savedProducts.slice(0, 8).map((product) => product.id) } },
    include: { product: true },
    take: 12,
  });

  for (const [index, variant] of firstVariants.entries()) {
    const user = users[index % users.length];
    const quantity = (index % 3) + 1;
    const unitPrice = variant.product.salePrice ?? variant.product.basePrice;
    const total = Number(unitPrice) * quantity;

    await prisma.order.upsert({
      where: { orderNumber: `DEMO-${String(index + 1).padStart(4, "0")}` },
      update: {},
      create: {
        orderNumber: `DEMO-${String(index + 1).padStart(4, "0")}`,
        userId: user.id,
        status: index % 2 === 0 ? "DELIVERED" : "PAID",
        paymentStatus: "PAID",
        subtotal: total,
        total,
        shippingAddressSnapshot: {
          name: user.name,
          city: "Buenos Aires",
          street: "Demo 123",
        },
        items: {
          create: {
            variantId: variant.id,
            productName: variant.product.name,
            variantSku: variant.sku,
            color: variant.color,
            size: variant.size,
            quantity,
            unitPrice,
            total,
          },
        },
      },
    });
  }
}

async function seedCoupons() {
  const coupons = [
    {
      code: "BIENVENIDA15",
      description: "15% off para nuevos clientes",
      discountType: "PERCENTAGE",
      discountValue: 15,
      minimumSubtotal: 50000,
      maxDiscount: 25000,
      usageLimit: 100,
      perUserLimit: 1,
    },
    {
      code: "PREMIUM20K",
      description: "Descuento fijo en compras premium",
      discountType: "FIXED_AMOUNT",
      discountValue: 20000,
      minimumSubtotal: 180000,
      maxDiscount: null,
      usageLimit: 50,
      perUserLimit: 1,
    },
  ];

  for (const coupon of coupons) {
    await prisma.coupon.upsert({
      where: { code: coupon.code },
      update: { ...coupon, isActive: true },
      create: { ...coupon, isActive: true },
    });
  }
}

async function main() {
  const users = await seedUsers();
  const { categoryMap, brandMap } = await seedTaxonomy();
  const savedProducts = await seedProducts(categoryMap, brandMap);
  await seedReviews(savedProducts, users);
  await seedOrders(savedProducts, users);
  await seedCoupons();

  console.log(`Seed demo listo: ${savedProducts.length} productos, ${categories.length} categorias, ${brands.length} marcas.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
