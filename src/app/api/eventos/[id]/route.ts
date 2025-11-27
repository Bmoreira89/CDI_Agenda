import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = (await getServerSession(authOptions as any)) as any;
  const me = (session?.user as any) || null;
  if (!me?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const ev = await prisma.event.findUnique({
    where: { id: params.id },
    select: { id: true, userId: true },
  });

  if (!ev) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const isAdmin = (me?.role as "ADMIN" | "MEDICO") === "ADMIN";
  const isOwner = ev.userId === me.id;

  if (!isAdmin && !isOwner) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  await prisma.event.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
