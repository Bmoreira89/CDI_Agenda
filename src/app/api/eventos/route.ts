// src/app/api/eventos/route.ts
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// ---------- helpers: DATE-ONLY (YYYY-MM-DD) sem timezone ----------
function toDateOnly(input: unknown): string {
  const s = String(input ?? "").trim();
  if (!s) return "";
  // já veio YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  // veio ISO (YYYY-MM-DDTHH:mm:ss...)
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
  return m?.[1] ?? "";
}

// armazena ao MEIO-DIA UTC para não “voltar” dia no -03
function dateOnlyToSafeUTC(dateOnly: string): Date {
  return new Date(`${dateOnly}T12:00:00.000Z`);
}

// pega YYYY-MM-DD a partir de um Date do banco
function dbDateToDateOnly(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function makeTitle(cidade: string, quantidade: number) {
  return `${cidade}: ${quantidade} exame(s)`;
}

// ---------- GET: lista eventos do médico logado ----------
export async function GET() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const eventos = await prisma.eventoAgenda.findMany({
    where: { email },
    orderBy: [{ data: "asc" }, { id: "asc" }],
    select: { id: true, cidade: true, quantidade: true, data: true },
  });

  // FullCalendar precisa de start em "YYYY-MM-DD" para allDay sem timezone
  const payload = eventos.map((e) => ({
    id: String(e.id),
    title: makeTitle(e.cidade, e.quantidade),
    start: dbDateToDateOnly(e.data),
    allDay: true,
    extendedProps: {
      cidade: e.cidade,
      quantidade: e.quantidade,
    },
  }));

  return NextResponse.json(payload);
}

// ---------- POST: cria evento (apenas inserir; sem editar) ----------
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const cidade = String(body?.cidade ?? "").trim();
  const quantidade = Number(body?.quantidade ?? 0);
  const dateOnly = toDateOnly(body?.date);

  if (!cidade) return NextResponse.json({ error: "cidade_obrigatoria" }, { status: 400 });
  if (!dateOnly) return NextResponse.json({ error: "data_obrigatoria" }, { status: 400 });
  if (!Number.isFinite(quantidade) || quantidade <= 0)
    return NextResponse.json({ error: "quantidade_invalida" }, { status: 400 });

  // valida permissão do médico para o local
  const perm = await prisma.permissaoAgenda.findFirst({
    where: { email, cidade },
    select: { id: true },
  });

  if (!perm) return NextResponse.json({ error: "sem_permissao_para_este_local" }, { status: 403 });

  const created = await prisma.eventoAgenda.create({
    data: {
      email,
      cidade,
      quantidade,
      data: dateOnlyToSafeUTC(dateOnly),
    },
    select: { id: true, cidade: true, quantidade: true, data: true },
  });

  return NextResponse.json({
    id: String(created.id),
    title: makeTitle(created.cidade, created.quantidade),
    start: dbDateToDateOnly(created.data),
    allDay: true,
    extendedProps: { cidade: created.cidade, quantidade: created.quantidade },
  });
}

// ---------- DELETE: exclui evento do próprio médico ----------
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get("id") ?? 0);
  if (!id) return NextResponse.json({ error: "id_obrigatorio" }, { status: 400 });

  const evento = await prisma.eventoAgenda.findUnique({
    where: { id },
    select: { id: true, email: true },
  });

  if (!evento) return NextResponse.json({ error: "nao_encontrado" }, { status: 404 });
  if (evento.email !== email) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  await prisma.eventoAgenda.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
