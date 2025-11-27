import { NextResponse } from "next/server";
import prisma from "@/src/lib/prisma";
import bcrypt from "bcryptjs";
import { registrarLog } from "@/src/lib/log";

export async function POST(req: Request) {
  try {
    const { email, senha } = await req.json();

    const user = await prisma.medicoAgenda.findUnique({
      where: { email },
    });

    if (!user) {
      // log de tentativa de login com e-mail inexistente
      await registrarLog(0, "login_falhou", `Email não encontrado: ${email}`);
      return NextResponse.json(
        { error: "Usuário ou senha inválidos" },
        { status: 401 }
      );
    }

    const senhaValida = await bcrypt.compare(senha, user.senha!);

    if (!senhaValida) {
      await registrarLog(user.id, "login_falhou", "Senha incorreta");
      return NextResponse.json(
        { error: "Usuário ou senha inválidos" },
        { status: 401 }
      );
    }

    await registrarLog(user.id, "login", "Login efetuado com sucesso");

    return NextResponse.json({
      id: user.id,
      nome: user.nome,
      email: user.email,
      perfil: user.perfil,
    });
  } catch (error) {
    console.error("Erro no login:", error);
    return NextResponse.json(
      { error: "Erro interno no login" },
      { status: 500 }
    );
  }
}
