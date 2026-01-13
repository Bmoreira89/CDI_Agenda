export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

type SessionUser = {
  id?: string | number;
  role?: "ADMIN" | "MEDICO" | string;
  perfil?: string | null; // pode existir no runtime, mas não no type do NextAuth
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

    const users = await prisma.medicoAgenda.findMany({
      orderBy: [{ nome: "asc" }, { email: "asc" }],
      select: {
        id: true,
        nome: true,
        email: true,
        crm: true,
        perfil: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ users });
  } catch (e: any) {
    return NextResponse.json(
      { error: "internal_error", details: e?.message ?? String(e) },
      { status: 500 }
    );
  }
}
