"use client";
import { useSession } from "next-auth/react";

export default function ExportarClient() {
  const { status } = useSession();
  if (status === "loading") return <div>Carregando…</div>;
  return <div>Exportar Dados</div>;
}
