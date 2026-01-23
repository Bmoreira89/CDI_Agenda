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

// ✅ Alias compatível com a rota nova (/api/admin/permissoes)
// GET/POST/DELETE usando PermissaoAgenda
export async function GET(req: NextRequest) {
  if (!(await isAdmin(req))) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const permissoes = await prisma.permissaoAgenda.findMany({
    orderBy: [{ email: "asc" }, { cidade: "asc" }],
    select: { id: true, email: true, cidade: true, createdAt: true },
  });

  return NextResponse.json(permissoes);
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin(req))) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const email = String(body?.email ?? "").trim().toLowerCase();
  const cidade = String(body?.cidade ?? "").trim();

  if (!email || !cidade) return NextResponse.json({ error: "campos_obrigatorios" }, { status: 400 });

  try {
    // garante que existe esse médico e esse local
    const m = await prisma.medicoAgenda.findUnique({ where: { email }, select: { id: true } });
    if (!m) return NextResponse.json({ error: "medico_nao_encontrado" }, { status: 404 });

    const c = await prisma.cidadeAgenda.findUnique({ where: { nome: cidade }, select: { id: true } });
    if (!c) return NextResponse.json({ error: "cidade_nao_encontrada" }, { status: 404 });

    const created = await prisma.permissaoAgenda.create({
      data: { email, cidade },
      select: { id: true, email: true, cidade: true, createdAt: true },
    });

    return NextResponse.json(created);
  } catch (e: any) {
    return NextResponse.json({ error: "erro_criar_permissao", details: e?.message ?? String(e) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!(await isAdmin(req))) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get("id") ?? 0);
  if (!id) return NextResponse.json({ error: "id_obrigatorio" }, { status: 400 });

  await prisma.permissaoAgenda.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
