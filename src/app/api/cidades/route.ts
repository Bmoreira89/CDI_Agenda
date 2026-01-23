export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const medicoId = Number(searchParams.get("medicoId") ?? 0);

  // Se não passar medicoId, retorna tudo (ex.: admin / telas internas)
  if (!medicoId || Number.isNaN(medicoId)) {
    const cidades = await prisma.cidadeAgenda.findMany({
      orderBy: { nome: "asc" },
      select: { id: true, nome: true },
    });
    return NextResponse.json(cidades);
  }

  const medico = await prisma.medicoAgenda.findUnique({
    where: { id: medicoId },
    select: { email: true, perfil: true },
  });

  if (!medico) return NextResponse.json([], { status: 200 });

  // Admin vê tudo
  if (String(medico.perfil ?? "").toLowerCase() === "admin") {
    const cidades = await prisma.cidadeAgenda.findMany({
      orderBy: { nome: "asc" },
      select: { id: true, nome: true },
    });
    return NextResponse.json(cidades);
  }

  // Médico: apenas locais permitidos
  const perms = await prisma.permissaoAgenda.findMany({
    where: { email: medico.email },
    select: { cidade: true },
  });

  const allowed = perms.map((p) => p.cidade);

  const cidades = await prisma.cidadeAgenda.findMany({
    where: { nome: { in: allowed.length ? allowed : ["__sem_permissao__"] } },
    orderBy: { nome: "asc" },
    select: { id: true, nome: true },
  });

  return NextResponse.json(cidades);
}
