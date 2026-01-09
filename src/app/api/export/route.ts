
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

function isAdmin(session: any) {
  return (
    session?.user?.perfil === "admin" ||
    session?.user?.role === "ADMIN" ||
    session?.user?.isAdmin === true
  );
}

/**
 * Exporta eventos (JSON).
 * Se for admin: exporta de todos.
 * Se não for admin: exporta apenas do médico logado.
 *
 * Query params opcionais:
 *  - from: ISO date (ex: 2026-01-01)
 *  - to:   ISO date (ex: 2026-01-31)
 */
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where: any = {};

  // Filtro por intervalo (opcional)
  if (from) {
    const d = new Date(from);
    if (!isNaN(d.getTime())) {
      where.data = { ...(where.data ?? {}), gte: d };
    }
  }

  if (to) {
    const d = new Date(to);
    if (!isNaN(d.getTime())) {
      where.data = { ...(where.data ?? {}), lte: d };
    }
  }

  // Se não for admin, limita ao médico logado
  if (!isAdmin(session)) {
    where.medicoId = Number(session.user.id);
  }

  const eventos = await prisma.eventoAgenda.findMany({
    where,
    orderBy: [{ data: "asc" }],
    include: {
      medico: {
        select: { id: true, nome: true, email: true, crm: true, perfil: true }
      }
    }
  });

  return NextResponse.json({ eventos });
}
