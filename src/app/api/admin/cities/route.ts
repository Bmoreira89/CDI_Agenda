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
  if (expected && token && token === expected) return true;
  return false;
}

function prismaError(e: any) {
  const code = e?.code || e?.meta?.cause || "";
  const msg = e?.message || String(e);
  return { code, msg };
}

export async function GET(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const cidades = await prisma.cidadeAgenda.findMany({
    orderBy: { nome: "asc" },
    select: { id: true, nome: true },
  });

  return NextResponse.json(cidades);
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const nome = String(body?.nome ?? "").trim();

  if (!nome) return NextResponse.json({ error: "nome_obrigatorio" }, { status: 400 });

  try {
    const created = await prisma.cidadeAgenda.create({
      data: { nome },
      select: { id: true, nome: true },
    });
    return NextResponse.json(created);
  } catch (e: any) {
    const { code, msg } = prismaError(e);

    // Nome duplicado (se tiver unique)
    if (code === "P2002") {
      return NextResponse.json({ error: "cidade_ja_existe" }, { status: 409 });
    }

    return NextResponse.json({ error: "erro_criar_cidade", details: msg }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const id = Number(new URL(req.url).searchParams.get("id") ?? 0);
  if (!id) return NextResponse.json({ error: "id_obrigatorio" }, { status: 400 });

  try {
    await prisma.cidadeAgenda.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    const { code, msg } = prismaError(e);

    // Se tiver vínculo (FK)
    if (code === "P2003") {
      return NextResponse.json(
        { error: "nao_pode_excluir_cidade_com_vinculos" },
        { status: 409 }
      );
    }

    return NextResponse.json({ error: "erro_excluir_cidade", details: msg }, { status: 500 });
  }
}
