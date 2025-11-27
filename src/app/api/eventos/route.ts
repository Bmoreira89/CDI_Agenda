import { NextResponse } from "next/server";
import prisma from "@/src/lib/prisma";
import { registrarLog } from "@/src/lib/log";

// GET – listar eventos
export async function GET() {
  try {
    const eventos = await prisma.eventoAgenda.findMany({
      include: { cidade: true, medico: true },
    });

    return NextResponse.json(eventos);
  } catch (err) {
    return NextResponse.json(
      { error: "Erro ao carregar eventos" },
      { status: 500 }
    );
  }
}

// POST – criar evento
export async function POST(req: Request) {
  try {
    const { medicoId, cidadeId, data, quantidade } = await req.json();

    const evento = await prisma.eventoAgenda.create({
      data: {
        medicoId,
        cidadeId,
        data,
        quantidade,
      },
    });

    await registrarLog(
      medicoId,
      "criar_evento",
      `Data: ${data}, Local ID: ${cidadeId}, Quantidade: ${quantidade}`
    );

    return NextResponse.json(evento, { status: 201 });
  } catch (err) {
    console.error("Erro ao criar evento:", err);
    return NextResponse.json(
      { error: "Erro ao criar evento" },
      { status: 500 }
    );
  }
}

// DELETE – remover evento
export async function DELETE(req: Request) {
  try {
    const { id, userId } = await req.json();

    await prisma.eventoAgenda.delete({
      where: { id },
    });

    await registrarLog(userId, "remover_evento", `Evento removido (ID ${id})`);

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: "Erro ao remover evento" },
      { status: 500 }
    );
  }
}
