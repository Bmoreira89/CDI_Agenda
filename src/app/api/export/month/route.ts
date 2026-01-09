import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * Exporta eventos por mês (JSON).
 * Query params:
 *  - year: 2026
 *  - month: 1..12
 * Opcional:
 *  - medicoId: id do médico (se não enviar, exporta de todos)
 */
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);

  const year = Number(searchParams.get("year"));
  const month = Number(searchParams.get("month")); // 1..12
  const medicoIdParam = searchParams.get("medicoId");

  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
    return NextResponse.json(
      { error: "Parâmetros inválidos. Use year=2026&month=1..12" },
      { status: 400 }
    );
  }

  const month0 = month - 1;
  const start = new Date(year, month0, 1, 0, 0, 0, 0);
  const end = new Date(year, month0 + 1, 1, 0, 0, 0, 0); // exclusivo

  const where: any = {
    data: { gte: start, lt: end }
  };

  if (medicoIdParam && medicoIdParam.trim() !== "") {
    const medicoId = Number(medicoIdParam);
    if (!Number.isFinite(medicoId)) {
      return NextResponse.json({ error: "medicoId inválido" }, { status: 400 });
    }
    where.medicoId = medicoId;
  }

  const eventos = await prisma.eventoAgenda.findMany({
    where,
    orderBy: [{ data: "asc" }],
    include: {
      medico: true
    }
  });

  return NextResponse.json({ eventos });
}
