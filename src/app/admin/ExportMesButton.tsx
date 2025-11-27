'use client';
import { useState } from 'react';

export default function ExportMesButton() {
  const [ym, setYm] = useState<string>(() => {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${d.getFullYear()}-${mm}`;
  });
  const [busy, setBusy] = useState(false);

  async function handleExport() {
    if (!ym) return;
    setBusy(true);
    try {
      const a = document.createElement('a');
      a.href = `/api/events/export?ym=${encodeURIComponent(ym)}`;
      a.download = `agenda_${ym}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <input
        type="month"
        value={ym}
        onChange={e => setYm(e.target.value)}
        className="border rounded px-3 py-2"
      />
      <button
        onClick={handleExport}
        disabled={busy}
        className="px-4 py-2 rounded bg-black text-white"
      >
        {busy ? 'Gerando…' : 'Exportar Excel'}
      </button>
    </div>
  );
}
