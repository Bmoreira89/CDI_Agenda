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
    authOptions: (authMod as any).authOptions,
    getServerSession: (nextAuthMod as any).getServerSession,
    prisma: (prismaMod as any).default ?? (prismaMod as any).prisma,
  };
}

export async function GET() {
  if (isBuild()) return NextResponse.json({ ok: true });

  const { authOptions, getServerSession, prisma } = await deps();
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const logs = await prisma.logAcao.findMany({
    orderBy: { dataHora: "desc" },
    take: 200,
    include: { usuario: { select: { nome: true, email: true } } },
  });

  return NextResponse.json({ logs });
}
