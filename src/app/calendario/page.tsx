"use client";

import { useEffect, useMemo, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import ptBrLocale from "@fullcalendar/core/locales/pt-br";

type ApiEvento = {
  id: number;
  cidade: string;
  data: string; // pode vir "YYYY-MM-DD" ou ISO
  quantidade: number;
  createdAt?: string;
  email?: string;
};

type CalendarEvent = {
  id: string; // FullCalendar usa string
  title: string;
  start: string; // YYYY-MM-DD (date-only)
  end?: string;  // YYYY-MM-DD (opcional)
  allDay: boolean;
  extendedProps: {
    cidade: string;
    quantidade: number;
    apiId: number;
  };
};

function normalizeToDateOnly(value: any): string {
  const s = String(value ?? "").trim();
  if (!s) return "";

  // Se já está no formato YYYY-MM-DD, mantém
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  // Se vier ISO (YYYY-MM-DDTHH:mm:ss...), pega só a parte da data
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
  if (m?.[1]) return m[1];

  // Último fallback: tenta parsear e pegar a data LOCAL (evita ir pro dia anterior)
  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  return s;
}

export default function CalendarioPage() {
  const [loading, setLoading] = useState(false);

  const [eventos, setEventos] = useState<CalendarEvent[]>([]);
  const [locaisPermitidos, setLocaisPermitidos] = useState<string[]>([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");

  const [selectedLocal, setSelectedLocal] = useState<string>("");
  const [quantidade, setQuantidade] = useState<string>("");

  const canSubmit = useMemo(() => {
    const q = Number(quantidade);
    return (
      modalOpen &&
      !!selectedDate &&
      !!selectedLocal &&
      Number.isFinite(q) &&
      q > 0
    );
  }, [modalOpen, selectedDate, selectedLocal, quantidade]);

  async function carregarTudo() {
    setLoading(true);
    try {
      // locais permitidos do usuário
      const resLocais = await fetch("/api/cidades", { cache: "no-store" });
      if (!resLocais.ok) throw new Error(await resLocais.text());
      const locais = (await resLocais.json()) as string[];
      setLocaisPermitidos(Array.isArray(locais) ? locais : []);

      // eventos do usuário
      const resEventos = await fetch("/api/eventos", { cache: "no-store" });
      if (!resEventos.ok) throw new Error(await resEventos.text());
      const data = (await resEventos.json()) as ApiEvento[];

      const mapped: CalendarEvent[] = (Array.isArray(data) ? data : []).map((e) => {
        const dia = normalizeToDateOnly(e.data);
        return {
          id: String(e.id),
          title: `${e.cidade}: ${e.quantidade} exame(s)`,
          start: dia, // IMPORTANTÍSSIMO: date-only evita cair no dia anterior
          allDay: true,
          extendedProps: {
            cidade: e.cidade,
            quantidade: e.quantidade,
            apiId: e.id,
          },
        };
      });

      setEventos(mapped);
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "Erro ao carregar calendário.");
      setEventos([]);
      setLocaisPermitidos([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarTudo().catch(() => {});
  }, []);

  function abrirModal(dateStr: string) {
    setSelectedDate(normalizeToDateOnly(dateStr));
    setSelectedLocal("");
    setQuantidade("");
    setModalOpen(true);
  }

  function fecharModal() {
    setModalOpen(false);
    setSelectedDate("");
    setSelectedLocal("");
    setQuantidade("");
  }

  async function criarLancamento() {
    if (!canSubmit) return;

    const q = Number(quantidade);

    try {
      setLoading(true);
      const res = await fetch("/api/eventos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cidade: selectedLocal,
          data: selectedDate, // manda YYYY-MM-DD
          quantidade: q,
        }),
      });

      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(t || `Falha ao salvar (${res.status})`);
      }

      const created = (await res.json()) as ApiEvento;

      // Normaliza o retorno também (caso venha ISO)
      const dia = normalizeToDateOnly(created.data);

      const novoEvento: CalendarEvent = {
        id: String(created.id),
        title: `${created.cidade}: ${created.quantidade} exame(s)`,
        start: dia,
        allDay: true,
        extendedProps: {
          cidade: created.cidade,
          quantidade: created.quantidade,
          apiId: created.id,
        },
      };

      setEventos((prev) => [...prev, novoEvento]);
      fecharModal();
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "Erro ao criar lançamento.");
    } finally {
      setLoading(false);
    }
  }

  async function excluirLancamento(apiId: number) {
    if (!confirm("Excluir este lançamento?")) return;

    try {
      setLoading(true);
      const res = await fetch(`/api/eventos?id=${apiId}`, { method: "DELETE" });
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(t || `Falha ao excluir (${res.status})`);
      }

      setEventos((prev) => prev.filter((e) => e.extendedProps.apiId !== apiId));
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "Erro ao excluir lançamento.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-4">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Agenda de exames</h1>
          </div>

          <a
            href="/api/logout"
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Sair
          </a>
        </header>

        <section className="bg-white rounded-xl shadow-sm p-3 md:p-4">
          <FullCalendar
            plugins={[dayGridPlugin, interactionPlugin]}
            locale={ptBrLocale}
            initialView="dayGridMonth"
            height="auto"
            headerToolbar={{
              left: "",
              center: "title",
              right: "today prev,next",
            }}
            buttonText={{
              today: "today",
            }}
            selectable={true}
            selectMirror={true}
            dayMaxEvents={true}
            events={eventos}
            dateClick={(info) => {
              // usa dateStr (YYYY-MM-DD) para não cair no dia anterior
              abrirModal(info.dateStr);
            }}
            eventClick={(info) => {
              const apiId = (info.event.extendedProps as any)?.apiId;
              if (apiId) excluirLancamento(Number(apiId));
            }}
          />

          <p className="text-xs text-slate-500 mt-3">
            Dica: clique em um dia para lançar. Clique em um lançamento para excluir.
          </p>
        </section>
      </div>

      {/* MODAL */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4"
          onMouseDown={(e) => {
            // fecha ao clicar fora
            if (e.target === e.currentTarget) fecharModal();
          }}
        >
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl p-4">
            <h2 className="text-lg font-semibold">Escolha o local</h2>

            <div className="mt-3 space-y-2">
              <div className="text-sm text-slate-600">
                Data: <span className="font-medium">{selectedDate}</span>
              </div>

              <select
                value={selectedLocal}
                onChange={(e) => setSelectedLocal(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="">Selecione o local</option>
                {locaisPermitidos.map((c) => (
                  <option key={c} value={c}>
                    {c}
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
                  className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-50"
                >
                  Cancelar
                </button>

                <button
                  onClick={criarLancamento}
                  disabled={!canSubmit || loading}
                  className="flex-1 rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
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
