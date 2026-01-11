export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

import { NextResponse } from "next/server";

type SessionUser = {
  id?: number | string;
  perfil?: string | null;
  role?: string | null;
};

function isBuildPhase() {
  return process.env.NEXT_PHASE === "phase-production-build";
}

function isAdmin(session: any) {
  const user = session?.user as SessionUser | undefined;
  const perfil = user?.perfil ?? user?.role;
  return perfil === "admin" || perfil === "ADMIN";
}

function getUserId(session: any): number | null {
  const id = (session?.user as SessionUser | undefined)?.id;
  if (typeof id === "number") return id;
  if (typeof id === "string" && id.trim() !== "" && !Number.isNaN(Number(id))) return Number(id);
  return null;
}

async function getDeps() {
  const [{ getServerSession }, authMod, prismaMod] = await Promise.all([
    import("next-auth"),
    import("@/lib/auth"),
    import("@/lib/prisma"),
  ]);

  const prisma: any = (prismaMod as any).default ?? (prismaMod as any).prisma;
  const authOptions: any = (authMod as any).authOptions ?? (authMod as any).default ?? authMod;

  return { prisma, getServerSession, authOptions };
}

/**
 * GET /api/eventos/export?month=MM&year=YYYY
 * - Admin: exporta tudo
 * - Médico: exporta só os próprios eventos
 */
export async function GET(req: Request) {
  try {
    // impede quebra no build da Vercel
    if (isBuildPhase()) return NextResponse.json({ ok: true, build: true });

    const { prisma, getServerSession, authOptions } = await getDeps();

    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const monthStr = url.searchParams.get("month") || "";
    const yearStr = url.searchParams.get("year") || "";

    const month = Number(monthStr);
    const year = Number(yearStr);

    if (!Number.isInteger(month) || month < 1 || month > 12) {
      return NextResponse.json({ error: "invalid_month" }, { status: 400 });
    }
    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      return NextResponse.json({ error: "invalid_year" }, { status: 400 });
    }

    const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const end = new Date(year, month, 0, 23, 59, 59, 999);

    const where: any = {
      data: { gte: start, lte: end },
    };

    if (!isAdmin(session)) {
      const userId = getUserId(session);
      if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
      where.medicoId = userId;
    }

    const eventos = await prisma.eventoAgenda.findMany({
      where,
      orderBy: { data: "asc" },
      include: { medico: { select: { id: true, nome: true, email: true } } },
    });

    // Retorna JSON (simples e compatível). Se você quiser Excel depois, a gente troca para exceljs.
    return NextResponse.json({
      month,
      year,
      total: eventos.length,
      eventos,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: "internal_error", details: e?.message ?? String(e) },
      { status: 500 }
    );
  }
}
