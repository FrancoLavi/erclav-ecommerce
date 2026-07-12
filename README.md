# ErcLav Ecommerce

Ecommerce full stack construido como proyecto de portfolio. Incluye catálogo público, panel administrativo, autenticación, checkout, pagos, emails transaccionales y gestión completa de pedidos y clientes.

## Demo

[Ver demo en producción](https://erclav-ecommerce.vercel.app)

Cuenta de cliente para pruebas:

- Email: `cliente@erclav.local`
- Contraseña: `Cliente123`

El acceso administrativo no se publica en el repositorio.

## Funcionalidades

- Catálogo responsive con búsqueda, filtros, ordenamiento y paginación.
- Productos, categorías, marcas, variantes, stock e imágenes.
- Carrito, favoritos, reviews y productos relacionados.
- Checkout con dirección, envíos, impuestos y cupones.
- Mercado Pago Checkout Pro y Stripe Payment Intents.
- Webhooks firmados y actualización automática de órdenes.
- Auth.js con registro, login, verificación y recuperación de contraseña.
- Roles `ADMIN` y `CLIENT` con protección de rutas.
- Panel administrativo para productos, stock, órdenes, usuarios y cupones.
- Panel del cliente con perfil, pedidos, direcciones, pagos y recompra.
- Emails transaccionales con Resend y React Email.
- SEO técnico, Open Graph, JSON-LD, sitemap y robots.
- Rate limiting, CSP, headers de seguridad y validación con Zod.

## Calidad

Medición Lighthouse sobre el build de producción local:

| Categoría | Puntuación |
| --- | ---: |
| Rendimiento | 98 |
| Accesibilidad | 100 |
| Buenas prácticas | 100 |
| SEO | 100 |

## Stack

- Next.js 15, React 19 y App Router.
- TypeScript y Tailwind CSS.
- PostgreSQL, Prisma ORM y migraciones versionadas.
- Auth.js y bcrypt.
- Stripe, Mercado Pago, Resend y React Email.
- React Hook Form y Zod.

## Arquitectura

- `app/`: rutas, layouts, metadata, webhooks y Server Components.
- `actions/`: Server Actions para autenticación, tienda, checkout y administración.
- `components/`: UI pública, checkout, cuenta y panel administrativo.
- `lib/`: Prisma, caché, rate limiting, pagos, filtros y utilidades.
- `emails/`: plantillas transaccionales.
- `prisma/`: schema, migraciones y seeds.

Los datos públicos utilizan caché etiquetada e ISR. Las mutaciones administrativas invalidan las etiquetas correspondientes. Las consultas del catálogo están paginadas, seleccionan sólo los campos necesarios y cuentan con índices PostgreSQL para búsqueda y ordenamiento.

## Desarrollo local

Requisitos: Node.js 22 y PostgreSQL 16 o superior.

```bash
npm install
cp .env.example .env
npx prisma migrate deploy
npm run seed:demo
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`.

## Variables de entorno

Consulta [.env.example](.env.example). Nunca publiques el archivo `.env` real.

Variables principales:

- `DATABASE_URL`
- `AUTH_SECRET`
- `AUTH_URL`
- `STRIPE_SECRET_KEY` y `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `MP_ACCESS_TOKEN` y `MP_WEBHOOK_SECRET`
- `RESEND_API_KEY`, `EMAIL_FROM` y `EMAIL_REPLY_TO`

## Verificación

```bash
npm run typecheck
npm run lint
npm run build
```

## Despliegue

1. Crear una base PostgreSQL administrada, por ejemplo Neon o Supabase.
2. Configurar las variables de `.env.example` en Vercel.
3. Aplicar las migraciones con `npx prisma migrate deploy` usando la URL de producción.
4. Importar el repositorio desde Vercel.
5. Configurar los webhooks de Stripe y Mercado Pago con el dominio definitivo.

> Los uploads hechos directamente al filesystem local no son persistentes en entornos serverless. Para producción, las nuevas imágenes del administrador deben conectarse a un storage externo como Vercel Blob o Cloudinary. Los productos demo usan imágenes remotas optimizadas por Next.js.
