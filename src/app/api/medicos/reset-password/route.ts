// src/app/api/medicos/reset-password/route.ts
import { NextResponse } from "next/server";

// evita Prisma “cached client” em serverless + melhora compatibilidade em build
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Body = {
  id?: number;
  novaSenha?: string;
};

export async function PUT(req: Request) {
  try {
    // Proteção simples por token
    const token = req.headers.get("x-reset-token");
    if (!process.env.RESET_PASSWORD_TOKEN || token !== process.env.RESET_PASSWORD_TOKEN) {
      return NextResponse.json({ message: "forbidden" }, { status: 403 });
    }

    const body = (await req.json()) as Body;

    const id = Number(body?.id);
    const novaSenha = (body?.novaSenha ?? "").trim();

    if (!id || !Number.isFinite(id)) {
      return NextResponse.json({ message: "id inválido" }, { status: 400 });
    }
    if (novaSenha.length < 8) {
      return NextResponse.json({ message: "senha muito curta (min 8)" }, { status: 400 });
    }

    const [{ default: prisma }, bcrypt] = await Promise.all([
      import("@/lib/prisma"),
      import("bcryptjs"),
    ]);

    const medico = await prisma.medicoAgenda.findUnique({ where: { id } });
    if (!medico) {
      return NextResponse.json({ message: "médico não encontrado" }, { status: 404 });
    }

    const senhaHash = await bcrypt.hash(novaSenha, 10);

    await prisma.medicoAgenda.update({
      where: { id },
      data: { senha: senhaHash },
    });

    return NextResponse.json({ sucesso: true });
  } catch (err: any) {
    return NextResponse.json(
      { message: "Erro ao redefinir senha", details: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}
