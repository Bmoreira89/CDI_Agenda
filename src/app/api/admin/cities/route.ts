export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

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

  const cidades = await prisma.cidadeAgenda.findMany({
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
    const created = await prisma.cidadeAgenda.create({
      data: { nome },
      select: { id: true, nome: true },
    });
    return NextResponse.json(created);
  } catch (e: any) {
    // Prisma unique violation
    if (e?.code === "P2002") {
      return NextResponse.json({ error: "local_ja_existe", nome }, { status: 409 });
    }
    return NextResponse.json({ error: "erro_criar_cidade", details: e?.message ?? String(e) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!(await isAdmin(req))) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get("id") ?? 0);
  if (!id) return NextResponse.json({ error: "id_obrigatorio" }, { status: 400 });

  const cidade = await prisma.cidadeAgenda.findUnique({ where: { id } });
  if (!cidade) return NextResponse.json({ error: "nao_encontrado" }, { status: 404 });

  await prisma.permissaoAgenda.deleteMany({ where: { cidade: cidade.nome } });
  await prisma.eventoAgenda.deleteMany({ where: { cidade: cidade.nome } });

  await prisma.cidadeAgenda.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
