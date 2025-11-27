"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function DashboardPage() {
  const [nome, setNome] = useState("");
  const [perfil, setPerfil] = useState<"medico" | "admin">("medico");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedNome = localStorage.getItem("agenda_cdi_nome");
    const storedPerfil = localStorage.getItem("agenda_cdi_perfil");

    if (storedNome) setNome(storedNome);
    if (storedPerfil === "admin" || storedPerfil === "medico") {
      setPerfil(storedPerfil);
    }
  }, []);

  const handleSalvar = () => {
    if (typeof window === "undefined") return;

    const nomeFinal = nome.trim() || "Dr(a). Usuário";
    localStorage.setItem("agenda_cdi_nome", nomeFinal);
    localStorage.setItem("agenda_cdi_perfil", perfil);
    localStorage.setItem("agenda_cdi_medico_ativo", nomeFinal);

    alert("Perfil atualizado.");
  };

  const hoje = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex flex-col gap-2">
          <p className="text-sm text-slate-500">Agenda CDI</p>
          <h1 className="text-2xl font-semibold">
            Olá, {nome.trim() || "Dr(a). Usuário"} 👋
          </h1>
          <p className="text-sm text-slate-500 capitalize">{hoje}</p>
        </header>

        <section className="grid gap-4 md:grid-cols-2">
          {/* Cartão de perfil */}
          <div className="bg-white rounded-xl shadow-sm p-4 space-y-3">
            <h2 className="text-lg font-semibold">Seu perfil</h2>

            <div className="space-y-2 text-sm">
              <label className="block text-slate-600">Nome exibido</label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Dr. Bruno Moreira"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>

            <div className="space-y-2 text-sm">
              <label className="block text-slate-600">Função</label>
              <select
                value={perfil}
                onChange={(e) =>
                  setPerfil(e.target.value === "admin" ? "admin" : "medico")
                }
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="medico">Médico</option>
                <option value="admin">Administrador</option>
              </select>
            </div>

            <button
              onClick={handleSalvar}
              className="mt-2 inline-flex items-center gap-2 rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Salvar perfil
            </button>
          </div>

          {/* Cartão de atalhos */}
          <div className="bg-white rounded-xl shadow-sm p-4 space-y-3">
            <h2 className="text-lg font-semibold">Atalhos rápidos</h2>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/calendario"
                  className="text-sky-700 hover:underline"
                >
                  📅 Abrir agenda de exames
                </Link>
              </li>
              <li>
                <Link
                  href="/configuracoes"
                  className="text-sky-700 hover:underline"
                >
                  ⚙️ Configurações do usuário / Exportar exames
                </Link>
              </li>
              {perfil === "admin" && (
                <li>
                  <Link href="/admin" className="text-sky-700 hover:underline">
                    🧩 Painel do administrador
                  </Link>
                </li>
              )}
            </ul>
          </div>
        </section>
      </div>
    </main>
  );
}
