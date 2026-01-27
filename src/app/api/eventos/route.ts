export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

/**
 * Date-only helpers (evita cair no dia anterior por timezone)
 */
function isDateOnly(s: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

function toSafeDateFromDateOnly(dateOnly: string) {
  // Meio-dia UTC garante que nunca “volta um dia” em -03:00
  return new Date(`${dateOnly}T12:00:00.000Z`);
}

function dateOnlyFromDate(d: Date) {
  // Converte para YYYY-MM-DD em UTC
  return d.toISOString().slice(0, 10);
}

async function getSessionEmail(): Promise<string | null> {
  const session = await getServerSession(authOptions as any);
  const email = (session as any)?.user?.email;
  return typeof email === "string" && email.trim() ? email.trim().toLowerCase() : null;
}

async function getUserByEmail(email: string) {
  const u = await prisma.medicoAgenda.findUnique({
    where: { email },
    select: { id: true, nome: true, perfil: true, email: true },
  });

  return {
    id: u?.id ?? null,
    nome: u?.nome ?? null,
    perfil: String(u?.perfil ?? "").toLowerCase(),
    email: u?.email ?? null,
  };
}

async function getUserById(id: number) {
  const u = await prisma.medicoAgenda.findUnique({
    where: { id },
    select: { id: true, nome: true, perfil: true, email: true },
  });

  return {
    id: u?.id ?? null,
    nome: u?.nome ?? null,
    perfil: String(u?.perfil ?? "").toLowerCase(),
    email: u?.email ?? null,
  };
}

/**
 * GET /api/eventos
 * - Médico: retorna apenas do próprio medicoId
 * - Admin: pode passar ?medicoId=123 para ver de um médico específico, senão retorna todos
 */
export async function GET(req: NextRequest) {
  try {
    const email = await getSessionEmail();
    if (!email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const me = await getUserByEmail(email);
    if (!me.id) return NextResponse.json({ error: "usuario_nao_encontrado" }, { status: 404 });

    const url = new URL(req.url);
    const medicoIdQuery = Number(url.searchParams.get("medicoId") ?? 0);

    let medicoIdFiltro: number | null = null;

    if (me.perfil === "admin") {
      medicoIdFiltro = medicoIdQuery > 0 ? medicoIdQuery : null; // null = todos
    } else {
      medicoIdFiltro = me.id; // médico só vê o dele
    }

    const where = medicoIdFiltro ? { medicoId: medicoIdFiltro } : {};

    const eventos = await prisma.eventoAgenda.findMany({
      where,
      orderBy: [{ data: "asc" }, { id: "asc" }],
      select: { id: true, cidade: true, quantidade: true, data: true, medicoId: true, medicoNome: true },
    });

    const out = eventos.map((e) => ({
      id: String(e.id),
      title: `${e.cidade}: ${e.quantidade} exame(s)`,
      start: dateOnlyFromDate(e.data), // YYYY-MM-DD
      allDay: true,
      extendedProps: {
        cidade: e.cidade,
        quantidade: e.quantidade,
        medicoId: e.medicoId,
        medicoNome: e.medicoNome,
      },
    }));

    return NextResponse.json(out);
  } catch (e: any) {
    console.error(e);
    return NextResponse.json(
      { error: "erro_listar_eventos", details: e?.message ?? String(e) },
      { status: 500 }
    );
  }
}

/**
 * POST /api/eventos
 * Body: { data: "YYYY-MM-DD", cidade: string, quantidade: number, medicoId?: number }
 * - Médico: ignora medicoId do body e usa o próprio
 * - Admin: exige medicoId no body
 */
export async function POST(req: NextRequest) {
  try {
    const email = await getSessionEmail();
    if (!email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const me = await getUserByEmail(email);
    if (!me.id) return NextResponse.json({ error: "usuario_nao_encontrado" }, { status: 404 });

    const body = await req.json().catch(() => ({}));

    const data = String(body?.data ?? "").trim(); // esperado YYYY-MM-DD
    const cidade = String(body?.cidade ?? "").trim();
    const quantidadeNum = Number(body?.quantidade ?? 0);
    const medicoIdBody = Number(body?.medicoId ?? 0);

    if (!isDateOnly(data)) {
      return NextResponse.json({ error: "data_invalida", esperado: "YYYY-MM-DD" }, { status: 400 });
    }
    if (!cidade) return NextResponse.json({ error: "cidade_obrigatoria" }, { status: 400 });
    if (!Number.isFinite(quantidadeNum) || quantidadeNum < 0) {
      return NextResponse.json({ error: "quantidade_invalida" }, { status: 400 });
    }

    let medicoIdFinal = me.id;
    let medicoNomeFinal = me.nome || "";

    if (me.perfil === "admin") {
      if (!medicoIdBody || Number.isNaN(medicoIdBody)) {
        return NextResponse.json({ error: "medicoId_obrigatorio_admin" }, { status: 400 });
      }

      const alvo = await getUserById(medicoIdBody);
      if (!alvo.id) return NextResponse.json({ error: "medico_nao_encontrado" }, { status: 404 });

      medicoIdFinal = alvo.id;
      medicoNomeFinal = alvo.nome || "";
    } else {
      // médico comum: precisa ter nome
      if (!medicoNomeFinal) {
        return NextResponse.json({ error: "medico_sem_nome_no_cadastro" }, { status: 400 });
      }
    }

    const safeDate = toSafeDateFromDateOnly(data);

    const created = await prisma.eventoAgenda.create({
      data: {
        medicoId: medicoIdFinal,
        medicoNome: medicoNomeFinal, // ✅ obrigatório no seu schema
        cidade,
        quantidade: quantidadeNum,
        data: safeDate,
      },
      select: { id: true, cidade: true, quantidade: true, data: true, medicoId: true, medicoNome: true },
    });

    return NextResponse.json({
      id: String(created.id),
      title: `${created.cidade}: ${created.quantidade} exame(s)`,
      start: dateOnlyFromDate(created.data),
      allDay: true,
      extendedProps: {
        cidade: created.cidade,
        quantidade: created.quantidade,
        medicoId: created.medicoId,
        medicoNome: created.medicoNome,
      },
    });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json(
      { error: "erro_criar_evento", details: e?.message ?? String(e) },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/eventos?id=123
 * - Médico: só pode deletar eventos dele
 * - Admin: pode deletar qualquer
 */
export async function DELETE(req: NextRequest) {
  try {
    const email = await getSessionEmail();
    if (!email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const me = await getUserByEmail(email);
    if (!me.id) return NextResponse.json({ error: "usuario_nao_encontrado" }, { status: 404 });

    const url = new URL(req.url);
    const id = Number(url.searchParams.get("id") ?? 0);
    if (!id) return NextResponse.json({ error: "id_obrigatorio" }, { status: 400 });

    const ev = await prisma.eventoAgenda.findUnique({
      where: { id },
      select: { id: true, medicoId: true },
    });
    if (!ev) return NextResponse.json({ error: "nao_encontrado" }, { status: 404 });

    if (me.perfil !== "admin" && ev.medicoId !== me.id) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    await prisma.eventoAgenda.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json(
      { error: "erro_excluir_evento", details: e?.message ?? String(e) },
      { status: 500 }
    );
  }
}
