import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { RoleName } from "@prisma/client";
import { z } from "zod";

class InvalidLoginError extends CredentialsSignin {
  code = "Credenciales invalidas";
}

class EmailNotVerifiedError extends CredentialsSignin {
  code = "Email no verificado";
}

const credentialsSchema = z.object({
  email: z.string().email().trim().toLowerCase(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 30,
  },
  pages: {
    signIn: "/auth/login",
  },
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-authjs.session-token"
          : "authjs.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) {
          throw new InvalidLoginError();
        }

        const [{ default: bcrypt }, { prisma }] = await Promise.all([
          import("bcrypt"),
          import("@/lib/prisma"),
        ]);

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
          include: { roles: { include: { role: true } } },
        });

        if (!user?.isActive) {
          throw new InvalidLoginError();
        }

        const validPassword = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!validPassword) {
          throw new InvalidLoginError();
        }

        if (!user.emailVerified) {
          throw new EmailNotVerifiedError();
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? `${user.firstName} ${user.lastName}`.trim(),
          roles: user.roles.map((userRole) => userRole.role.name),
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.roles = user.roles ?? [];
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.roles = (token.roles as RoleName[]) ?? [];
      }

      return session;
    },
  },
  trustHost: true,
});
