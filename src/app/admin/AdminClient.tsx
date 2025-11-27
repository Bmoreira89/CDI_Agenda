"use client";
import { useSession } from "next-auth/react";

export default function AdminClient() {
  const { status, data } = useSession();
  if (status === "loading") return <div>Carregando…</div>;
  if (!data) return <div>Sem sessão</div>;
  return <div>Admin — {data?.user?.email}</div>;
}
