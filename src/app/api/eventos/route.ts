export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

function toCalendarEvent(e: any) {
  return {
    id: String(e.id),
    title: `${e.cidade}: ${e.quantidade} exame(s)`,
    start: e.data,
    allDay: true,
    extendedProps: {
      cidade: e.cidade,
      medico: e.medicoNome,
      quantidade: e.quantidade,
      medicoId: e.medicoId,
    },
  };
}

async function medicoTemPermissaoPorId(medicoId: number, cidade: string): Promise<boolean> {
  const medico = await prisma.medicoAgenda.findUnique({
    where: { id: medicoId },
    select: { email: true, perfil: true },
  });
  if (!medico) return false;

  // admin pode tudo
  if (String(medico.perfil ?? "").toLowerCase() === "admin") return true;

  const perm = await prisma.permissaoAgenda.findFirst({
    where: { email: medico.email, cidade },
    select: { id: true },
  });
  return !!perm;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const medicoIdRaw = searchParams.get("medicoId");
  const where: any = {};

  if (medicoIdRaw) {
    const id = Number(medicoIdRaw);
    if (!Number.isNaN(id) && id > 0) where.medicoId = id;

    // filtra por permissões (se não for admin)
    const medico = await prisma.medicoAgenda.findUnique({ where: { id }, select: { email: true, perfil: true } });
    if (medico && String(medico.perfil ?? "").toLowerCase() !== "admin") {
      const perms = await prisma.permissaoAgenda.findMany({
        where: { email: medico.email },
        select: { cidade: true },
      });
      const allowed = perms.map(p => p.cidade);
      where.cidade = { in: allowed.length ? allowed : ["__sem_permissao__"] };
    }
  }

  const eventos = await prisma.eventoAgenda.findMany({
    where,
    orderBy: { data: "asc" },
  });

  return NextResponse.json(eventos.map(toCalendarEvent));
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));

  const dateRaw = body?.date;
  const cidade = String(body?.cidade ?? "").trim();
  const quantidade = Number(body?.quantidade ?? 0);
  const medicoId = Number(body?.medicoId ?? 0);
  const medicoNome = String(body?.medicoNome ?? "").trim();

  if (!dateRaw || !cidade || !quantidade || !medicoId || !medicoNome) {
    return NextResponse.json({ error: "campos_obrigatorios" }, { status: 400 });
  }

  const data = new Date(dateRaw);
  if (isNaN(data.getTime())) {
    return NextResponse.json({ error: "data_invalida" }, { status: 400 });
  }

  const permitido = await medicoTemPermissaoPorId(medicoId, cidade);
  if (!permitido) {
    return NextResponse.json({ error: "sem_permissao_para_local" }, { status: 403 });
  }

  const created = await prisma.eventoAgenda.create({
    data: { data, cidade, quantidade, medicoId, medicoNome },
  });

  return NextResponse.json(toCalendarEvent(created));
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get("id") ?? 0);
  if (!id) return NextResponse.json({ error: "id_obrigatorio" }, { status: 400 });

  await prisma.eventoAgenda.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
