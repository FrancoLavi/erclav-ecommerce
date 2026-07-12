import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const adminRole = await prisma.role.upsert({
    where: { name: "ADMIN" },
    update: {},
    create: {
      name: "ADMIN",
      description: "Administrador de la tienda",
    },
  });

  await prisma.role.upsert({
    where: { name: "CLIENT" },
    update: {},
    create: {
      name: "CLIENT",
      description: "Cliente de la tienda",
    },
  });

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (adminEmail && adminPassword) {
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    const admin = await prisma.user.upsert({
      where: { email: adminEmail.toLowerCase() },
      update: {
        passwordHash,
        emailVerified: new Date(),
        isActive: true,
      },
      create: {
        email: adminEmail.toLowerCase(),
        passwordHash,
        name: "Administrador",
        firstName: "Admin",
        lastName: "ErcLav",
        emailVerified: new Date(),
        roles: {
          create: {
            roleId: adminRole.id,
          },
        },
      },
    });

    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: admin.id,
          roleId: adminRole.id,
        },
      },
      update: {},
      create: {
        userId: admin.id,
        roleId: adminRole.id,
      },
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
