export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

function isAdmin(session: any) {
  const u: any = session?.user;
  const perfil = String(u?.perfil ?? u?.role ?? "").toLowerCase();
  return perfil === "admin" || perfil === "administrator";
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !isAdmin(session)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const cidades = await prisma.cidade.findMany({
    orderBy: { nome: "asc" },
    select: { id: true, nome: true },
  });

  return NextResponse.json({ cidades });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !isAdmin(session)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const nome = String(body?.nome ?? "").trim();
  if (!nome) return NextResponse.json({ error: "nome_obrigatorio" }, { status: 400 });

  try {
    const created = await prisma.cidade.create({
      data: { nome },
      select: { id: true, nome: true },
    });
    return NextResponse.json({ cidade: created });
  } catch (e: any) {
    return NextResponse.json({ error: "erro_criar_cidade", details: e?.message ?? String(e) }, { status: 500 });
  }
}
