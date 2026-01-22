export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

function getTokenFromReq(req: NextRequest) {
  const h = req.headers;
  const byHeader =
    h.get("x-admin-token") ||
    h.get("x-token") ||
    h.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    "";
  const byQuery = new URL(req.url).searchParams.get("token") || "";
  return (byHeader || byQuery).trim();
}

async function isAdmin(req: NextRequest) {
  // (A) Token-based
  const token = getTokenFromReq(req);
  const expected = (process.env.ADMIN_TOKEN || "").trim();
  if (expected && token && token === expected) return true;

  // (B) Header-based (x-user-id) — fallback
  const userId = req.headers.get("x-user-id");
  const id = Number(userId ?? 0);
  if (!id || Number.isNaN(id)) return false;

  const u = await prisma.medicoAgenda.findUnique({
    where: { id },
    select: { perfil: true },
  });

  return String(u?.perfil ?? "").toLowerCase() === "admin";
}

export async function DELETE(req: NextRequest, ctx: { params: { id: string } }) {
  if (!(await isAdmin(req))) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const id = Number(ctx.params.id);
  if (!id || Number.isNaN(id)) return NextResponse.json({ error: "id_invalido" }, { status: 400 });

  try {
    await prisma.medicoAgenda.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    // P2003 = FK constraint
    if (e?.code === "P2003") {
      return NextResponse.json(
        { error: "nao_pode_excluir_usuario_com_registros_vinculados" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "erro_excluir_usuario", details: e?.message ?? String(e) }, { status: 500 });
  }
}
