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

function getRequesterId(req: NextRequest): number {
  const raw = req.headers.get("x-user-id") || "";
  const id = Number(raw);
  if (!id || Number.isNaN(id)) return 0;
  return id;
}

async function getRequester(req: NextRequest) {
  const id = getRequesterId(req);
  if (!id) return null;

  return prisma.medicoAgenda.findUnique({
    where: { id },
    select: { id: true, email: true, nome: true, perfil: true },
  });
}

async function isAdminRequester(req: NextRequest) {
  const u = await getRequester(req);
  return u && String(u.perfil ?? "").toLowerCase() === "admin";
}

async function medicoPodeVerCidade(email: string, cidade: string) {
  const perm = await prisma.permissaoAgenda.findFirst({
    where: { email, cidade },
    select: { id: true },
  });
  return !!perm;
}

async function medicoPermissoes(email: string): Promise<string[]> {
  const perms = await prisma.permissaoAgenda.findMany({
    where: { email },
    select: { cidade: true },
  });
  return perms.map((p) => p.cidade);
}

export async function GET(req: NextRequest) {
  const requester = await getRequester(req);
  if (!requester) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const medicoIdParam = Number(searchParams.get("medicoId") ?? 0);

  const admin = String(requester.perfil ?? "").toLowerCase() === "admin";

  // Admin pode escolher médico via query, senão vê tudo
  if (admin) {
    const where: any = {};
    if (medicoIdParam && !Number.isNaN(medicoIdParam)) where.medicoId = medicoIdParam;

    const eventos = await prisma.eventoAgenda.findMany({
      where,
      orderBy: { data: "asc" },
    });

    return NextResponse.json(eventos.map(toCalendarEvent));
  }

  // Médico: ignora medicoIdParam (não pode forjar), só vê o dele + cidades permitidas
  const allowed = await medicoPermissoes(requester.email);
  const where: any = {
    medicoId: requester.id,
    cidade: { in: allowed.length ? allowed : ["__sem_permissao__"] },
  };

  const eventos = await prisma.eventoAgenda.findMany({
    where,
    orderBy: { data: "asc" },
  });

  return NextResponse.json(eventos.map(toCalendarEvent));
}

export async function POST(req: NextRequest) {
  const requester = await getRequester(req);
  if (!requester) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const admin = String(requester.perfil ?? "").toLowerCase() === "admin";

  const body = await req.json().catch(() => ({}));

  const dateRaw = body?.date;
  const cidade = String(body?.cidade ?? "").trim();
  const quantidade = Number(body?.quantidade ?? 0);
  const medicoIdBody = Number(body?.medicoId ?? 0);
  const medicoNomeBody = String(body?.medicoNome ?? "").trim();

  if (!dateRaw || !cidade || !quantidade || !medicoIdBody || !medicoNomeBody) {
    return NextResponse.json({ error: "campos_obrigatorios" }, { status: 400 });
  }

  const data = new Date(dateRaw);
  if (isNaN(data.getTime())) {
    return NextResponse.json({ error: "data_invalida" }, { status: 400 });
  }

  if (admin) {
    // Admin pode criar para qualquer médico, mas vamos garantir que existe
    const alvo = await prisma.medicoAgenda.findUnique({
      where: { id: medicoIdBody },
      select: { id: true, nome: true, email: true, perfil: true },
    });
    if (!alvo) return NextResponse.json({ error: "medico_nao_encontrado" }, { status: 404 });

    const created = await prisma.eventoAgenda.create({
      data: { data, cidade, quantidade, medicoId: alvo.id, medicoNome: alvo.nome },
    });

    return NextResponse.json(toCalendarEvent(created));
  }

  // Médico: só pode criar para si mesmo
  if (medicoIdBody !== requester.id) {
    return NextResponse.json({ error: "nao_pode_criar_para_outro_medico" }, { status: 403 });
  }

  // Médico: precisa ter permissão na cidade
  const permitido = await medicoPodeVerCidade(requester.email, cidade);
  if (!permitido) return NextResponse.json({ error: "sem_permissao_para_local" }, { status: 403 });

  const created = await prisma.eventoAgenda.create({
    data: { data, cidade, quantidade, medicoId: requester.id, medicoNome: requester.nome },
  });

  return NextResponse.json(toCalendarEvent(created));
}

export async function DELETE(req: NextRequest) {
  const requester = await getRequester(req);
  if (!requester) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const admin = String(requester.perfil ?? "").toLowerCase() === "admin";

  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get("id") ?? 0);
  if (!id) return NextResponse.json({ error: "id_obrigatorio" }, { status: 400 });

  const evento = await prisma.eventoAgenda.findUnique({ where: { id } });
  if (!evento) return NextResponse.json({ error: "nao_encontrado" }, { status: 404 });

  if (admin) {
    await prisma.eventoAgenda.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  }

  // Médico: só pode deletar evento dele mesmo
  if (evento.medicoId !== requester.id) {
    return NextResponse.json({ error: "nao_pode_apagar_de_outro_medico" }, { status: 403 });
  }

  // Médico: ainda confirma permissão na cidade (caso permissões mudem)
  const permitido = await medicoPodeVerCidade(requester.email, evento.cidade);
  if (!permitido) return NextResponse.json({ error: "sem_permissao_para_local" }, { status: 403 });

  await prisma.eventoAgenda.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
