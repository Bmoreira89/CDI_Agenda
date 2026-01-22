export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

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
  if (expected && token && token === expected) return true;
  return false;
}

function prismaMsg(e: any) {
  const code = e?.code ? String(e.code) : "";
  const msg = e?.message ? String(e.message) : String(e);
  return { code, msg };
}

export async function GET(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const users = await prisma.medicoAgenda.findMany({
    orderBy: [{ nome: "asc" }, { email: "asc" }],
    select: { id: true, nome: true, email: true, crm: true, perfil: true, createdAt: true },
  });

  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));

  const nome = String(body?.nome ?? "").trim();
  const email = String(body?.email ?? "").trim().toLowerCase();
  const crm = body?.crm ? String(body.crm).trim() : null;
  const perfil = String(body?.perfil ?? "medico").toLowerCase() === "admin" ? "admin" : "medico";
  const senha = String(body?.senha ?? "").trim();

  if (!nome || !email || !senha) {
    return NextResponse.json({ error: "campos_obrigatorios" }, { status: 400 });
  }

  const hash = await bcrypt.hash(senha, 10);

  try {
    const created = await prisma.medicoAgenda.create({
      data: { nome, email, crm, perfil, senha: hash },
      select: { id: true, nome: true, email: true, crm: true, perfil: true },
    });

    return NextResponse.json(created);
  } catch (e: any) {
    const { code, msg } = prismaMsg(e);

    // Duplicado (unique) — normalmente e-mail
    if (code === "P2002") {
      return NextResponse.json(
        { error: "email_duplicado", details: "Já existe um usuário com esse e-mail." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "erro_criar_usuario", details: msg },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const idStr = new URL(req.url).searchParams.get("id") || "";
  const id = Number(idStr);

  if (!id || Number.isNaN(id)) {
    return NextResponse.json({ error: "id_invalido" }, { status: 400 });
  }

  try {
    await prisma.medicoAgenda.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    const { code, msg } = prismaMsg(e);

    if (code === "P2025") {
      return NextResponse.json({ error: "nao_encontrado" }, { status: 404 });
    }

    // FK / vínculo com eventos etc.
    if (code === "P2003") {
      return NextResponse.json(
        {
          error: "medico_em_uso",
          details: "Esse médico está vinculado a registros (ex.: eventos). Remova os vínculos antes.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "erro_excluir_usuario", details: msg },
      { status: 500 }
    );
  }
}
