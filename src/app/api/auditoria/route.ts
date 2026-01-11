export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

import { NextResponse } from "next/server";

function isBuild() {
  return process.env.NEXT_PHASE === "phase-production-build";
}

async function deps() {
  const [authMod, nextAuthMod, prismaMod] = await Promise.all([
    import("@/lib/auth"),
    import("next-auth"),
    import("@/lib/prisma"),
  ]);

  return {
    authOptions: authMod.authOptions,
    getServerSession: nextAuthMod.getServerSession,
    prisma: prismaMod.default ?? prismaMod.prisma,
  };
}

export async function GET() {
  if (isBuild()) return NextResponse.json({ ok: true });

  const { authOptions, getServerSession, prisma } = await deps();
  const session = await getServerSession(authOptions);

  if (!session?.user || (session.user.perfil ?? session.user.role) !== "admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const logs = await prisma.logAcao.findMany({
    orderBy: { dataHora: "desc" },
    take: 200,
    include: {
      usuario: { select: { nome: true, email: true } },
    },
  });

  return NextResponse.json({ logs });
}
