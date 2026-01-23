"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);

  async function entrar() {
    setLoading(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg = data?.error ? String(data.error) : "Falha no login";
        throw new Error(msg);
      }

      // salva usuário
      localStorage.setItem("CDI_USER", JSON.stringify(data.user));

      // admin vai pro painel
      const perfil = String(data?.user?.perfil ?? "").toLowerCase();
      if (perfil === "admin") {
        router.push("/admin");
      } else {
        router.push("/calendario");
      }
    } catch (e: any) {
      alert(e?.message || "Erro no login");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-sm p-6 space-y-3">
        <h1 className="text-xl font-semibold">Login</h1>
        <p className="text-sm text-slate-500">Acesse o CDI Agenda.</p>

        <input
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          placeholder="Senha"
          type="password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
        />

        <button
          onClick={entrar}
          disabled={loading}
          className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </div>
    </main>
  );
}
