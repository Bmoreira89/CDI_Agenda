import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const eventos = await prisma.eventoAgenda.findMany({
    orderBy: { data: "asc" },
    include: {
      medico: true
    }
  });

  return NextResponse.json({ eventos });
}
