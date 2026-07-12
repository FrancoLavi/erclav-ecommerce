import { NextResponse } from "next/server";
import NextAuth from "next-auth";

const { auth: edgeAuth } = NextAuth({
  providers: [],
  session: { strategy: "jwt" },
  trustHost: true,
  callbacks: {
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.roles = (token.roles as typeof session.user.roles) ?? [];
      }
      return session;
    },
  },
});

const protectedPrefixes = ["/cuenta", "/checkout", "/ordenes", "/favoritos"];
const authPrefixes = ["/auth/login", "/auth/registro"];
const authAttempts = new Map<string, { count: number; resetAt: number }>();

function authRateLimit(request: Request) {
  if (request.method !== "POST" || !new URL(request.url).pathname.startsWith("/api/auth/callback/credentials")) return null;
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "local";
  const now = Date.now();
  const current = authAttempts.get(ip);
  if (!current || current.resetAt <= now) {
    authAttempts.set(ip, { count: 1, resetAt: now + 15 * 60 * 1000 });
    return null;
  }
  if (current.count >= 20) {
    return new NextResponse("Demasiados intentos", { status: 429, headers: { "Retry-After": String(Math.ceil((current.resetAt - now) / 1000)) } });
  }
  current.count += 1;
  return null;
}

export default edgeAuth((request) => {
  const limited = authRateLimit(request);
  if (limited) return limited;
  const { pathname } = request.nextUrl;
  const isLoggedIn = Boolean(request.auth?.user);
  const roles = request.auth?.user?.roles ?? [];

  if (pathname.startsWith("/admin") && !roles.includes("ADMIN")) {
    const url = new URL(isLoggedIn ? "/cuenta" : "/auth/login", request.url);
    return NextResponse.redirect(url);
  }

  if (protectedPrefixes.some((prefix) => pathname.startsWith(prefix)) && !isLoggedIn) {
    const url = new URL("/auth/login", request.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  if (authPrefixes.some((prefix) => pathname.startsWith(prefix)) && isLoggedIn) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/cuenta/:path*", "/checkout/:path*", "/ordenes/:path*", "/favoritos/:path*", "/auth/login", "/auth/registro", "/api/auth/callback/credentials"],
};
