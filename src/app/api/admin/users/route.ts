export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

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

    const users = await prisma.medicoAgenda.findMany({
      orderBy: [{ nome: "asc" }, { email: "asc" }],
      select: {
        id: true,
        nome: true,
        email: true,
        crm: true,
        perfil: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ users });
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
    const email = String(body?.email ?? "").trim().toLowerCase();
    const senha = String(body?.senha ?? "").trim();
    const crm = body?.crm ? String(body.crm).trim() : null;

    let perfil = String(body?.perfil ?? "medico").trim().toLowerCase();
    if (perfil !== "admin" && perfil !== "medico") perfil = "medico";

    if (!nome || !email || !senha) {
      return NextResponse.json(
        { error: "Nome, e-mail e senha são obrigatórios." },
        { status: 400 }
      );
    }

    const senhaHash = await bcrypt.hash(senha, 10);

    const created = await prisma.medicoAgenda.create({
      data: {
        nome,
        email,
        crm,
        perfil,
        senha: senhaHash,
      },
      select: {
        id: true,
        nome: true,
        email: true,
        crm: true,
        perfil: true,
        createdAt: true,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    const msg = e?.message ?? String(e);

    if (msg.toLowerCase().includes("unique") || msg.toLowerCase().includes("p2002")) {
      return NextResponse.json({ error: "E-mail já cadastrado." }, { status: 409 });
    }

    return NextResponse.json(
      { error: "internal_error", details: msg },
      { status: 500 }
    );
  }
}
