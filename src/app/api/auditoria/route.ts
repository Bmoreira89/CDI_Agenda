export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

type SessionUser = {
  id?: string | number;
  role?: "ADMIN" | "MEDICO" | string;
  perfil?: string | null;
};

function isAdmin(session: any) {
  const user = session?.user as SessionUser | undefined;
  const role = (user?.perfil ?? user?.role ?? "").toString();
  return role.toUpperCase() === "ADMIN" || role.toLowerCase() === "admin";
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !isAdmin(session)) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const logs = await prisma.logAcao.findMany({
      orderBy: { dataHora: "desc" },
      take: 200,
      include: {
        usuario: {
          select: { id: true, nome: true, email: true },
        },
      },
    });

    return NextResponse.json({ logs });
  } catch (e: any) {
    return NextResponse.json(
      { error: "internal_error", details: e?.message ?? String(e) },
      { status: 500 }
    );
  }
}
