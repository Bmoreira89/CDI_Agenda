export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.perfil !== "admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const logs = await prisma.logAcao.findMany({
    orderBy: { dataHora: "desc" },
    take: 200,
    include: {
      usuario: {
        select: {
          nome: true,
          email: true,
        },
      },
    },
  });

  return NextResponse.json({ logs });
}
