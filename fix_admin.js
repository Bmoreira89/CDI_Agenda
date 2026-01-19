const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

(async () => {
  const prisma = new PrismaClient();

  const email = process.env.ADMIN_EMAIL || "admin@cuestacdi.com";
  const senha = process.env.ADMIN_PASSWORD || "Rash420!";

  const u = await prisma.medicoAgenda.findUnique({ where: { email } });

  const hash = await bcrypt.hash(senha, 10);

  if (!u) {
    const created = await prisma.medicoAgenda.create({
      data: { nome: "CDI administrativo", email, crm: null, senha: hash, perfil: "admin" },
      select: { id: true, nome: true, email: true, perfil: true }
    });
    console.log("✅ Admin criado:", created);
  } else {
    const updated = await prisma.medicoAgenda.update({
      where: { email },
      data: { senha: hash, perfil: "admin" },
      select: { id: true, nome: true, email: true, perfil: true }
    });
    console.log("✅ Admin atualizado:", updated);
  }

  console.log("LOGIN:", email);
  console.log("SENHA:", senha);

  await prisma.();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
