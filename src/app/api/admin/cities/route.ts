export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

async function isAdmin(req: NextRequest) {
  // Aceita admin via header x-user-id (vem do localStorage) OU via token (opcional)
  const token = req.headers.get("x-admin-token") || "";
  const expected = process.env.ADMIN_TOKEN || "";
  if (expected && token && token === expected) return true;

  const userId = req.headers.get("x-user-id");
  if (!userId) return false;

  const id = Number(userId);
  if (!id || Number.isNaN(id)) return false;

  const u = await prisma.user.findUnique({ where: { id }, select: { perfil: true } });
  return (u?.perfil || "").toLowerCase() === "admin";
}

export async function GET(req: NextRequest) {
  if (!(await isAdmin(req))) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const cidades = await prisma.cidade.findMany({
    orderBy: { nome: "asc" },
    select: { id: true, nome: true },
  });

  return NextResponse.json(cidades);
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin(req))) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const nome = String(body?.nome ?? "").trim();
  if (!nome) return NextResponse.json({ error: "nome_obrigatorio" }, { status: 400 });

  try {
    const created = await prisma.cidade.create({ data: { nome }, select: { id: true, nome: true } });
    return NextResponse.json(created);
  } catch (e: any) {
    return NextResponse.json({ error: "erro_criar_cidade", details: e?.message ?? String(e) }, { status: 500 });
  }
}
