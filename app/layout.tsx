import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.AUTH_URL ?? "http://localhost:3000"),
  title: {
    default: "ErcLav | Ecommerce premium",
    template: "%s | ErcLav",
  },
  description: "Ecommerce premium con catalogo moderno, productos destacados, wishlist y compra segura.",
  applicationName: "ErcLav",
  category: "ecommerce",
  keywords: ["ecommerce", "compras online", "productos", "Argentina", "ErcLav"],
  creator: "ErcLav",
  publisher: "ErcLav",
  icons: { icon: "/icon.svg", shortcut: "/icon.svg", apple: "/icon.svg" },
  formatDetection: { telephone: false, email: false, address: false },
  openGraph: {
    title: "ErcLav | Ecommerce premium",
    description: "Compra productos seleccionados con una experiencia rapida, moderna y responsive.",
    siteName: "ErcLav",
    locale: "es_AR",
    type: "website",
  },
  twitter: { card: "summary_large_image", title: "ErcLav | Ecommerce premium", description: "Compra productos seleccionados con una experiencia rapida y segura." },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-AR">
      <body>{children}</body>
    </html>
  );
}
