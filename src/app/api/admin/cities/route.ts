export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

type SessionUser = {
  perfil?: string | null;
  role?: string | null;
};

function isAdmin(session: any) {
  const user = session?.user as SessionUser | undefined;
  const role = (user?.perfil ?? user?.role ?? "").toString().toLowerCase();
  return role === "admin";
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !isAdmin(session)) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const cidades = await prisma.cidadeAgenda.findMany({
      orderBy: { nome: "asc" },
      select: { id: true, nome: true },
    });

    return NextResponse.json({ cidades });
  } catch (e: any) {
    return NextResponse.json(
      { error: "internal_error", details: e?.message ?? String(e) },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !isAdmin(session)) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const nome = String(body?.nome ?? "").trim();

    if (!nome) {
      return NextResponse.json({ error: "Nome é obrigatório." }, { status: 400 });
    }

    const created = await prisma.cidadeAgenda.create({
      data: { nome },
      select: { id: true, nome: true },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    const msg = e?.message ?? String(e);

    // Unique constraint (cidade já existe)
    if (msg.toLowerCase().includes("unique") || msg.toLowerCase().includes("p2002")) {
      return NextResponse.json({ error: "Cidade/local já existe." }, { status: 409 });
    }

    return NextResponse.json(
      { error: "internal_error", details: msg },
      { status: 500 }
    );
  }
}
