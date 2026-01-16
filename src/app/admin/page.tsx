"use client";

import { useEffect, useMemo, useState } from "react";

type Cidade = { id: number; nome: string };
type User = { id: number; nome: string; email: string; perfil: "admin" | "medico"; crm?: string | null };

export default function AdminPage() {
  const [token, setToken] = useState<string>("");
  const [cidades, setCidades] = useState<Cidade[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [erroCidades, setErroCidades] = useState<string>("");
  const [erroUsers, setErroUsers] = useState<string>("");

  const headers = useMemo(() => ({
    "Content-Type": "application/json",
    "x-admin-token": token || "",
  }), [token]);

  useEffect(() => {
    const t = localStorage.getItem("agenda_cdi_admin_token") || "CDI_ADMIN_123";
    setToken(t);
  }, []);

  const carregar = async () => {
    setErroCidades("");
    setErroUsers("");

    try {
      const r1 = await fetch("/api/admin/cities", { headers, cache: "no-store" });
      if (!r1.ok) throw new Error("Erro ao comunicar com o servidor (cidades).");
      setCidades(await r1.json());
    } catch (e: any) {
      setErroCidades(e?.message ?? "Falha ao carregar cidades.");
      setCidades([]);
    }

    try {
      const r2 = await fetch("/api/admin/users", { headers, cache: "no-store" });
      if (!r2.ok) throw new Error("Erro ao comunicar com o servidor (médicos).");
      setUsers(await r2.json());
    } catch (e: any) {
      setErroUsers(e?.message ?? "Falha ao carregar médicos.");
      setUsers([]);
    }
  };

  useEffect(() => {
    if (token) carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const [novaCidade, setNovaCidade] = useState("");
  const addCidade = async () => {
    const nome = novaCidade.trim();
    if (!nome) return;
    const r = await fetch("/api/admin/cities", { method: "POST", headers, body: JSON.stringify({ nome }) });
    if (!r.ok) {
      alert("Não foi possível adicionar cidade.");
      return;
    }
    setNovaCidade("");
    carregar();
  };

  const [nome, setNome] = useState("");
  const [crm, setCrm] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [perfil, setPerfil] = useState<"admin"|"medico">("medico");

  const addUser = async () => {
    const payload = { nome: nome.trim(), crm: crm.trim() || null, email: email.trim(), senha: senha.trim(), perfil };
    const r = await fetch("/api/admin/users", { method: "POST", headers, body: JSON.stringify(payload) });
    if (!r.ok) {
      alert("Não foi possível adicionar médico/usuário.");
      return;
    }
    setNome(""); setCrm(""); setEmail(""); setSenha(""); setPerfil("medico");
    carregar();
  };

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700 }}>Painel do administrador</h1>
      <p style={{ marginTop: 6, opacity: 0.8 }}>
        Cadastre cidades/locais, médicos (no banco) e depois use o calendário para lançar os exames.
      </p>

      <div style={{ marginTop: 16, display: "flex", gap: 12, alignItems: "center" }}>
        <label style={{ fontWeight: 600 }}>Token admin:</label>
        <input
          value={token}
          onChange={(e) => {
            setToken(e.target.value);
            localStorage.setItem("agenda_cdi_admin_token", e.target.value);
          }}
          style={{ width: 260, padding: 8, border: "1px solid #ccc", borderRadius: 8 }}
        />
        <button onClick={carregar} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #333" }}>
          Recarregar
        </button>
      </div>

      <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ border: "1px solid #e5e5e5", borderRadius: 12, padding: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>Cidades / Locais</h2>

          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <input
              placeholder="Ex: São Manuel - TC"
              value={novaCidade}
              onChange={(e) => setNovaCidade(e.target.value)}
              style={{ flex: 1, padding: 10, border: "1px solid #ccc", borderRadius: 8 }}
            />
            <button onClick={addCidade} style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #333" }}>
              Adicionar
            </button>
          </div>

          {erroCidades ? (
            <div style={{ marginTop: 10, color: "crimson" }}>{erroCidades}</div>
          ) : (
            <ul style={{ marginTop: 10 }}>
              {cidades.map((c) => <li key={c.id}>{c.nome}</li>)}
              {cidades.length === 0 && <li style={{ opacity: 0.7 }}>Nenhuma cidade cadastrada ainda.</li>}
            </ul>
          )}
        </div>

        <div style={{ border: "1px solid #e5e5e5", borderRadius: 12, padding: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>Médicos (banco)</h2>

          <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
            <input placeholder="Nome do médico" value={nome} onChange={(e) => setNome(e.target.value)}
              style={{ padding: 10, border: "1px solid #ccc", borderRadius: 8 }} />
            <input placeholder="CRM (opcional)" value={crm} onChange={(e) => setCrm(e.target.value)}
              style={{ padding: 10, border: "1px solid #ccc", borderRadius: 8 }} />
            <input placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)}
              style={{ padding: 10, border: "1px solid #ccc", borderRadius: 8 }} />
            <input placeholder="Senha" type="password" value={senha} onChange={(e) => setSenha(e.target.value)}
              style={{ padding: 10, border: "1px solid #ccc", borderRadius: 8 }} />

            <select value={perfil} onChange={(e) => setPerfil(e.target.value as any)}
              style={{ padding: 10, border: "1px solid #ccc", borderRadius: 8 }}>
              <option value="medico">Médico</option>
              <option value="admin">Admin</option>
            </select>

            <button onClick={addUser} style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #333" }}>
              Adicionar médico
            </button>
          </div>

          {erroUsers ? (
            <div style={{ marginTop: 10, color: "crimson" }}>{erroUsers}</div>
          ) : (
            <ul style={{ marginTop: 10 }}>
              {users.map((u) => <li key={u.id}>{u.nome} — {u.email} ({u.perfil})</li>)}
              {users.length === 0 && <li style={{ opacity: 0.7 }}>Nenhum médico cadastrado ainda.</li>}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
