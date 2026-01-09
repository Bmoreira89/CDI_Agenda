// src/app/api/medicos/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { registrarLog } from "@/lib/log";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const medicos = await prisma.medicoAgenda.findMany({
      orderBy: { nome: "asc" },
    });
    return NextResponse.json(medicos);
  } catch (error) {
    console.error("Erro ao listar médicos:", error);
    return NextResponse.json(
      { message: "Erro ao listar médicos" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { nome, crm, email, senha, perfil } = await req.json();

    const senhaHash = await bcrypt.hash(senha || "123456", 10);

    const medico = await prisma.medicoAgenda.create({
      data: {
        nome,
        crm,
        email,
        senha: senhaHash,
        perfil: perfil === "admin" ? "admin" : "medico",
      },
    });

    await registrarLog({
      usuarioId: medico.id,
      acao: "medico_criado",
      detalhes: `Médico ${nome} (${email}) criado com perfil ${medico.perfil}`,
    });

    return NextResponse.json(medico, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar médico:", error);
    return NextResponse.json(
      { message: "Erro ao criar médico" },
      { status: 500 }
    );
  }
}
