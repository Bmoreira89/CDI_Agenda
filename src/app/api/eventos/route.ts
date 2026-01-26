import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

function normalizeDateOnly(value: string): string {
  if (!value) throw new Error("Data inválida");

  // aceita somente YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error("Formato de data inválido. Use YYYY-MM-DD");
  }

  return value;
}

/**
 * GET /api/eventos
 * Lista eventos do usuário logado
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const eventos = await prisma.evento.findMany({
    where: {
      email: session.user.email,
    },
    orderBy: {
      data: "asc",
    },
  });

  return NextResponse.json(eventos);
}

/**
 * POST /api/eventos
 * Cria lançamento diário (date-only)
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const body = await req.json();
    const { cidade, data, quantidade } = body;

    if (!cidade || !data || !quantidade) {
      return NextResponse.json(
        { error: "Campos obrigatórios ausentes" },
        { status: 400 }
      );
    }

    const dataNormalizada = normalizeDateOnly(data);

    const evento = await prisma.evento.create({
      data: {
        cidade,
        data: dataNormalizada, // ⬅️ STRING PURA
        quantidade: Number(quantidade),
        email: session.user.email,
      },
    });

    return NextResponse.json(evento);
  } catch (err: any) {
    console.error("Erro ao criar evento:", err);
    return NextResponse.json(
      { error: "Erro ao criar evento", details: err.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/eventos?id=123
 */
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID não informado" }, { status: 400 });
  }

  await prisma.evento.delete({
    where: {
      id: Number(id),
    },
  });

  return NextResponse.json({ ok: true });
}
