export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

import { NextResponse } from "next/server";

function isBuildPhase() {
  return process.env.NEXT_PHASE === "phase-production-build";
}

async function getDeps() {
  // tudo dinâmico para não quebrar no build da Vercel
  const [bcryptMod, prismaMod] = await Promise.all([
    import("bcryptjs"),
    import("@/lib/prisma"),
  ]);

  const prisma: any = (prismaMod as any).default ?? (prismaMod as any).prisma;
  const bcrypt: any = (bcryptMod as any).default ?? bcryptMod;

  return { prisma, bcrypt };
}

function badRequest(msg: string) {
  return NextResponse.json({ error: msg }, { status: 400 });
}

// POST /api/login
// body: { email: string, senha: string }
// Valida credenciais (login “manual” usado pelo seu frontend)
export async function POST(req: Request) {
  try {
    if (isBuildPhase()) return NextResponse.json({ ok: true, build: true });

    const { prisma, bcrypt } = await getDeps();

    const body = await req.json().catch(() => ({}));
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const senha = typeof body?.senha === "string" ? body.senha : "";

    if (!email) return badRequest("email_obrigatorio");
    if (!senha) return badRequest("senha_obrigatoria");

    // Ajuste aqui caso seu model seja MedicoAgenda (como no seu schema)
    const user = await prisma.medicoAgenda.findUnique({
      where: { email },
      select: {
        id: true,
        nome: true,
        email: true,
        senha: true,
        perfil: true,
      },
    });

    if (!user || !user.senha) {
      return NextResponse.json({ error: "credenciais_invalidas" }, { status: 401 });
    }

    const ok = await bcrypt.compare(senha, user.senha);
    if (!ok) {
      return NextResponse.json({ error: "credenciais_invalidas" }, { status: 401 });
    }

    // Retorna dados básicos (o NextAuth normalmente cuida de sessão;
    // aqui é só para o seu fluxo antigo de login)
    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        perfil: user.perfil,
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: "internal_error", details: e?.message ?? String(e) },
      { status: 500 }
    );
  }
}

// (Opcional) GET só para healthcheck
export async function GET() {
  try {
    if (isBuildPhase()) return NextResponse.json({ ok: true, build: true });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: "internal_error", details: e?.message ?? String(e) },
      { status: 500 }
    );
  }
}
