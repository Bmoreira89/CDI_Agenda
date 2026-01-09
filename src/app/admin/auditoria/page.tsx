"use client";

import { useEffect, useState } from "react";

export default function AuditoriaPage() {
  type AuditoriaLog = {
  id: string;
  createdAt: string;
  usuario?: {
    nome?: string | null;
    email?: string | null;
  } | null;
  acao?: string | null;
  detalhes?: string | null;
};

const [logs, setLogs] = useState<AuditoriaLog[]>([]);

  const [loading, setLoading] = useState(true);

  async function carregarLogs() {
    setLoading(true);
    const res = await fetch("/api/auditoria");
    const data = await res.json();
    setLogs(data.logs || []);
    setLoading(false);
  }

  useEffect(() => {
    carregarLogs();
  }, []);

  return (
    <div style={{ padding: 30 }}>
      <h1 style={{ fontSize: 26, fontWeight: "bold", marginBottom: 20 }}>
        Auditoria do Sistema
      </h1>

      {loading ? (
        <p>Carregando logs...</p>
      ) : (
        <table style={{
          width: "100%",
          borderCollapse: "collapse",
          background: "#fff"
        }}>
          <thead>
            <tr style={{ background: "#f3f3f3" }}>
              <th style={{ padding: 10, textAlign: "left" }}>Data</th>
              <th style={{ padding: 10, textAlign: "left" }}>Usuário</th>
              <th style={{ padding: 10, textAlign: "left" }}>Ação</th>
              <th style={{ padding: 10, textAlign: "left" }}>Detalhes</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log, i) => (
              <tr key={i} style={{ borderTop: "1px solid #ddd" }}>
                <td style={{ padding: 10 }}>
                  {new Date(log.createdAt).toLocaleString("pt-BR")}
                </td>
                <td style={{ padding: 10 }}>
                  {log.usuario?.nome} ({log.usuario?.email})
                </td>
                <td style={{ padding: 10 }}>{log.acao}</td>
                <td style={{ padding: 10 }}>{log.detalhes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
