// src/app/api/auditoria/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const logs = await prisma.logAcao.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(logs);
  } catch (error) {
    console.error("Erro ao buscar logs:", error);
    return NextResponse.json(
      { message: "Erro ao buscar logs" },
      { status: 500 }
    );
  }
}
