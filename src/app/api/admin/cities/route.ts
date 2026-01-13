export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

type SessionUser = {
  id?: number | string;
  role?: "ADMIN" | "MEDICO" | string;
};

function isAdmin(session: any) {
  const user = session?.user as SessionUser | undefined;
  return user?.role === "ADMIN" || user?.role === "admin";
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !isAdmin(session)) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const cidades = await prisma.cidade.findMany({
      orderBy: { nome: "asc" }
    });

    return NextResponse.json({ cidades });
  } catch (e: any) {
    return NextResponse.json(
      { error: "internal_error", details: e?.message ?? String(e) },
      { status: 500 }
    );
  }
}
