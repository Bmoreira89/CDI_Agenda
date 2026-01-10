export const dynamic = "force-dynamic";

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
  if (typeof id === "string" && id.trim() !== "" && !Number.isNaN(Number(id))) {
    return Number(id);
  }
  return null;
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const year = Number(searchParams.get("year"));
  const month = Number(searchParams.get("month")); // 1-12

  if (!year || !month) {
    return NextResponse.json(
      { error: "year e month são obrigatórios" },
      { status: 400 }
    );
  }

  const start = new Date(year, month - 1, 1, 0, 0, 0);
  const end = new Date(year, month, 0, 23, 59, 59, 999);

  const admin = isAdmin(session);

  const where: any = {
    data: { gte: start, lte: end },
  };

  if (!admin) {
    const userId = getUserId(session);
    if (!userId) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    where.medicoId = userId;
  }

  const eventos = await prisma.eventoAgenda.findMany({
    where,
    orderBy: { data: "asc" },
    include: {
      medico: {
        select: { nome: true, email: true },
      },
    },
  });

  return NextResponse.json({ eventos });
}
