export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const isAdmin = session.user.perfil === "admin";

  const eventos = await prisma.eventoAgenda.findMany({
    orderBy: { data: "asc" },
    include: {
      medico: {
        select: {
          nome: true,
          email: true,
        },
      },
    },
    where: isAdmin
      ? {}
      : {
          medicoId: session.user.id,
        },
  });

  return NextResponse.json({ eventos });
}
