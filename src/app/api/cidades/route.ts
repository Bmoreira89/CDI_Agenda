export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const email = (req.headers.get("x-user-email") || "").trim().toLowerCase();
  const perfil = (req.headers.get("x-user-perfil") || "").trim().toLowerCase();

  // admin vê tudo
  if (perfil === "admin" || !email) {
    const cidades = await prisma.cidadeAgenda.findMany({
      orderBy: { nome: "asc" },
      select: { id: true, nome: true },
    });
    return NextResponse.json(cidades);
  }

  // medico: filtra por permissões do email
  const permissoes = await prisma.permissaoCidade.findMany({
    where: { email, ativo: true },
    select: { cidadeId: true },
  });

  const ids = permissoes.map((p) => p.cidadeId);

  const cidades = await prisma.cidadeAgenda.findMany({
    where: { id: { in: ids } },
    orderBy: { nome: "asc" },
    select: { id: true, nome: true },
  });

  return NextResponse.json(cidades);
}
