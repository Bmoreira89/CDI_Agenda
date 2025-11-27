"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

interface AgendaEvent {
  id: string;
  title: string;
  start: string;
  allDay?: boolean;
  extendedProps?: {
    cidade?: string;
    medico?: string;
    quantidade?: number;
  };
}

interface CidadeApi {
  id: number;
  nome: string;
}

type PerfilTipo = "medico" | "admin";

interface MedicoApi {
  id: number;
  nome: string;
  perfil: PerfilTipo;
}

export default function CalendarioPage() {
  const router = useRouter();

  const [events, setEvents] = useState<AgendaEvent[]>([]);
  const [cidadesPermitidas, setCidadesPermitidas] = useState<string[]>([]);
  const [todasCidades, setTodasCidades] = useState<string[]>([]);
  const [medicoAtivo, setMedicoAtivo] = useState<string>("");
  const [perfil, setPerfil] = useState<PerfilTipo>("medico");
  const [userId, setUserId] = useState<number | null>(null);

  const [showCityModal, setShowCityModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const [medicos, setMedicos] = useState<MedicoApi[]>([]);
  const [selectedMedicoId, setSelectedMedicoId] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedPermissoes = localStorage.getItem("agenda_cdi_permissoes");
    const storedUserId = localStorage.getItem("agenda_cdi_user_id");
    const storedNomeMedico = localStorage.getItem("agenda_cdi_nome");
    const storedPerfil = localStorage.getItem("agenda_cdi_perfil");

    const perfilAtual: PerfilTipo =
      storedPerfil === "admin" ? "admin" : "medico";
    setPerfil(perfilAtual);

    if (storedNomeMedico) setMedicoAtivo(storedNomeMedico);
    if (storedUserId && !Number.isNaN(Number(storedUserId))) {
      setUserId(Number(storedUserId));
    }

    let permMedico: string[] = [];
    if (storedPermissoes && storedUserId) {
      try {
        const perm = JSON.parse(storedPermissoes) as Record<string, string[]>;
        const doMedico = perm[storedUserId];
        if (doMedico && doMedico.length > 0) permMedico = doMedico;
      } catch {
        permMedico = [];
      }
    }
    setCidadesPermitidas(permMedico);

    const carregarDados = async () => {
      try {
        const resCid = await fetch("/api/cidades");
        if (!resCid.ok) throw new Error("Erro ao carregar cidades");
        const cidData: CidadeApi[] = await resCid.json();
        const nomesCidades = cidData.map((c) => c.nome);
        setTodasCidades(nomesCidades);

        let url = "/api/eventos";
        if (perfilAtual === "medico" && storedUserId) {
          url += `?medicoId=${storedUserId}`;
        }

        const resEvt = await fetch(url);
        if (!resEvt.ok) throw new Error("Erro ao carregar eventos");
        const evtData: AgendaEvent[] = await resEvt.json();
        setEvents(evtData);

        if (perfilAtual === "admin") {
          const resMed = await fetch("/api/medicos");
          if (resMed.ok) {
            const medData: MedicoApi[] = await resMed.json();
            setMedicos(medData);
          }
        }
      } catch (error) {
        console.error(error);
      }
    };

    carregarDados();
  }, []);

  const handleLogout = () => {
    if (typeof window === "undefined") return;
    localStorage.clear();
    router.push("/login");
  };

  const listaCidadesUsuario = (): string[] => {
    if (perfil === "admin") return todasCidades;
    if (cidadesPermitidas.length > 0) return cidadesPermitidas;
    if (todasCidades.length > 0) return todasCidades;
    return [];
  };

  const handleDateClick = (info: { dateStr: string }) => {
    const cidades = listaCidadesUsuario();

    if (!cidades || cidades.length === 0) {
      alert(
        "Nenhuma cidade/local configurado para este usuário. Peça ao administrador para liberar no painel Admin."
      );
      return;
    }

    setSelectedDate(info.dateStr);

    if (perfil === "medico" && userId) {
      setSelectedMedicoId(userId);
    } else {
      setSelectedMedicoId(null);
    }

    setShowCityModal(true);
  };

  const handleSelectCity = async (cidade: string) => {
    if (!selectedDate) return;

    let medicoIdParaSalvar: number | null = null;
    let medicoNomeParaSalvar = "";

    if (perfil === "admin") {
      if (!selectedMedicoId) {
        alert("Selecione o médico responsável antes de lançar os exames.");
        return;
      }
      medicoIdParaSalvar = selectedMedicoId;
      const medicoEncontrado = medicos.find(
        (m) => m.id === selectedMedicoId
      );
      medicoNomeParaSalvar = medicoEncontrado?.nome || "Médico";
    } else {
      if (!userId) {
        alert("Erro: usuário não identificado. Faça login novamente.");
        setShowCityModal(false);
        setSelectedDate(null);
        return;
      }
      medicoIdParaSalvar = userId;
      medicoNomeParaSalvar = medicoAtivo || "Médico";
    }

    const dataFormatada = new Date(selectedDate).toLocaleDateString("pt-BR");
    const qtdStr = window.prompt(
      `Quantidade de exames para ${cidade} no dia ${dataFormatada}:`
    );

    if (!qtdStr) {
      setShowCityModal(false);
      setSelectedDate(null);
      return;
    }

    const qtd = parseInt(qtdStr, 10);
    if (Number.isNaN(qtd) || qtd <= 0) {
      alert("Quantidade inválida. O registro não foi criado.");
      setShowCityModal(false);
      setSelectedDate(null);
      return;
    }

    try {
      const res = await fetch("/api/eventos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: selectedDate,
          cidade,
          quantidade: qtd,
          medicoId: medicoIdParaSalvar,
          medicoNome: medicoNomeParaSalvar,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Erro ao salvar evento.");
      } else {
        const novo: AgendaEvent = await res.json();
        setEvents((prev) => [...prev, novo]);
      }
    } catch (error) {
      console.error(error);
      alert("Erro ao comunicar com o servidor.");
    }

    setShowCityModal(false);
    setSelectedDate(null);
  };

  const handleEventClick = async (clickInfo: any) => {
    const confirmar = window.confirm(
      `Remover este registro?\n\n${clickInfo.event.title}`
    );
    if (!confirmar) return;

    const id = clickInfo.event.id;

    try {
      const res = await fetch("/api/eventos", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Erro ao remover evento.");
        return;
      }

      setEvents((prev) => prev.filter((ev) => ev.id !== id));
    } catch (error) {
      console.error(error);
      alert("Erro ao comunicar com o servidor.");
    }
  };

  const handleExportar = () => {
    if (events.length === 0) {
      alert("Nenhum registro cadastrado para exportar.");
      return;
    }

    let eventosParaExportar = events;

    if (perfil === "medico" && medicoAtivo) {
      eventosParaExportar = events.filter(
        (e) =>
          e.extendedProps?.medico === medicoAtivo ||
          !e.extendedProps?.medico
      );
    }

    const linhas = [
      ["Data", "Cidade", "Quantidade", "Médico"].join(";"),
      ...eventosParaExportar.map((e) =>
        [
          e.start?.substring(0, 10) || "",
          e.extendedProps?.cidade || "",
          e.extendedProps?.quantidade ?? "",
          e.extendedProps?.medico || "",
        ].join(";")
      ),
    ].join("\n");

    const blob = new Blob([linhas], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      perfil === "admin" ? "exames_todos.csv" : "exames_medico.csv"
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const dataSelecionadaFormatada =
    selectedDate &&
    new Date(selectedDate).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  const medicoObrigatorioNaoEscolhido =
    perfil === "admin" && medicos.length > 0 && !selectedMedicoId;

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-4">
        <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold">Agenda de exames</h1>
            <p className="text-sm text-slate-500">
              Clique em um dia para lançar a quantidade de exames por cidade.
              Clique em um registro para remover.
            </p>
          </div>

          <div className="flex gap-2 items-center justify-end">
            {perfil === "admin" && (
              <button
                onClick={() => router.push("/admin")}
                className="inline-flex items-center rounded-md border border-slate-300 px-3 py-2 text-xs md:text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Painel admin
              </button>
            )}
            <button
              onClick={handleLogout}
              className="inline-flex items-center rounded-md bg-slate-900 px-3 py-2 text-xs md:text-sm font-medium text-white hover:bg-slate-800"
            >
              Sair
            </button>
            <button
              onClick={handleExportar}
              className="inline-flex items-center rounded-md bg-emerald-700 px-3 py-2 text-xs md:text-sm font-medium text-white hover:bg-emerald-600"
            >
              Exportar exames em Excel
            </button>
          </div>
        </header>

        <section className="bg-white rounded-xl shadow-sm p-4">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay",
            }}
            locale="pt-br"
            events={events}
            dateClick={handleDateClick}
            eventClick={handleEventClick}
          />
        </section>
      </div>

      {showCityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="w-full max-w-sm rounded-xl bg-white p-4 shadow-lg space-y-3">
            <h2 className="text-base font-semibold">
              Escolha a cidade / local
            </h2>
            <p className="text-sm text-slate-600">
              Selecione onde serão lançados os exames para o dia{" "}
              <span className="font-medium">
                {dataSelecionadaFormatada || ""}
              </span>
              .
            </p>

            {perfil === "admin" && (
              <div className="space-y-1">
                <label className="text-sm font-medium">
                  Médico responsável
                </label>
                {medicos.length === 0 ? (
                  <p className="text-xs text-red-600">
                    Nenhum médico cadastrado. Cadastre médicos no painel
                    admin.
                  </p>
                ) : (
                  <select
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                    value={selectedMedicoId ?? ""}
                    onChange={(e) =>
                      setSelectedMedicoId(
                        e.target.value ? Number(e.target.value) : null
                      )
                    }
                  >
                    <option value="">Selecione o médico...</option>
                    {medicos
                      .filter((m) => m.perfil === "medico")
                      .map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.nome}
                        </option>
                      ))}
                  </select>
                )}
              </div>
            )}

            <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
              {listaCidadesUsuario().map((cidade) => (
                <button
                  key={cidade}
                  onClick={() => {
                    if (medicoObrigatorioNaoEscolhido) {
                      alert(
                        "Selecione o médico responsável antes de escolher a cidade."
                      );
                      return;
                    }
                    handleSelectCity(cidade);
                  }}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-left text-sm hover:bg-slate-50"
                >
                  {cidade}
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                setShowCityModal(false);
                setSelectedDate(null);
              }}
              className="text-xs text-slate-500 hover:underline"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
