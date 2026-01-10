export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const cidades = await prisma.cidadeAgenda.findMany({
      orderBy: { nome: "asc" },
      select: { id: true, nome: true },
    });

    return NextResponse.json({ cidades });
  } catch (e: any) {
    return NextResponse.json(
      { error: "internal_error", details: e?.message ?? String(e) },
      { status: 500 }
    );
  }
}
