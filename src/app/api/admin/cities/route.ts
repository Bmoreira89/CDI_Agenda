import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAdmin(session: any) {
  return (
    session?.user?.perfil === "admin" ||
    session?.user?.role === "ADMIN" ||
    session?.user?.isAdmin === true
  );
}

export async function GET() {
  try {
    // Importações dinâmicas (evita quebrar build/collect)
    const { getServerSession } = await import("next-auth");
    const { authOptions } = await import("@/lib/auth");

    const session = await getServerSession(authOptions);

    if (!isAdmin(session)) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const cidades = await prisma.cidadeAgenda.findMany({
      orderBy: { nome: "asc" },
      select: { id: true, nome: true },
    });

    return NextResponse.json({ cidades });
  } catch (e: any) {
    // Importante: não deixar exceção subir e derrubar o build
    return NextResponse.json(
      { error: "internal_error", details: e?.message ?? String(e) },
      { status: 500 }
    );
  }
}
