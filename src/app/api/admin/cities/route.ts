export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

function isAdmin(req: NextRequest) {
  const token =
    req.headers.get("x-admin-token") ||
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  const expected = process.env.ADMIN_TOKEN;

  return Boolean(expected && token && token === expected);
}

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const cidades = await prisma.cidadeAgenda.findMany({
    orderBy: { nome: "asc" },
    select: { id: true, nome: true },
  });

  return NextResponse.json(cidades);
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const nome = String(body?.nome ?? "").trim();

  if (!nome) {
    return NextResponse.json({ error: "nome_obrigatorio" }, { status: 400 });
  }

  const created = await prisma.cidadeAgenda.create({
    data: { nome },
    select: { id: true, nome: true },
  });

  return NextResponse.json(created);
}
