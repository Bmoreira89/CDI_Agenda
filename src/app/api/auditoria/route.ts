import { NextResponse } from "next/server";
import prisma from "@/src/lib/prisma";

export async function GET() {
  try {
    const logs = await prisma.logAcao.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        usuario: true,
      },
    });

    return NextResponse.json({ logs });
  } catch (err) {
    return NextResponse.json({ error: "Erro ao carregar logs" }, { status: 500 });
  }
}
