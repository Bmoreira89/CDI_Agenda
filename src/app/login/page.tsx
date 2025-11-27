"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type PerfilTipo = "medico" | "admin";

interface LoginResponse {
  id: number;
  nome: string;
  crm?: string | null;
  email?: string | null;
  perfil: PerfilTipo;
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const nome = localStorage.getItem("agenda_cdi_nome");
    if (nome) {
      router.replace("/calendario");
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    setLoading(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), senha: senha.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErro(data.error || "Falha ao fazer login.");
        return;
      }

      const user = data as LoginResponse;

      if (typeof window !== "undefined") {
        localStorage.setItem("agenda_cdi_nome", user.nome);
        localStorage.setItem("agenda_cdi_crm", user.crm || "");
        localStorage.setItem("agenda_cdi_perfil", user.perfil || "medico");
        localStorage.setItem("agenda_cdi_medico_ativo", user.nome);
        localStorage.setItem("agenda_cdi_email", user.email || "");
        localStorage.setItem("agenda_cdi_user_id", String(user.id));
      }

      router.push("/calendario");
    } catch (error) {
      console.error(error);
      setErro("Erro ao comunicar com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-sm p-6 space-y-4">
        <h1 className="text-xl font-semibold text-center">Agenda CDI</h1>
        <p className="text-sm text-slate-500 text-center">
          Faça login com seu e-mail e senha cadastrados pelo administrador.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3 text-sm">
          <div className="space-y-1">
            <label className="block text-slate-600">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="block text-slate-600">Senha</label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2"
              required
            />
          </div>

          {erro && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-md px-2 py-1">
              {erro}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p className="text-xs text-slate-400 text-center">
          Acesso administrado pela equipe Cuesta / CDI.
        </p>
      </div>
    </main>
  );
}
