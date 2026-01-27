"use client";

import { useEffect, useMemo, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";

type ApiEvento = {
  id: number;
  cidade: string;
  data: string; // YYYY-MM-DD
  quantidade: number;
  createdAt?: string;
};

type Cidade = { nome: string };

export default function CalendarioPage() {
  const [cidades, setCidades] = useState<Cidade[]>([]);
  const [eventos, setEventos] = useState<ApiEvento[]>([]);
  const [loading, setLoading] = useState(false);

  // modal
  const [open, setOpen] = useState(false);
  const [dataSelecionada, setDataSelecionada] = useState<string>(""); // YYYY-MM-DD
  const [cidadeSelecionada, setCidadeSelecionada] = useState<string>("");
  const [quantidade, setQuantidade] = useState<string>("");

  async function carregarTudo() {
    setLoading(true);
    try {
      const [rc, re] = await Promise.all([
        fetch("/api/cidades", { cache: "no-store" }),
        fetch("/api/eventos", { cache: "no-store" }),
      ]);

      if (!rc.ok) throw new Error(`Cidades: ${rc.status}`);
      if (!re.ok) throw new Error(`Eventos: ${re.status}`);

      const cidadesData = (await rc.json()) as any[];
      const eventosData = (await re.json()) as ApiEvento[];

      // /api/cidades pode retornar array de strings ou objetos
      const c = (Array.isArray(cidadesData) ? cidadesData : []).map((x) =>
        typeof x === "string" ? { nome: x } : { nome: String(x?.nome ?? x?.cidade ?? "").trim() }
      ).filter((x) => x.nome);

      setCidades(c);
      setEventos(Array.isArray(eventosData) ? eventosData : []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarTudo().catch(console.error);
  }, []);

  const fcEvents = useMemo(() => {
    return eventos.map((e) => ({
      id: String(e.id),
      title: `${e.cidade}: ${e.quantidade} exame(s)`,
      start: e.data,      // IMPORTANTÍSSIMO: YYYY-MM-DD
      allDay: true,
      extendedProps: { cidade: e.cidade, quantidade: e.quantidade, data: e.data },
    }));
  }, [eventos]);

  function abrirModal(dateOnly: string) {
    setDataSelecionada(dateOnly);
    setCidadeSelecionada(cidades[0]?.nome ?? "");
    setQuantidade("");
    setOpen(true);
  }

  function fecharModal() {
    setOpen(false);
    setDataSelecionada("");
    setCidadeSelecionada("");
    setQuantidade("");
  }

  async function salvar() {
    const cidade = cidadeSelecionada.trim();
    const data = dataSelecionada.trim(); // YYYY-MM-DD
    const qtd = Number(quantidade);

    if (!cidade) return alert("Selecione o local.");
    if (!data) return alert("Data inválida.");
    if (!Number.isFinite(qtd) || qtd <= 0) return alert("Digite a quantidade (maior que zero).");

    try {
      const res = await fetch("/api/eventos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cidade, data, quantidade: qtd }),
      });

      if (res.status === 409) {
        alert("Já existe um lançamento nesse dia para esse local.");
        await carregarTudo();
        fecharModal();
        return;
      }

      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(`Falha ao salvar: ${res.status} ${t}`);
      }

      await carregarTudo();
      fecharModal();
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "Erro ao salvar.");
    }
  }

  async function excluir(id: string) {
    if (!confirm("Excluir este lançamento?")) return;

    try {
      const res = await fetch(`/api/eventos?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(`Falha ao excluir: ${res.status} ${t}`);
      }
      await carregarTudo();
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "Erro ao excluir.");
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Agenda de exames</h1>
          </div>
          <a
            href="/api/logout"
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Sair
          </a>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-3 md:p-4">
          <FullCalendar
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            locale="pt-br"
            height="auto"
            dayMaxEventRows={true}
            events={fcEvents}
            dateClick={(info) => {
              // IMPORTANTÍSSIMO: usar dateStr (YYYY-MM-DD) para não cair no dia anterior
              abrirModal(info.dateStr);
            }}
            eventClick={(info) => {
              excluir(info.event.id);
            }}
          />

          <p className="text-xs text-slate-500 mt-2">
            Dica: clique em um dia para lançar. Clique em um lançamento para excluir.
          </p>
        </div>
      </div>

      {/* MODAL */}
      {open && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="absolute inset-0 bg-black/30"
            onClick={fecharModal}
          />
          <div className="relative z-[10000] w-full max-w-md rounded-xl bg-white shadow-lg p-4">
            <h2 className="text-base font-semibold">Escolha o local</h2>
            <p className="text-xs text-slate-500 mt-1">Data: {dataSelecionada}</p>

            <div className="mt-3 space-y-2">
              <select
                value={cidadeSelecionada}
                onChange={(e) => setCidadeSelecionada(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              >
                {cidades.map((c) => (
                  <option key={c.nome} value={c.nome}>
                    {c.nome}
                  </option>
                ))}
              </select>

              <input
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value)}
                inputMode="numeric"
                placeholder="Quantidade de exames"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />

              <div className="flex gap-2 pt-2">
                <button
                  onClick={fecharModal}
                  className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50"
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button
                  onClick={salvar}
                  className="flex-1 rounded-md bg-slate-900 px-3 py-2 text-sm text-white hover:bg-slate-800 disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
