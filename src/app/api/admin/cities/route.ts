import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

function isAdmin(session: any) {
  // ajuste se seu session tiver outra estrutura
  return session?.user?.role === "ADMIN" || session?.user?.isAdmin === true;
}

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!isAdmin(session)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const cidades = await prisma.cidadeAgenda.findMany({
    orderBy: { nome: "asc" },
  });

  return NextResponse.json({ cidades });
}
