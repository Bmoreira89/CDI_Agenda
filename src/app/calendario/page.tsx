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
  const [todasCidades, setTodasCidades] = useState<string[]>([]);
  const [medicoNome, setMedicoNome] = useState("");
  const [perfil, setPerfil] = useState<PerfilTipo>("medico");
  const [userId, setUserId] = useState<number | null>(null);

  const [showCityModal, setShowCityModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const [medicos, setMedicos] = useState<MedicoApi[]>([]);
  const [selectedMedicoId, setSelectedMedicoId] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedPerfil = localStorage.getItem("agenda_cdi_perfil");
    const storedUserId = localStorage.getItem("agenda_cdi_user_id");
    const storedNome = localStorage.getItem("agenda_cdi_nome");

    const perfilAtual: PerfilTipo =
      storedPerfil === "admin" ? "admin" : "medico";

    setPerfil(perfilAtual);

    if (storedNome) setMedicoNome(storedNome);
    if (storedUserId) setUserId(Number(storedUserId));

    const carregar = async () => {
      try {
        const resCid = await fetch("/api/cidades");
        if (!resCid.ok) throw new Error("Erro ao carregar cidades");
        const cidades: CidadeApi[] = await resCid.json();
        setTodasCidades(cidades.map((c) => c.nome));

        let urlEventos = "/api/eventos";
        if (perfilAtual === "medico" && storedUserId) {
          urlEventos += `?medicoId=${storedUserId}`;
        }

        const resEvt = await fetch(urlEventos);
        if (!resEvt.ok) throw new Error("Erro ao carregar eventos");
        setEvents(await resEvt.json());

        if (perfilAtual === "admin") {
          const resMed = await fetch("/api/medicos");
          if (resMed.ok) setMedicos(await resMed.json());
        }
      } catch (e) {
        console.error(e);
        alert("Erro ao carregar dados.");
      }
    };

    carregar();
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    router.push("/login");
  };

  const handleDateClick = (info: { dateStr: string }) => {
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

    let medicoId = userId;
    let medicoNomeFinal = medicoNome;

    if (perfil === "admin") {
      if (!selectedMedicoId) {
        alert("Selecione o médico.");
        return;
      }
      medicoId = selectedMedicoId;
      medicoNomeFinal =
        medicos.find((m) => m.id === selectedMedicoId)?.nome || "Médico";
    }

    const qtdStr = prompt(`Quantidade de exames em ${cidade}:`);
    if (!qtdStr) return;

    const quantidade = Number(qtdStr);
    if (quantidade <= 0) return alert("Quantidade inválida.");

    const res = await fetch("/api/eventos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: selectedDate,
        cidade,
        quantidade,
        medicoId,
        medicoNome: medicoNomeFinal,
      }),
    });

    if (!res.ok) {
      alert("Erro ao salvar evento.");
      return;
    }

    setEvents((prev) => [...prev, await res.json()]);
    setShowCityModal(false);
    setSelectedDate(null);
  };

  const handleEventClick = async (info: any) => {
    if (!confirm(`Remover este registro?\n${info.event.title}`)) return;

    await fetch("/api/eventos", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: info.event.id }),
    });

    setEvents((prev) => prev.filter((e) => e.id !== info.event.id));
  };

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-4">
        <header className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold">Agenda de exames</h1>
          <div className="flex gap-2">
            {perfil === "admin" && (
              <button
                onClick={() => router.push("/admin")}
                className="border px-3 py-2 rounded text-sm"
              >
                Painel admin
              </button>
            )}
            <button
              onClick={handleLogout}
              className="bg-slate-900 text-white px-3 py-2 rounded text-sm"
            >
              Sair
            </button>
          </div>
        </header>

        <section className="bg-white p-4 rounded shadow">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            locale="pt-br"
            events={events}
            dateClick={handleDateClick}
            eventClick={handleEventClick}
          />
        </section>
      </div>

      {showCityModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center">
          <div className="bg-white p-4 rounded space-y-2 w-80">
            <h2 className="font-semibold">Escolha a cidade</h2>

            {perfil === "admin" && (
              <select
                className="w-full border p-2 rounded"
                value={selectedMedicoId ?? ""}
                onChange={(e) =>
                  setSelectedMedicoId(
                    e.target.value ? Number(e.target.value) : null
                  )
                }
              >
                <option value="">Selecione o médico</option>
                {medicos
                  .filter((m) => m.perfil === "medico")
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nome}
                    </option>
                  ))}
              </select>
            )}

            {todasCidades.map((c) => (
              <button
                key={c}
                onClick={() => handleSelectCity(c)}
                className="w-full border rounded px-3 py-2 text-left hover:bg-slate-50"
              >
                {c}
              </button>
            ))}

            <button
              onClick={() => setShowCityModal(false)}
              className="text-xs text-slate-500"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
