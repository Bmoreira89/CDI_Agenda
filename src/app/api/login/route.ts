// src/app/api/login/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { registrarLog } from "@/lib/log";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { email, senha } = await req.json();

    const medico = await prisma.medicoAgenda.findUnique({
      where: { email },
    });

    if (!medico || !medico.senha) {
      await registrarLog({
        usuarioId: medico?.id ?? null,
        acao: "login_falha",
        detalhes: `Login falhou para ${email}`,
      });

      return NextResponse.json(
        { message: "Usuário ou senha inválidos" },
        { status: 401 }
      );
    }

    const senhaConfere = await bcrypt.compare(senha, medico.senha);

    if (!senhaConfere) {
      await registrarLog({
        usuarioId: medico.id,
        acao: "login_falha",
        detalhes: `Senha incorreta para ${email}`,
      });

      return NextResponse.json(
        { message: "Usuário ou senha inválidos" },
        { status: 401 }
      );
    }

    await registrarLog({
      usuarioId: medico.id,
      acao: "login_sucesso",
      detalhes: `Login bem-sucedido para ${email}`,
    });

    return NextResponse.json({
      id: medico.id,
      nome: medico.nome,
      email: medico.email,
      perfil: medico.perfil,
    });
  } catch (error) {
    console.error("Erro no login:", error);
    return NextResponse.json(
      { message: "Erro ao realizar login" },
      { status: 500 }
    );
  }
}
