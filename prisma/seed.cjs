// prisma/seed.cjs
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const senhaHash = await bcrypt.hash("Admin123!", 10);

  await prisma.medicoAgenda.upsert({
    where: { email: "admin@cuestacdi.com" },
    update: {},
    create: {
      nome: "Administrador",
      email: "admin@cuestacdi.com",
      perfil: "admin",
      senha: senhaHash,
    },
  });

  console.log("Seed concluído: admin@cuestacdi.com / Admin123!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
