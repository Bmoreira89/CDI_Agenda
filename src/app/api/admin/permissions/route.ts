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
  const token = getTokenFromReq(req);
  const expected = (process.env.ADMIN_TOKEN || "").trim();
  return !!(expected && token && token === expected);
}

// GET /api/admin/permissions?email=...
export async function GET(req: NextRequest) {
  if (!(await isAdmin(req))) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const email = new URL(req.url).searchParams.get("email")?.trim().toLowerCase() || "";
  if (!email) return NextResponse.json({ error: "email_obrigatorio" }, { status: 400 });

  const permissoes = await prisma.permissaoCidade.findMany({
    where: { email, ativo: true },
    select: { cidadeId: true },
  });

  return NextResponse.json({ email, cidadeIds: permissoes.map(p => p.cidadeId) });
}

// POST /api/admin/permissions
// body: { email: string, cidadeIds: number[] }
export async function POST(req: NextRequest) {
  if (!(await isAdmin(req))) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const email = String(body?.email ?? "").trim().toLowerCase();
  const cidadeIds = Array.isArray(body?.cidadeIds) ? body.cidadeIds.map((x: any) => Number(x)).filter((n: number) => n > 0) : [];

  if (!email) return NextResponse.json({ error: "email_obrigatorio" }, { status: 400 });

  // zera e recria (simples e robusto)
  await prisma.permissaoCidade.deleteMany({ where: { email } });

  if (cidadeIds.length > 0) {
    await prisma.permissaoCidade.createMany({
      data: cidadeIds.map((cidadeId: number) => ({ email, cidadeId, ativo: true })),
      skipDuplicates: true,
    });
  }

  return NextResponse.json({ ok: true, email, cidadeIds });
}
