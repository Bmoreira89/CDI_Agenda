export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { isAdminRequest } from "@/lib/adminAuth";

export async function GET(req: NextRequest) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const users = await prisma.user.findMany({
    orderBy: { nome: "asc" },
    select: { id: true, nome: true, email: true, perfil: true, crm: true },
  });

  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const nome = String(body?.nome ?? "").trim();
  const email = String(body?.email ?? "").trim().toLowerCase();
  const crm = body?.crm ? String(body.crm).trim() : null;
  const perfil = String(body?.perfil ?? "medico").toLowerCase() === "admin" ? "admin" : "medico";
  const senha = String(body?.senha ?? "").trim();

  if (!nome || !email || !senha) {
    return NextResponse.json({ error: "campos_obrigatorios" }, { status: 400 });
  }

  const hash = await bcrypt.hash(senha, 10);

  try {
    const created = await prisma.user.create({
      data: { nome, email, crm, perfil, senha: hash },
      select: { id: true, nome: true, email: true, perfil: true, crm: true },
    });
    return NextResponse.json(created);
  } catch (e: any) {
    return NextResponse.json(
      { error: "erro_criar_usuario", details: e?.message ?? String(e) },
      { status: 500 }
    );
  }
}
