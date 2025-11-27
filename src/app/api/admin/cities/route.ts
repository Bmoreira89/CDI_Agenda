import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

// Só admins
function isAdmin(session: any) {
  return (session?.user as any)?.role === "ADMIN";
}

export async function GET() {
  const session = await getServerSession(authOptions as any);
  if (!isAdmin(session)) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const cities = await prisma.cityCatalog.findMany({
    orderBy: [{ name: "asc" }, { subName: "asc" }],
  });

  return NextResponse.json({ cities });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions as any);
  if (!isAdmin(session)) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = await req.json();
  const { name, subName } = body;

  const created = await prisma.cityCatalog.create({
    data: { name, subName: subName || null, active: true },
  });

  return NextResponse.json({ created }, { status: 201 });
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions as any);
  if (!isAdmin(session)) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = await req.json();
  const { id, data } = body as { id: string; data: Partial<{ name: string; subName: string | null; active: boolean }> };

  const updated = await prisma.cityCatalog.update({
    where: { id },
    data,
  });

  return NextResponse.json({ updated });
}
