import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const role = await prisma.role.upsert({
    where: { name: "CLIENT" },
    update: {},
    create: {
      name: "CLIENT",
      description: "Cliente de la tienda",
    },
  });

  const passwordHash = await bcrypt.hash("Cliente123", 12);
  const user = await prisma.user.upsert({
    where: { email: "cliente@erclav.local" },
    update: {
      passwordHash,
      emailVerified: new Date(),
      isActive: true,
      firstName: "Cliente",
      lastName: "Demo",
      name: "Cliente Demo",
    },
    create: {
      email: "cliente@erclav.local",
      passwordHash,
      firstName: "Cliente",
      lastName: "Demo",
      name: "Cliente Demo",
      emailVerified: new Date(),
      isActive: true,
    },
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: user.id,
        roleId: role.id,
      },
    },
    update: {},
    create: {
      userId: user.id,
      roleId: role.id,
    },
  });

  console.log("Cliente listo:", user.email);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
