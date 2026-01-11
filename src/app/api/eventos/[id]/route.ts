export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

import { NextResponse } from "next/server";

type SessionUser = {
  id?: number | string;
  perfil?: string | null;
  role?: string | null;
};

function isAdmin(session: any) {
  const user = session?.user as SessionUser | undefined;
  const perfil = user?.perfil ?? user?.role;
  return perfil === "admin" || perfil === "ADMIN";
}

function getUserId(session: any): number | null {
  const user = session?.user as SessionUser | undefined;
  const id = user?.id;
  if (typeof id === "number") return id;
  if (typeof id === "string" && id.trim() !== "" && !Number.isNaN(Number(id))) return Number(id);
  return null;
}

function parseEventId(raw: string): number | null {
  const n = Number(raw);
  if (!Number.isInteger(n) || n <= 0) return null;
  return n;
}

function isBuildPhase() {
  return process.env.NEXT_PHASE === "phase-production-build";
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    if (isBuildPhase()) return NextResponse.json({ ok: true, build: true });

    const [{ getServerSession }, { authOptions }, prismaMod] = await Promise.all([
      import("next-auth"),
      import("@/lib/auth"),
      import("@/lib/prisma"),
    ]);

    const prisma: any = (prismaMod as any).default ?? (prismaMod as any).prisma;

    const session = await getServerSession(authOptions as any);
    if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const id = parseEventId(params.id);
    if (!id) return NextResponse.json({ error: "invalid_id" }, { status: 400 });

    const evento = await prisma.eventoAgenda.findUnique({
      where: { id },
      include: { medico: { select: { id: true, nome: true, email: true } } },
    });

    if (!evento) return NextResponse.json({ error: "not_found" }, { status: 404 });

    if (!isAdmin(session)) {
      const userId = getUserId(session);
      if (!userId || evento.medicoId !== userId) {
        return NextResponse.json({ error: "forbidden" }, { status: 403 });
      }
    }

    return NextResponse.json({ evento });
  } catch (e: any) {
    return NextResponse.json(
      { error: "internal_error", details: e?.message ?? String(e) },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    if (isBuildPhase()) return NextResponse.json({ ok: true, build: true });

    const [{ getServerSession }, { authOptions }, prismaMod] = await Promise.all([
      import("next-auth"),
      import("@/lib/auth"),
      import("@/lib/prisma"),
    ]);

    const prisma: any = (prismaMod as any).default ?? (prismaMod as any).prisma;

    const session = await getServerSession(authOptions as any);
    if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const id = parseEventId(params.id);
    if (!id) return NextResponse.json({ error: "invalid_id" }, { status: 400 });

    const ev = await prisma.eventoAgenda.findUnique({
      where: { id },
      select: { id: true, medicoId: true },
    });

    if (!ev) return NextResponse.json({ error: "not_found" }, { status: 404 });

    if (!isAdmin(session)) {
      const userId = getUserId(session);
      if (!userId || ev.medicoId !== userId) {
        return NextResponse.json({ error: "forbidden" }, { status: 403 });
      }
    }

    await prisma.eventoAgenda.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: "internal_error", details: e?.message ?? String(e) },
      { status: 500 }
    );
  }
}
