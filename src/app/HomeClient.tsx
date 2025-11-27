"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function HomeClient() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;
    if (!session) router.replace("/login");
  }, [status, session, router]);

  if (status === "loading") return <main>Carregando…</main>;
  if (!session) return null;

  return (
    <main style={{ padding: 16 }}>
      <h1>Olá, {(session.user as any)?.name || "Admin"}!</h1>
      <p style={{ marginTop: 8 }}>
        Vá para <a href="/calendario">/calendario</a> para ver os eventos.
      </p>
      <p style={{ marginTop: 4 }}>
        Área administrativa: <a href="/admin">/admin</a>
      </p>
    </main>
  );
}
