import prisma from "@/lib/prisma";

// Tenta validar admin por:
// 1) Header x-user-id (quando o front envia)
// 2) NextAuth session (se estiver configurado)
// Mantém compatibilidade e evita erro de tipagem no build.
export async function isAdmin(req?: any): Promise<boolean> {
  // (1) Header-based (preferido)
  try {
    const headers = req?.headers;
    const userIdRaw =
      (typeof headers?.get === "function" ? headers.get("x-user-id") : null) ??
      headers?.["x-user-id"] ??
      headers?.["X-User-Id"] ??
      null;

    const id = Number(userIdRaw ?? 0);
    if (id && !Number.isNaN(id)) {
      const u = await prisma.medicoAgenda.findUnique({
        where: { id },
        select: { perfil: true },
      });
      return String(u?.perfil ?? "").toLowerCase() === "admin";
    }
  } catch {}

  // (2) NextAuth session (fallback)
  try {
    const { getServerSession } = await import("next-auth");
    const { authOptions } = await import("@/lib/auth");
    const session: any = await getServerSession(authOptions as any);
    const u: any = session?.user;
    const role = String(u?.perfil ?? u?.role ?? "").toLowerCase();
    return role === "admin" || role === "administrator";
  } catch {}

  return false;
}
