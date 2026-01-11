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

  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const eventos = await prisma.eventoAgenda.findMany({
    orderBy: { data: "asc" },
    include: {
      medico: { select: { nome: true, email: true } },
    },
  });

  return NextResponse.json({ eventos });
}
