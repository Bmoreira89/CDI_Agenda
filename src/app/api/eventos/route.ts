// src/app/api/eventos/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { registrarLog } from "@/lib/log";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const medicoId = searchParams.get("medicoId");
    const cidadeId = searchParams.get("cidadeId");
    const mesAno = searchParams.get("mesAno");

    const where: any = {};

    if (medicoId) where.medicoId = Number(medicoId);
    if (cidadeId) where.cidadeId = Number(cidadeId);
    if (mesAno) {
      const [ano, mes] = mesAno.split("-").map(Number);
      const inicio = new Date(ano, mes - 1, 1);
      const fim = new Date(ano, mes, 0, 23, 59, 59);
      where.data = { gte: inicio, lte: fim };
    }

    const eventos = await prisma.eventoAgenda.findMany({
      where,
      orderBy: { data: "asc" },
      include: {
        cidade: true,
        medico: true,
      },
    });

    const resultado = eventos.map((e) => ({
      id: e.id,
      title: `${e.cidade?.nome ?? ""}${
        e.qtd ? ` - ${e.qtd} exames` : ""
      }${e.medico?.nome ? ` (${e.medico.nome})` : ""}`,
      start: e.data,
      extendedProps: {
        quantidade: e.qtd,
        cidadeId: e.cidadeId,
        medicoId: e.medicoId,
      },
    }));

    return NextResponse.json(resultado);
  } catch (error) {
    console.error("Erro ao listar eventos:", error);
    return NextResponse.json(
      { message: "Erro ao listar eventos" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { data, cidadeId, medicoId, quantidade } = await req.json();

    const evento = await prisma.eventoAgenda.create({
      data: {
        data: new Date(data),
        cidadeId,
        medicoId,
        qtd: quantidade,
      },
    });

    await registrarLog({
      usuarioId: medicoId ?? null,
      acao: "evento_criado",
      detalhes: `Evento ${evento.id} criado`,
    });

    return NextResponse.json(evento, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar evento:", error);
    return NextResponse.json(
      { message: "Erro ao criar evento" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const idParam = searchParams.get("id");

    if (!idParam) {
      return NextResponse.json(
        { message: "ID é obrigatório" },
        { status: 400 }
      );
    }

    const id = Number(idParam);

    const evento = await prisma.eventoAgenda.delete({
      where: { id },
    });

    await registrarLog({
      usuarioId: evento.medicoId ?? null,
      acao: "evento_excluido",
      detalhes: `Evento ${evento.id} excluído`,
    });

    return NextResponse.json({ sucesso: true });
  } catch (error) {
    console.error("Erro ao excluir evento:", error);
    return NextResponse.json(
      { message: "Erro ao excluir evento" },
      { status: 500 }
    );
  }
}
