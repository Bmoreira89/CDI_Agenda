import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

function isAdmin(session: any) {
  // seu schema usa "perfil" no banco; no session pode estar como role/perfil
  return (
    session?.user?.perfil === "admin" ||
    session?.user?.role === "ADMIN" ||
    session?.user?.isAdmin === true
  );
}

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!isAdmin(session)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const usuarios = await prisma.medicoAgenda.findMany({
    orderBy: [{ nome: "asc" }, { email: "asc" }],
    select: {
      id: true,
      nome: true,
      email: true,
      crm: true,
      perfil: true,
      createdAt: true
    }
  });

  return NextResponse.json({ usuarios });
}
