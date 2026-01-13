export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

type SessionUser = {
  id?: string | number;
  role?: "ADMIN" | "MEDICO" | string;
  perfil?: string | null;
};

function isAdmin(session: any) {
  const user = session?.user as SessionUser | undefined;
  const role = (user?.perfil ?? user?.role ?? "").toString();
  return role.toUpperCase() === "ADMIN" || role.toLowerCase() === "admin";
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
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const medicoIdParam = searchParams.get("medicoId");

    const admin = isAdmin(session);
    const meId = getUserId(session);

    // Admin pode exportar tudo ou filtrar por medicoId
    // Médico comum só exporta seus próprios
    let medicoId: number | null = null;
    if (medicoIdParam && !Number.isNaN(Number(medicoIdParam))) {
      medicoId = Number(medicoIdParam);
    }

    if (!admin) {
      if (!meId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
      medicoId = meId;
    }

    const where: any = {};
    if (medicoId) where.medicoId = medicoId;

    const eventos = await prisma.eventoAgenda.findMany({
      where,
      orderBy: { data: "asc" },
      include: {
        medico: { select: { id: true, nome: true, email: true } },
      },
    });

    return NextResponse.json({ eventos });
  } catch (e: any) {
    return NextResponse.json(
      { error: "internal_error", details: e?.message ?? String(e) },
      { status: 500 }
    );
  }
}
