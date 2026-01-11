export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

import { NextResponse } from "next/server";

function isBuild() {
  return process.env.NEXT_PHASE === "phase-production-build";
}

async function deps() {
  const prismaMod = await import("@/lib/prisma");
  return { prisma: prismaMod.default ?? prismaMod.prisma };
}

export async function GET(req: Request) {
  if (isBuild()) return NextResponse.json({ ok: true });

  const { prisma } = await deps();
  const { searchParams } = new URL(req.url);
  const month = Number(searchParams.get("month"));
  const year = Number(searchParams.get("year"));

  if (!month || !year) {
    return NextResponse.json({ error: "params_invalidos" }, { status: 400 });
  }

  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59);

  const eventos = await prisma.eventoAgenda.findMany({
    where: { data: { gte: start, lte: end } },
    orderBy: { data: "asc" },
  });

  return NextResponse.json({ eventos });
}
