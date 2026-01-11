export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

type SessionUser = {
  id?: number | string;
  perfil?: string | null;
  role?: string | null;
};

function isAdmin(session: any) {
  const user = session?.user as SessionUser | undefined;
  const perfil = user?.perfil ?? user?.role;
  return perfil === "admin" || perfil === "ADMIN";
}

function getUserId(session: any): number | null {
  const user = session?.user as SessionUser | undefined;
  const id = user?.id;
  if (typeof id === "number") return id;
  if (typeof id === "string" && id.trim() !== "" && !Number.isNaN(Number(id))) return Number(id);
  return null;
}

/**
 * GET /api/eventos
 * Opcional: ?start=ISO&end=ISO
 * - Admin: retorna todos
 * - Médico: retorna só os dele
 */
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const startStr = url.searchParams.get("start");
    const endStr = url.searchParams.get("end");

    const where: any = {};

    if (!isAdmin(session)) {
      const userId = getUserId(session);
      if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
      where.medicoId = userId;
    }

    // Se vier período, filtra por data
    if (startStr) where.data = { ...(where.data ?? {}), gte: new Date(startStr) };
    if (endStr) where.data = { ...(where.data ?? {}), lte: new Date(endStr) };

    const eventos = await prisma.eventoAgenda.findMany({
      where,
      orderBy: { data: "asc" },
      include: { medico: { select: { id: true, nome: true, email: true } } },
    });

    return NextResponse.json({ eventos });
  } catch (e: any) {
    return NextResponse.json(
      { error: "internal_error", details: e?.message ?? String(e) },
      { status: 500 }
    );
  }
}

/**
 * POST /api/eventos
 * Body: { data: string(ISO), descricao: string, medicoId?: number }
 * - Admin pode criar para qualquer medicoId
 * - Médico cria apenas para si (ignora medicoId do body)
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const data = body?.data ? new Date(body.data) : null;
    const descricao = typeof body?.descricao === "string" ? body.descricao : "";

    if (!data || Number.isNaN(data.getTime())) {
      return NextResponse.json({ error: "invalid_data" }, { status: 400 });
    }
    if (!descricao.trim()) {
      return NextResponse.json({ error: "invalid_descricao" }, { status: 400 });
    }

    let medicoId: number | null = null;

    if (isAdmin(session)) {
      const raw = body?.medicoId;
      if (typeof raw === "number") medicoId = raw;
      if (typeof raw === "string" && raw.trim() !== "" && !Number.isNaN(Number(raw))) medicoId = Number(raw);
      if (!medicoId) return NextResponse.json({ error: "invalid_medicoId" }, { status: 400 });
    } else {
      medicoId = getUserId(session);
      if (!medicoId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const evento = await prisma.eventoAgenda.create({
      data: { data, descricao, medicoId },
      include: { medico: { select: { id: true, nome: true, email: true } } },
    });

    return NextResponse.json({ evento });
  } catch (e: any) {
    return NextResponse.json(
      { error: "internal_error", details: e?.message ?? String(e) },
      { status: 500 }
    );
  }
}
