"use client";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LoginClient() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;
    if (session) router.replace("/");
  }, [status, session, router]);

  if (status === "loading") return <main>Carregando…</main>;
  if (session) return null;

  return (
    <main style={{ padding: 16 }}>
      <h1>Entrar</h1>
      <button
        onClick={() => signIn("credentials")}
        style={{ marginTop: 16, padding: "8px 12px" }}
      >
        Entrar com Credentials (demo)
      </button>
    </main>
  );
}
