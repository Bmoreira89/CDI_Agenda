// src/components/UserHeader.tsx
"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

export default function UserHeader() {
  const { data, status } = useSession();
  if (status !== "authenticated") {
    return (
      <div className="ml-auto">
        <Link href="/login" className="px-2 py-1 rounded border">Login</Link>
      </div>
    );
  }
  const user: any = data?.user || null;
  const first = user?.name?.split(" ")?.[0] || user?.email?.split("@")?.[0] || "Usuário";
  const isAdmin = (user?.role as "ADMIN" | "MEDICO") === "ADMIN";

  return (
    <div className="ml-auto flex items-center gap-3 text-sm">
      <span>Olá, {first}{isAdmin ? " (ADMIN)" : ""}</span>
      <form action="/api/auth/signout" method="post">
        <button className="px-2 py-1 rounded border">Sair</button>
      </form>
    </div>
  );
}
