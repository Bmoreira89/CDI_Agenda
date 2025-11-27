'use client';
import { useEffect, useState, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

type Ev = { id: string; title: string; start: string; end?: string; color?: string; allDay?: boolean };

export default function CalendarClient() {
  const [events, setEvents] = useState<Ev[]>([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/events', { cache: 'no-store' });
      const data = await res.json();
      setEvents(data || []);
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  const headerToolbar = useMemo(() => ({
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth,timeGridWeek,timeGridDay'
  }), []);

  async function createDemo() {
    await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Exemplo — Plantão',
        start: new Date().toISOString(),
        color: '#3b82f6'
      })
    });
    await load();
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-semibold mb-3">Calendário</h1>
      <button onClick={createDemo} className="px-3 py-2 rounded bg-black text-white mb-3">
        Criar evento de teste
      </button>
      {loading && <div className="mb-2 text-sm opacity-70">Carregando…</div>}
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={headerToolbar}
        locale="pt-br"
        events={events}
        eventColor="#2563eb"
      />
    </div>
  );
}
