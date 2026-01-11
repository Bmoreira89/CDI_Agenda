export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

import { NextResponse } from "next/server";

function isBuildPhase() {
  return process.env.NEXT_PHASE === "phase-production-build";
}

async function getDeps() {
  const [prismaMod, logMod, bcryptMod] = await Promise.all([
    import("@/lib/prisma"),
    import("@/lib/log"),
    import("bcryptjs"),
  ]);

  const prisma: any = (prismaMod as any).default ?? (prismaMod as any).prisma;
  const registrarLog: any =
    (logMod as any).registrarLog ?? (logMod as any).default ?? undefined;

  const bcrypt: any = (bcryptMod as any).default ?? bcryptMod;

  return { prisma, registrarLog, bcrypt };
}

// Mantive seu contrato atual: PUT { id, novaSenha }
export async function PUT(req: Request) {
  try {
    // evita quebrar no build da Vercel (collect page data)
    if (isBuildPhase()) return NextResponse.json({ ok: true, build: true });

    const { prisma, registrarLog, bcrypt } = await getDeps();

    const body = await req.json().catch(() => ({}));
    const idRaw = body?.id;
    const novaSenha = typeof body?.novaSenha === "string" ? body.novaSenha : "";

    const id = typeof idRaw === "number" ? idRaw : Number(idRaw);
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: "id_invalido" }, { status: 400 });
    }

    if (!novaSenha || novaSenha.length < 6) {
      return NextResponse.json({ error: "senha_invalida" }, { status: 400 });
    }

    const senhaHash = await bcrypt.hash(novaSenha, 10);

    const medico = await prisma.medicoAgenda.update({
      where: { id },
      data: { senha: senhaHash },
      select: { id: true, email: true },
    });

    // Log é opcional: se por algum motivo não existir, não derruba a rota
    if (typeof registrarLog === "function") {
      await registrarLog({
        usuarioId: medico.id,
        acao: "senha_redefinida",
        detalhes: `Senha redefinida para ${medico.email}`,
      });
    }

    return NextResponse.json({ sucesso: true });
  } catch (error: any) {
    console.error("Erro ao redefinir senha:", error);
    return NextResponse.json(
      { message: "Erro ao redefinir senha", details: error?.message ?? String(error) },
      { status: 500 }
    );
  }
}

// Opcional: healthcheck
export async function GET() {
  try {
    if (isBuildPhase()) return NextResponse.json({ ok: true, build: true });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
