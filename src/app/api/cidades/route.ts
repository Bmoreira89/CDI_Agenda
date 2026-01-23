export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

function getAdminToken(req: NextRequest) {
  const h = req.headers;
  return (
    h.get("x-admin-token") ||
    h.get("x-token") ||
    h.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    new URL(req.url).searchParams.get("token") ||
    ""
  ).trim();
}

async function isAdminByToken(req: NextRequest) {
  const expected = (process.env.ADMIN_TOKEN || "").trim();
  const token = getAdminToken(req);
  return !!expected && !!token && token === expected;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const medicoId = Number(searchParams.get("medicoId") ?? 0);

  // ✅ ADMIN via ADMIN_TOKEN → vê tudo
  if (await isAdminByToken(req)) {
    const cidades = await prisma.cidadeAgenda.findMany({
      orderBy: { nome: "asc" },
      select: { id: true, nome: true },
    });
    return NextResponse.json(cidades);
  }

  // Sem medicoId → não autorizado
  if (!medicoId || Number.isNaN(medicoId)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const medico = await prisma.medicoAgenda.findUnique({
    where: { id: medicoId },
    select: { email: true, perfil: true },
  });

  if (!medico) return NextResponse.json([], { status: 200 });

  // Médico admin → vê tudo
  if (String(medico.perfil ?? "").toLowerCase() === "admin") {
    const cidades = await prisma.cidadeAgenda.findMany({
      orderBy: { nome: "asc" },
      select: { id: true, nome: true },
    });
    return NextResponse.json(cidades);
  }

  // Médico comum → só cidades permitidas
  const perms = await prisma.permissaoAgenda.findMany({
    where: { email: medico.email },
    select: { cidade: true },
  });

  const allowed = perms.map((p) => p.cidade);

  const cidades = await prisma.cidadeAgenda.findMany({
    where: {
      nome: { in: allowed.length ? allowed : ["__sem_permissao__"] },
    },
    orderBy: { nome: "asc" },
    select: { id: true, nome: true },
  });

  return NextResponse.json(cidades);
}
