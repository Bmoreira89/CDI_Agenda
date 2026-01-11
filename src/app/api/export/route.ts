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

export async function GET() {
  if (isBuild()) return NextResponse.json({ ok: true });

  const { prisma } = await deps();
  const eventos = await prisma.eventoAgenda.findMany();

  return NextResponse.json({ eventos });
}
