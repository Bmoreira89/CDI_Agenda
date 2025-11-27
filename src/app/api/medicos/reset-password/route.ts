import { NextResponse } from "next/server";
import prisma from "@/src/lib/prisma";
import bcrypt from "bcryptjs";
import { registrarLog } from "@/src/lib/log";

export async function PUT(req: Request) {
  try {
    const { medicoId, novaSenha } = await req.json();

    const senhaHash = await bcrypt.hash(novaSenha, 10);

    const medico = await prisma.medicoAgenda.update({
      where: { id: medicoId },
      data: { senha: senhaHash },
    });

    await registrarLog(
      medicoId,
      "resetar_senha",
      `Senha redefinida para o usuário ID ${medicoId}`
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Erro ao redefinir senha:", error);
    return NextResponse.json(
      { error: "Erro ao redefinir" },
      { status: 500 }
    );
  }
}
