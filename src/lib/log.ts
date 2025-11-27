import prisma from "./prisma";

export async function registrarLog(usuarioId: number, acao: string, detalhes?: string) {
  try {
    await prisma.logAcao.create({
      data: {
        usuarioId,
        acao,
        detalhes: detalhes || null,
      },
    });
  } catch (err) {
    console.error("Erro ao registrar log:", err);
  }
}
