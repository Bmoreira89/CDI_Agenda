export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

import { NextResponse } from "next/server";

function isBuildPhase() {
  return process.env.NEXT_PHASE === "phase-production-build";
}

type SessionUser = {
  id?: number | string;
  perfil?: string | null;
  role?: string | null;
  email?: string | null;
  name?: string | null;
};

function getUserId(session: any): number | null {
  const u = session?.user as SessionUser | undefined;
  const raw = u?.id;
  if (typeof raw === "number") return raw;
  if (typeof raw === "string" && raw.trim() !== "" && !Number.isNaN(Number(raw))) return Number(raw);
  return null;
}

function isAdmin(session: any): boolean {
  const u = session?.user as SessionUser | undefined;
  const perfil = (u?.perfil ?? u?.role ?? "").toString().toUpperCase();
  return perfil === "ADMIN";
}

async function getDeps() {
  const [authMod, nextAuthMod, prismaMod, bcryptMod] = await Promise.all([
    import("@/lib/auth"),
    import("next-auth"),
    import("@/lib/prisma"),
    import("bcryptjs"),
  ]);

  const authOptions = (authMod as any).authOptions ?? (authMod as any).default;
  const getServerSession = (nextAuthMod as any).getServerSession;

  const prisma: any = (prismaMod as any).default ?? (prismaMod as any).prisma;
  const bcrypt: any = (bcryptMod as any).default ?? bcryptMod;

  return { authOptions, getServerSession, prisma, bcrypt };
}

/**
 * GET /api/medicos
 * - Admin: lista todos
 * - NÃ£o-admin: retorna apenas o prÃ³prio usuÃ¡rio
 */
export async function GET() {
  try {
    if (isBuildPhase()) return NextResponse.json({ ok: true, build: true });

    const { authOptions, getServerSession, prisma } = await getDeps();
    const session = await getServerSession(authOptions);

    if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const admin = isAdmin(session);
    const userId = getUserId(session);

    if (!admin && !userId) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const medicos = await prisma.user.findMany({
      where: admin ? undefined : { id: userId },
      orderBy: { nome: "asc" },
      select: {
        id: true,
        nome: true,
        crm: true,
        email: true,
        perfil: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ medicos });
  } catch (e: any) {
    return NextResponse.json(
      { error: "internal_error", details: e?.message ?? String(e) },
      { status: 500 }
    );
  }
}

/**
 * POST /api/medicos
 * Cria mÃ©dico (admin only)
 * Body: { nome, email, crm?, perfil?, senha? }
 */
export async function POST(req: Request) {
  try {
    if (isBuildPhase()) return NextResponse.json({ ok: true, build: true });

    const { authOptions, getServerSession, prisma, bcrypt } = await getDeps();
    const session = await getServerSession(authOptions);

    if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    if (!isAdmin(session)) return NextResponse.json({ error: "forbidden" }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const nome = typeof body?.nome === "string" ? body.nome.trim() : "";
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const crm = typeof body?.crm === "string" ? body.crm.trim() : null;
    const perfil = typeof body?.perfil === "string" ? body.perfil : "medico";
    const senha = typeof body?.senha === "string" ? body.senha : null;

    if (!nome) return NextResponse.json({ error: "nome_obrigatorio" }, { status: 400 });
    if (!email || !email.includes("@")) return NextResponse.json({ error: "email_invalido" }, { status: 400 });

    let senhaHash: string | null = null;
    if (senha && senha.length >= 6) {
      senhaHash = await bcrypt.hash(senha, 10);
    }

    const medico = await prisma.user.create({
      data: {
        nome,
        email,
        crm,
        perfil,
        senha: senhaHash,
      },
      select: {
        id: true,
        nome: true,
        email: true,
        crm: true,
        perfil: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ medico }, { status: 201 });
  } catch (e: any) {
    // Prisma duplicate email costuma vir como erro conhecido, mas aqui a gente sÃ³ retorna mensagem segura
    return NextResponse.json(
      { error: "internal_error", details: e?.message ?? String(e) },
      { status: 500 }
    );
  }
}

