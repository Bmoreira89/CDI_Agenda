export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const year = Number(searchParams.get("year"));
  const month = Number(searchParams.get("month")); // 1–12

  if (!year || !month) {
    return NextResponse.json(
      { error: "year e month são obrigatórios" },
      { status: 400 }
    );
  }

  const start = new Date(year, month - 1, 1, 0, 0, 0);
  const end = new Date(year, month, 0, 23, 59, 59, 999);

  const isAdmin = session.user.perfil === "admin";

  const eventos = await prisma.eventoAgenda.findMany({
    where: {
      data: {
        gte: start,
        lte: end,
      },
      ...(isAdmin ? {} : { medicoId: session.user.id }),
    },
    orderBy: { data: "asc" },
    include: {
      medico: {
        select: {
          nome: true,
          email: true,
        },
      },
    },
  });

  return NextResponse.json({ eventos });
}
