// src/lib/log.ts
import prisma from "./prisma";

type RegistrarLogParams = {
  usuarioId: number | null;
  acao: string;
  detalhes?: string | null;
};

export async function registrarLog({
  usuarioId,
  acao,
  detalhes,
}: RegistrarLogParams) {
  try {
    await prisma.logAcao.create({
      data: {
        usuarioId,
        acao,
        detalhes: detalhes ?? null,
      },
    });
  } catch (error) {
    console.error("Erro ao registrar log:", error);
  }
}
