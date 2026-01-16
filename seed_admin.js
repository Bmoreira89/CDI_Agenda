const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

(async () => {
  const prisma = new PrismaClient();

  const email = "admin@cuestacdi.com";
  const senha = "123456"; // TROQUE depois no painel (ou eu te passo a tela de trocar senha)
  const nome = "Admin CDI";
  const perfil = "admin";

  const existe = await prisma.medicoAgenda.findUnique({ where: { email } });

  if (existe) {
    console.log("ADMIN ja existe:", existe.email, "perfil=", existe.perfil);
    await prisma.$disconnect();
    return;
  }

  const hash = await bcrypt.hash(senha, 10);

  const created = await prisma.medicoAgenda.create({
    data: { nome, email, senha: hash, perfil },
    select: { id: true, nome: true, email: true, perfil: true },
  });

  console.log("ADMIN criado com sucesso:", created);
  console.log("LOGIN:", email);
  console.log("SENHA:", senha);
  await prisma.$disconnect();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
