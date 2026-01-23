export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

function getTokenFromReq(req: NextRequest) {
  const h = req.headers;
  const byHeader =
    h.get("x-admin-token") ||
    h.get("x-token") ||
    h.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    "";
  const byQuery = new URL(req.url).searchParams.get("token") || "";
  return (byHeader || byQuery).trim();
}

async function isAdmin(req: NextRequest) {
  // (A) Token-based
  const token = getTokenFromReq(req);
  const expected = (process.env.ADMIN_TOKEN || "").trim();
  if (expected && token && token === expected) return true;

  // (B) Header-based (x-user-id)
  const userId = req.headers.get("x-user-id");
  const id = Number(userId ?? 0);
  if (!id || Number.isNaN(id)) return false;

  const u = await prisma.medicoAgenda.findUnique({
    where: { id },
    select: { perfil: true },
  });

  return String(u?.perfil ?? "").toLowerCase() === "admin";
}

export async function GET(req: NextRequest) {
  if (!(await isAdmin(req))) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const users = await prisma.medicoAgenda.findMany({
    orderBy: [{ nome: "asc" }, { email: "asc" }],
    select: { id: true, nome: true, email: true, crm: true, perfil: true, createdAt: true },
  });

  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin(req))) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const nome = String(body?.nome ?? "").trim();
  const email = String(body?.email ?? "").trim().toLowerCase();
  const crm = body?.crm ? String(body.crm).trim() : null;
  const perfil = String(body?.perfil ?? "medico").toLowerCase() === "admin" ? "admin" : "medico";
  const senha = String(body?.senha ?? "").trim();

  if (!nome || !email || !senha) return NextResponse.json({ error: "campos_obrigatorios" }, { status: 400 });

  const hash = await bcrypt.hash(senha, 10);

  try {
    const created = await prisma.medicoAgenda.create({
      data: { nome, email, crm, perfil, senha: hash },
      select: { id: true, nome: true, email: true, crm: true, perfil: true },
    });
    return NextResponse.json(created);
  } catch (e: any) {
    return NextResponse.json({ error: "erro_criar_usuario", details: e?.message ?? String(e) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!(await isAdmin(req))) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get("id") ?? 0);
  if (!id) return NextResponse.json({ error: "id_obrigatorio" }, { status: 400 });

  const medico = await prisma.medicoAgenda.findUnique({ where: { id } });
  if (!medico) return NextResponse.json({ error: "nao_encontrado" }, { status: 404 });

  // remove permissões por email
  await prisma.permissaoAgenda.deleteMany({ where: { email: medico.email } });

  // remove eventos desse médico
  await prisma.eventoAgenda.deleteMany({ where: { medicoId: id } });

  // remove logs desse médico
  await prisma.logAcao.deleteMany({ where: { usuarioId: id } });

  await prisma.medicoAgenda.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
