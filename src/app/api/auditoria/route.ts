import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const logs = await prisma.logAcao.findMany({
      orderBy: { dataHora: "desc" },
      take: 200,
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true
          }
        }
      }
    });

    // Normaliza para o front (que usa createdAt)
    const logsNormalizados = logs.map((log) => ({
      id: String(log.id),
      createdAt: log.dataHora,
      acao: log.acao,
      detalhes: log.detalhes ?? "",
      usuario: log.usuario
        ? { nome: log.usuario.nome, email: log.usuario.email }
        : null
    }));

    return NextResponse.json({ logs: logsNormalizados });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Erro ao buscar auditoria", details: e?.message ?? String(e) },
      { status: 500 }
    );
  }
}
