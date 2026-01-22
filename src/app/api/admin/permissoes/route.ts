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

function isAdminByToken(req: NextRequest) {
  const token = getTokenFromReq(req);
  const expected = (process.env.ADMIN_TOKEN || "").trim();
  return Boolean(expected && token && token === expected);
}

export async function GET(req: NextRequest) {
  if (!isAdminByToken(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const email = new URL(req.url).searchParams.get("email")?.trim().toLowerCase();
  if (!email) return NextResponse.json({ error: "email_obrigatorio" }, { status: 400 });

  const rows = await prisma.permissaoCidadeAgenda.findMany({
    where: { email },
    select: { cidadeId: true },
    orderBy: { cidadeId: "asc" },
  });

  return NextResponse.json({ email, cidadeIds: rows.map((r) => r.cidadeId) });
}

export async function PUT(req: NextRequest) {
  if (!isAdminByToken(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const email = String(body?.email ?? "").trim().toLowerCase();
  const cidadeIds = Array.isArray(body?.cidadeIds) ? body.cidadeIds : [];

  if (!email) return NextResponse.json({ error: "email_obrigatorio" }, { status: 400 });

  const ids = cidadeIds
    .map((x: any) => Number(x))
    .filter((n: number) => Number.isFinite(n) && n > 0);

  // troca "set completo": apaga tudo e recria
  await prisma.$transaction(async (tx) => {
    await tx.permissaoCidadeAgenda.deleteMany({ where: { email } });

    if (ids.length) {
      await tx.permissaoCidadeAgenda.createMany({
        data: ids.map((cidadeId: number) => ({ email, cidadeId })),
        skipDuplicates: true,
      });
    }
  });

  return NextResponse.json({ ok: true, email, cidadeIds: ids });
}
