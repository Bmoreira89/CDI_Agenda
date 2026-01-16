import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function isAdminRequest(req: NextRequest) {
  // 1) Tenta NextAuth (se estiver funcionando)
  try {
    const session = await getServerSession(authOptions as any);
    const u: any = session?.user;
    const role = String(u?.perfil ?? u?.role ?? "").toLowerCase();
    if (role === "admin") return true;
  } catch {}

  // 2) Fallback: token simples via header
  const token = req.headers.get("x-admin-token") || "";
  const expected = process.env.ADMIN_TOKEN || "";
  if (expected && token === expected) return true;

  return false;
}
