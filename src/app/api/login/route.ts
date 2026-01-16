export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body?.email ?? "").trim().toLowerCase();
    const senha = String(body?.senha ?? "").trim();

    if (!email || !senha) {
      return NextResponse.json({ error: "campos_obrigatorios" }, { status: 400 });
    }

    const medico = await prisma.medicoAgenda.findUnique({
      where: { email },
      select: { id: true, nome: true, email: true, senha: true, perfil: true },
    });

    if (!medico) {
      return NextResponse.json({ error: "credenciais_invalidas" }, { status: 401 });
    }

    const ok = await bcrypt.compare(senha, medico.senha);
    if (!ok) {
      return NextResponse.json({ error: "credenciais_invalidas" }, { status: 401 });
    }

    // Não devolve hash
    return NextResponse.json({
      user: { id: medico.id, nome: medico.nome, email: medico.email, perfil: medico.perfil },
    });
  } catch (e: any) {
    return NextResponse.json({ error: "erro_login", details: e?.message ?? String(e) }, { status: 500 });
  }
}
