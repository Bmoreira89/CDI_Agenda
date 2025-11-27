"use client";
import { useSession } from "next-auth/react";

export default function AdminCidadesClient() {
  const { status } = useSession();
  if (status === "loading") return <div>Carregando…</div>;
  return <div>Gerenciar Cidades</div>;
}
