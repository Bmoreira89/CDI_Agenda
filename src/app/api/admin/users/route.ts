export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

function isAdmin(req: NextRequest) {
  const token =
    req.headers.get("x-admin-token") ||
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  const expected = process.env.ADMIN_TOKEN;

  return Boolean(expected && token && token === expected);
}

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const users = await prisma.medicoAgenda.findMany({
    orderBy: { nome: "asc" },
    select: {
      id: true,
      nome: true,
      email: true,
      crm: true,
      perfil: true,
      createdAt: true,
    },
  });

  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));

  const nome = String(body?.nome ?? "").trim();
  const email = String(body?.email ?? "").trim().toLowerCase();
  const senha = String(body?.senha ?? "").trim();
  const crm = body?.crm ? String(body.crm).trim() : null;
  const perfil = body?.perfil === "admin" ? "admin" : "medico";

  if (!nome || !email || !senha) {
    return NextResponse.json({ error: "campos_obrigatorios" }, { status: 400 });
  }

  const hash = await bcrypt.hash(senha, 10);

  const created = await prisma.medicoAgenda.create({
    data: { nome, email, senha: hash, crm, perfil },
    select: { id: true, nome: true, email: true, crm: true, perfil: true },
  });

  return NextResponse.json(created);
}
