const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL || "admin@cuestacdi.com";
  const senha = process.env.ADMIN_PASSWORD || "Admin@12345";

  const hash = await bcrypt.hash(senha, 10);

  const admin = await prisma.user.upsert({
    where: { email },
    update: { role: "admin", passwordHash: hash, name: "Administrador" },
    create: { email, role: "admin", passwordHash: hash, name: "Administrador" },
  });

  console.log("✅ Admin OK:", admin.email, admin.role);

  // cidades iniciais opcionais (pode apagar se não quiser)
  const cidades = ["AME", "Itatinga", "Torre de Pedra", "Óleo", "São Manuel"];
  for (const nome of cidades) {
    await prisma.cidade.upsert({
      where: { nome },
      update: {},
      create: { nome },
    });
  }
  console.log("✅ Cidades iniciais OK");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });