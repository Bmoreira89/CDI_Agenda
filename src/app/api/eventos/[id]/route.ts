import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  const meId = session?.user?.id;
  if (!meId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const id = Number(params.id);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }

  const ev = await prisma.eventoAgenda.findUnique({
    where: { id },
    select: { id: true, medicoId: true }
  });

  if (!ev) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  if (ev.medicoId !== Number(meId)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  await prisma.eventoAgenda.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
