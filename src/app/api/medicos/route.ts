export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  const medicos = await prisma.medicoAgenda.findMany({
    orderBy: { nome: "asc" },
    select: { id: true, nome: true, perfil: true },
  });
  return NextResponse.json(medicos);
}
