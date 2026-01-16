export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

// POST /api/medicos/reset-password
// body: { id: number, senha: string }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const id = Number(body?.id ?? 0);
    const senha = String(body?.senha ?? "").trim();

    if (!id || !senha) {
      return NextResponse.json({ error: "campos_obrigatorios" }, { status: 400 });
    }

    const medico = await prisma.medicoAgenda.findUnique({ where: { id } });
    if (!medico) {
      return NextResponse.json({ error: "medico_nao_encontrado" }, { status: 404 });
    }

    const hash = await bcrypt.hash(senha, 10);

    await prisma.medicoAgenda.update({
      where: { id },
      data: { senha: hash },
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: "erro_reset_password", details: e?.message ?? String(e) },
      { status: 500 }
    );
  }
}
