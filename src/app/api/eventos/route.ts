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

  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const u: any = session.user;
  const userId = Number(u.id);

  const where = isAdmin(session) ? {} : { medicoId: userId };

  const eventos = await prisma.evento.findMany({
    where,
    orderBy: { date: "asc" },
  });

  return NextResponse.json({ eventos });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const u: any = session.user;
  const userId = Number(u.id);
  const medicoNome = String(u.nome ?? u.email ?? "Médico");

  const body = await req.json().catch(() => ({}));
  const cidade = String(body?.cidade ?? "").trim();
  const quantidade = Number(body?.quantidade ?? 0);
  const dateRaw = body?.date;

  if (!cidade || !quantidade || !dateRaw) {
    return NextResponse.json({ error: "campos_obrigatorios" }, { status: 400 });
  }

  const date = new Date(dateRaw);
  if (isNaN(date.getTime())) {
    return NextResponse.json({ error: "data_invalida" }, { status: 400 });
  }

  const created = await prisma.evento.create({
    data: {
      cidade,
      quantidade,
      date,
      medicoId: userId,
      medicoNome,
    },
  });

  return NextResponse.json({ evento: created });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const u: any = session.user;
  const userId = Number(u.id);
  const admin = isAdmin(session);

  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get("id") ?? 0);
  if (!id) return NextResponse.json({ error: "id_obrigatorio" }, { status: 400 });

  const ev = await prisma.evento.findUnique({ where: { id } });
  if (!ev) return NextResponse.json({ error: "nao_encontrado" }, { status: 404 });

  if (!admin && ev.medicoId !== userId) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  await prisma.evento.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
