"use client";

import { useEffect, useState } from "react";

interface EventoExport {
  start?: string;
  title?: string;
  extendedProps?: {
    descricao?: string;
    cidade?: string;
  };
}

export default function ConfiguracoesPage() {
  const [nome, setNome] = useState("");
  const [crm, setCrm] = useState("");
  const [perfil, setPerfil] = useState<"medico" | "admin">("medico");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedNome = localStorage.getItem("agenda_cdi_nome");
    const storedCrm = localStorage.getItem("agenda_cdi_crm");
    const storedPerfil = localStorage.getItem("agenda_cdi_perfil");

    if (storedNome) setNome(storedNome);
    if (storedCrm) setCrm(storedCrm);
    if (storedPerfil === "admin" || storedPerfil === "medico") {
      setPerfil(storedPerfil);
    }
  }, []);

  const handleSalvar = () => {
    if (typeof window === "undefined") return;

    const nomeFinal = nome.trim() || "Dr(a). Usuário";
    localStorage.setItem("agenda_cdi_nome", nomeFinal);
    localStorage.setItem("agenda_cdi_crm", crm);
    localStorage.setItem("agenda_cdi_perfil", perfil);
    localStorage.setItem("agenda_cdi_medico_ativo", nomeFinal);

    alert("Configurações salvas.");
  };

  const handleExportar = () => {
    if (typeof window === "undefined") return;

    const eventosStr = localStorage.getItem("agenda_cdi_eventos");
    const eventos: EventoExport[] = eventosStr
      ? JSON.parse(eventosStr)
      : [];

    const linhas = [
      ["Data", "Descrição", "Cidade"].join(";"),
      ...eventos.map((e) =>
        [
          e.start?.substring(0, 10) || "",
          e.extendedProps?.descricao || e.title || "",
          e.extendedProps?.cidade || "",
        ].join(";")
      ),
    ].join("\n");

    const blob = new Blob([linhas], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "exames_medico.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-xl mx-auto space-y-4">
        <h1 className="text-2xl font-semibold">
          Configurações do usuário
        </h1>

        <div className="bg-white rounded-xl shadow-sm p-4 space-y-3 text-sm">
          <div className="space-y-2">
            <label className="block text-slate-600">Nome</label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2"
              placeholder="Ex: Dr. Bruno Moreira"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-slate-600">CRM</label>
            <input
              type="text"
              value={crm}
              onChange={(e) => setCrm(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2"
              placeholder="Ex: 000000-SP"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-slate-600">Função</label>
            <select
              value={perfil}
              onChange={(e) =>
                setPerfil(e.target.value === "admin" ? "admin" : "medico")
              }
              className="w-full rounded-md border border-slate-300 px-3 py-2"
            >
              <option value="medico">Médico</option>
              <option value="admin">Administrador</option>
            </select>
          </div>

          <button
            onClick={handleSalvar}
            className="mt-1 inline-flex items-center rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Salvar
          </button>

          <hr className="my-3" />

          <div className="space-y-2">
            <h2 className="text-base font-semibold">
              Exportar exames lançados
            </h2>
            <p className="text-slate-600">
              Exporta todos os exames que você cadastrou na agenda em
              formato Excel (CSV).
            </p>
            <button
              onClick={handleExportar}
              className="inline-flex items-center rounded-md bg-emerald-700 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-600"
            >
              Exportar exames em Excel
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
