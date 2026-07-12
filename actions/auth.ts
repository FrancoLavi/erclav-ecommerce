"use server";

import bcrypt from "bcrypt";
import { AuthError } from "next-auth";
import { z } from "zod";

import { signIn, signOut } from "@/auth";
import { addMinutes, createRawToken, hashToken } from "@/lib/auth-tokens";
import { sendPasswordResetEmail, sendVerificationEmail, sendWelcomeEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";

type ActionState = {
  ok: boolean;
  message: string;
};

const registerSchema = z.object({
  firstName: z.string().trim().min(2, "Ingresa tu nombre."),
  lastName: z.string().trim().min(2, "Ingresa tu apellido."),
  email: z.string().email("Ingresa un email valido.").trim().toLowerCase(),
  password: z
    .string()
    .min(8, "La contrasena debe tener al menos 8 caracteres.")
    .regex(/[A-Z]/, "Agrega al menos una mayuscula.")
    .regex(/[a-z]/, "Agrega al menos una minuscula.")
    .regex(/[0-9]/, "Agrega al menos un numero."),
});

const loginSchema = z.object({
  email: z.string().email().trim().toLowerCase(),
  password: z.string().min(1),
});

const emailSchema = z.object({
  email: z.string().email("Ingresa un email valido.").trim().toLowerCase(),
});

const resetSchema = z.object({
  token: z.string().min(1),
  password: registerSchema.shape.password,
});

function firstError(error: z.ZodError) {
  return error.issues[0]?.message ?? "Revisa los datos e intenta otra vez.";
}

function appUrl() {
  return process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000";
}

async function ensureClientRole() {
  return prisma.role.upsert({
    where: { name: "CLIENT" },
    update: {},
    create: {
      name: "CLIENT",
      description: "Cliente de la tienda",
    },
  });
}

export async function registerAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const rate = await checkRateLimit("auth:register", { limit: 5, windowMs: 60 * 60 * 1000 });
  if (!rate.allowed) return { ok: false, message: "Demasiados intentos. Proba nuevamente mas tarde." };
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { ok: false, message: firstError(parsed.error) };
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true },
  });

  if (existingUser) {
    return { ok: false, message: "Ya existe una cuenta con ese email." };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  const role = await ensureClientRole();
  const rawToken = createRawToken();

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: parsed.data.email,
        passwordHash,
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
        name: `${parsed.data.firstName} ${parsed.data.lastName}`,
        roles: {
          create: {
            roleId: role.id,
          },
        },
      },
    });

    await tx.emailVerificationToken.create({
      data: {
        email: user.email,
        tokenHash: hashToken(rawToken),
        expiresAt: addMinutes(60 * 24),
      },
    });
  });

  const verifyUrl = `${appUrl()}/auth/verificar-email?token=${rawToken}`;
  await sendVerificationEmail({
    to: parsed.data.email,
    name: parsed.data.firstName,
    verifyUrl,
  });

  return {
    ok: true,
    message: "Cuenta creada. Revisa tu email para verificarla antes de iniciar sesion.",
  };
}

export async function loginAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const rate = await checkRateLimit("auth:login", { limit: 10, windowMs: 15 * 60 * 1000 });
  if (!rate.allowed) return { ok: false, message: "Demasiados intentos. Espera unos minutos." };
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { ok: false, message: "Email o contrasena invalidos." };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });

    return { ok: true, message: "Sesion iniciada." };
  } catch (error) {
    if (error instanceof AuthError) {
      return { ok: false, message: "Email, contrasena o verificacion invalidos." };
    }

    throw error;
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: "/auth/login" });
}

export async function requestPasswordResetAction(
  _: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const rate = await checkRateLimit("auth:password-reset", { limit: 5, windowMs: 60 * 60 * 1000 });
  if (!rate.allowed) return { ok: true, message: "Si el email existe, te enviamos un enlace para restablecer la contrasena." };
  const parsed = emailSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { ok: false, message: firstError(parsed.error) };
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true, email: true, firstName: true, name: true, isActive: true },
  });

  if (user?.isActive) {
    const rawToken = createRawToken();
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(rawToken),
        expiresAt: addMinutes(30),
      },
    });

    const resetUrl = `${appUrl()}/auth/restablecer-password?token=${rawToken}`;
    await sendPasswordResetEmail({
      to: user.email,
      name: user.name ?? user.firstName ?? user.email,
      resetUrl,
    });
  }

  return {
    ok: true,
    message: "Si el email existe, te enviamos un enlace para restablecer la contrasena.",
  };
}

export async function resetPasswordAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const rate = await checkRateLimit("auth:password-change", { limit: 10, windowMs: 60 * 60 * 1000 });
  if (!rate.allowed) return { ok: false, message: "Demasiados intentos. Proba nuevamente mas tarde." };
  const parsed = resetSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { ok: false, message: firstError(parsed.error) };
  }

  const tokenHash = hashToken(parsed.data.token);
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
    return { ok: false, message: "El enlace es invalido o ya vencio." };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    }),
  ]);

  return { ok: true, message: "Contrasena actualizada. Ya podes iniciar sesion." };
}

export async function verifyEmailToken(token: string) {
  const tokenHash = hashToken(token);
  const verificationToken = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash },
  });

  if (!verificationToken || verificationToken.expiresAt < new Date()) {
    return { ok: false, message: "El enlace de verificacion es invalido o ya vencio." };
  }

  const user = await prisma.$transaction(async (tx) => {
    const updatedUser = await tx.user.update({
      where: { email: verificationToken.email },
      data: { emailVerified: new Date() },
      select: { email: true, firstName: true, name: true },
    });

    await tx.emailVerificationToken.delete({
      where: { id: verificationToken.id },
    });

    return updatedUser;
  });

  await sendWelcomeEmail({
    to: user.email,
    name: user.name ?? user.firstName ?? user.email,
  });

  return { ok: true, message: "Email verificado. Ya podes iniciar sesion." };
}
