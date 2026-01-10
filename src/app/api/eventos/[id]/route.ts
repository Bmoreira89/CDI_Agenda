export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * IMPORTANTE:
 * Evita que o Next tente coletar dados dessa rota no build
 */
export async function generateStaticParams() {
  return [];
}

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
  if (typeof id === "string" && !Number.isNaN(Number(id))) return Number(id);
  return null;
}

function parseId(id: string): number | null {
  const n = Number(id);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const id = parseId(params.id);
  if (!id) {
    return NextResponse.json({ error: "invalid_id" }, { status: 400 });
  }

  const evento = await prisma.eventoAgenda.findUnique({
    where: { id },
    include: { medico: { select: { id: true, nome: true, email: true } } },
  });

  if (!evento) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  if (!isAdmin(session)) {
    const userId = getUserId(session);
    if (!userId || evento.medicoId !== userId) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
  }

  return NextResponse.json({ evento });
}
