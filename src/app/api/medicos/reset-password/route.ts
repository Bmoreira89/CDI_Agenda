// src/app/api/medicos/reset-password/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { registrarLog } from "@/lib/log";
import bcrypt from "bcryptjs";

export async function PUT(req: Request) {
  try {
    const { id, novaSenha } = await req.json();

    const senhaHash = await bcrypt.hash(novaSenha, 10);

    const medico = await prisma.medicoAgenda.update({
      where: { id },
      data: { senha: senhaHash },
    });

    await registrarLog({
      usuarioId: medico.id,
      acao: "senha_redefinida",
      detalhes: `Senha redefinida para ${medico.email}`,
    });

    return NextResponse.json({ sucesso: true });
  } catch (error) {
    console.error("Erro ao redefinir senha:", error);
    return NextResponse.json(
      { message: "Erro ao redefinir senha" },
      { status: 500 }
    );
  }
}
