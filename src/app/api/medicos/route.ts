import { NextResponse } from "next/server";
import prisma from "@/src/lib/prisma";
import bcrypt from "bcryptjs";
import { registrarLog } from "@/src/lib/log";

export async function GET() {
  const medicos = await prisma.medicoAgenda.findMany({
    orderBy: { nome: "asc" },
  });

  return NextResponse.json(medicos);
}

export async function POST(req: Request) {
  try {
    const { nome, crm, email, senha, perfil } = await req.json();

    const senhaHash = await bcrypt.hash(senha, 10);

    const medico = await prisma.medicoAgenda.create({
      data: {
        nome,
        crm,
        email,
        senha: senhaHash,
        perfil: perfil.toLowerCase(),
      },
    });

    // log
    await registrarLog(
      0,
      "criar_medico",
      `Criado médico ${nome} (${email}), perfil: ${perfil}`
    );

    return NextResponse.json(medico, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar médico:", error);
    return NextResponse.json(
      { error: "Erro ao criar médico" },
      { status: 500 }
    );
  }
}
