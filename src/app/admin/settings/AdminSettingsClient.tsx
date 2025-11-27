"use client";
import { useSession } from "next-auth/react";

export default function AdminSettingsClient() {
  const { status } = useSession();
  if (status === "loading") return <div>Carregando…</div>;
  return <div>Configurações</div>;
}
