import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

function isAdmin(session: any) {
  return (session?.user as any)?.role === "ADMIN";
}

export async function GET() {
  const session = await getServerSession(authOptions as any);
  if (!isAdmin(session)) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const users = await prisma.user.findMany({
    orderBy: [{ name: "asc" }, { email: "asc" }],
    select: { id: true, name: true, email: true, role: true, allowedCitiesCsv: true },
  });

  return NextResponse.json({ users });
}

// Criação simples de usuário (se já tinha um POST, mantenha-o)
// Espera: { name, email, role, allowedCitiesCsv }
export async function POST(req: Request) {
  const session = await getServerSession(authOptions as any);
  if (!isAdmin(session)) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = await req.json();
  const { name, email, role = "USER", allowedCitiesCsv = "" } = body;

  const created = await prisma.user.create({
    data: { name, email, role, allowedCitiesCsv },
    select: { id: true },
  });

  return NextResponse.json({ created }, { status: 201 });
}

// Atualização parcial (inclui allowedCitiesCsv)
export async function PUT(req: Request) {
  const session = await getServerSession(authOptions as any);
  if (!isAdmin(session)) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = await req.json();
  const { id, data } = body as { id: string; data: Partial<{ name: string; role: "ADMIN" | "USER"; allowedCitiesCsv: string }> };

  const updated = await prisma.user.update({
    where: { id },
    data,
    select: { id: true },
  });

  return NextResponse.json({ updated });
}
