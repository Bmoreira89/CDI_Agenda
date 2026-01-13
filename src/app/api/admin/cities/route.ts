// src/app/api/admin/cities/route.ts
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

type SessionUser = {
  id?: number | string;
  perfil?: string | null;
  role?: string | null;
};

function isAdmin(session: any) {
  const user = session?.user as SessionUser | undefined;
  const perfil = (user?.perfil ?? user?.role ?? "").toString().toLowerCase();
  return perfil === "admin";
}

// GET /api/admin/cities
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    if (!isAdmin(session)) return NextResponse.json({ error: "forbidden" }, { status: 403 });

    const cidades = await prisma.cidadeAgenda.findMany({
      orderBy: { nome: "asc" },
    });

    return NextResponse.json({ cidades });
  } catch (e: any) {
    return NextResponse.json(
      { error: "internal_error", details: e?.message ?? String(e) },
      { status: 500 }
    );
  }
}

// POST /api/admin/cities
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    if (!isAdmin(session)) return NextResponse.json({ error: "forbidden" }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const nome = (body?.nome ?? "").toString().trim();

    if (!nome) return NextResponse.json({ error: "nome_obrigatorio" }, { status: 400 });

    const cidade = await prisma.cidadeAgenda.create({
      data: { nome },
    });

    return NextResponse.json({ cidade }, { status: 201 });
  } catch (e: any) {
    // erro de unique constraint costuma cair aqui se repetir nome
    return NextResponse.json(
      { error: "internal_error", details: e?.message ?? String(e) },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/cities?id=123
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    if (!isAdmin(session)) return NextResponse.json({ error: "forbidden" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const rawId = searchParams.get("id");
    const id = rawId ? Number(rawId) : NaN;

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: "invalid_id" }, { status: 400 });
    }

    await prisma.cidadeAgenda.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: "internal_error", details: e?.message ?? String(e) },
      { status: 500 }
    );
  }
}
