export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { registrarLog } from "@/lib/log";
import bcrypt from "bcryptjs";

export async function PUT(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    const idRaw = body?.id;
    const novaSenha = body?.novaSenha;

    const id =
      typeof idRaw === "number"
        ? idRaw
        : typeof idRaw === "string" && idRaw.trim() !== "" && !Number.isNaN(Number(idRaw))
          ? Number(idRaw)
          : null;

    if (!id || typeof novaSenha !== "string" || novaSenha.trim().length < 6) {
      return NextResponse.json(
        { message: "Dados inválidos (id e novaSenha >= 6)" },
        { status: 400 }
      );
    }

    const senhaHash = await bcrypt.hash(novaSenha, 10);

    const medico = await prisma.medicoAgenda.update({
      where: { id },
      data: { senha: senhaHash }
    });

    await registrarLog({
      usuarioId: medico.id,
      acao: "senha_redefinida",
      detalhes: `Senha redefinida para ${medico.email}`
    });

    return NextResponse.json({ sucesso: true });
  } catch (e: any) {
    return NextResponse.json(
      { message: "Erro ao redefinir senha", details: e?.message ?? String(e) },
      { status: 500 }
    );
  }
}
