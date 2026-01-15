export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

type SessionUser = {
  id?: string | number;
  role?: string;
  perfil?: string | null;
};

function norm(v: unknown) {
  return String(v ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function isAdmin(session: any) {
  const user = session?.user as SessionUser | undefined;
  const p = norm(user?.perfil ?? user?.role);
  return p === "admin" || p.includes("admin");
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !isAdmin(session)) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const cidades = await prisma.cidadeAgenda.findMany({
      orderBy: { nome: "asc" },
      select: { id: true, nome: true },
    });

    return NextResponse.json(cidades);
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
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const nome = String(body?.nome ?? "").trim();

    if (!nome) {
      return NextResponse.json({ error: "nome_obrigatorio" }, { status: 400 });
    }

    const nova = await prisma.cidadeAgenda.create({
      data: { nome },
      select: { id: true, nome: true },
    });

    return NextResponse.json(nova);
  } catch (e: any) {
    // conflito de unique (cidade repetida)
    if (String(e?.code ?? "").toUpperCase() === "P2002") {
      return NextResponse.json({ error: "cidade_ja_existe" }, { status: 409 });
    }

    return NextResponse.json(
      { error: "internal_error", details: e?.message ?? String(e) },
      { status: 500 }
    );
  }
}
