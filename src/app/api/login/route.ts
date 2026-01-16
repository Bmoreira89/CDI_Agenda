// src/app/api/login/route.ts
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

import { NextResponse } from "next/server";

function isBuild() {
  // Durante o build da Vercel o Next pode tentar â€œexecutarâ€ coisas para coletar dados
  return process.env.NEXT_PHASE === "phase-production-build";
}

type Body = {
  email?: string;
  senha?: string;
};

export async function POST(req: Request) {
  try {
    if (isBuild()) {
      // evita quebrar o build por tentativa de acessar DB/NextAuth durante collect page data
      return NextResponse.json({ ok: true, build: true });
    }

    const { email, senha } = (await req.json()) as Body;

    if (!email || !senha) {
      return NextResponse.json(
        { ok: false, error: "email_e_senha_obrigatorios" },
        { status: 400 }
      );
    }

    const [{ default: prisma }, bcrypt] = await Promise.all([
      import("@/lib/prisma"),
      import("bcryptjs"),
    ]);

    const medico = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      select: {
        id: true,
        nome: true,
        email: true,
        senha: true,
        perfil: true,
      },
    });

    if (!medico?.senha) {
      return NextResponse.json({ ok: false, error: "credenciais_invalidas" }, { status: 401 });
    }

    const ok = await bcrypt.compare(senha, medico.senha);
    if (!ok) {
      return NextResponse.json({ ok: false, error: "credenciais_invalidas" }, { status: 401 });
    }

    // padroniza role para o que o NextAuth costuma usar
    const role =
      (medico.perfil || "").toLowerCase() === "admin" ? "ADMIN" : "MEDICO";

    return NextResponse.json({
      ok: true,
      user: {
        id: medico.id,
        name: medico.nome,
        email: medico.email,
        role,
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: "internal_error", details: e?.message ?? String(e) },
      { status: 500 }
    );
  }
}

