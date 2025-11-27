// src/app/api/cidades/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/cidades → lista todas as cidades/locais
export async function GET() {
  try {
    const cidades = await prisma.cidadeAgenda.findMany({
      orderBy: { nome: "asc" },
    });

    return NextResponse.json(
      cidades.map((c) => ({
        id: c.id,
        nome: c.nome,
      }))
    );
  } catch (error) {
    console.error("Erro ao listar cidades:", error);
    return NextResponse.json(
      { error: "Erro ao listar cidades" },
      { status: 500 }
    );
  }
}

// POST /api/cidades → cria cidade/local
// body: { nome }
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { nome } = body;

    if (!nome || !nome.trim()) {
      return NextResponse.json(
        { error: "Nome da cidade/local é obrigatório." },
        { status: 400 }
      );
    }

    const cidade = await prisma.cidadeAgenda.create({
      data: {
        nome: nome.trim(),
      },
    });

    return NextResponse.json(
      { id: cidade.id, nome: cidade.nome },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erro ao criar cidade:", error);
    return NextResponse.json(
      { error: "Erro ao criar cidade/local" },
      { status: 500 }
    );
  }
}
