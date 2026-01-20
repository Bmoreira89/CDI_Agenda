"use client";

import { useEffect, useMemo, useState } from "react";

type Cidade = { id: number; nome: string };
type Medico = {
  id: number;
  nome: string;
  email: string;
  crm: string | null;
  perfil: string;
  createdAt?: string;
};

function makeHeaders(adminToken?: string) {
  const h = new Headers();
  if (adminToken && adminToken.trim()) {
    h.set("x-admin-token", adminToken.trim());
  }
  return h;
}

export default function AdminPage() {
  const [adminToken, setAdminToken] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const [cidades, setCidades] = useState<Cidade[]>([]);
  const [medicos, setMedicos] = useState<Medico[]>([]);

  const [novaCidade, setNovaCidade] = useState("");
  const [novoNome, setNovoNome] = useState("");
  const [novoCrm, setNovoCrm] = useState("");
  const [novoEmail, setNovoEmail] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [novoPerfil, setNovoPerfil] = useState<"medico" | "admin">("medico");

  const tokenSalvo = useMemo(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("ADMIN_TOKEN_UI") || "";
  }, []);

  useEffect(() => {
    if (tokenSalvo) setAdminToken(tokenSalvo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function carregar() {
    setLoading(true);
    try {
      const h = makeHeaders(adminToken);

      const resC = await fetch("/api/admin/cities", {
        method: "GET",
        headers: h,
        cache: "no-store",
      });
      if (!resC.ok) {
        const t = await resC.text().catch(() => "");
        throw new Error(`Cidades: ${resC.status} ${t || resC.statusText}`);
      }
      const dataC = (await resC.json()) as Cidade[];
      setCidades(Array.isArray(dataC) ? dataC : []);

      const resU = await fetch("/api/admin/users", {
        method: "GET",
        headers: h,
        cache: "no-store",
      });
      if (!resU.ok) {
        const t = await resU.text().catch(() => "");
        throw new Error(`Médicos: ${resU.status} ${t || resU.statusText}`);
      }
      const dataU = (await resU.json()) as Medico[];
      setMedicos(Array.isArray(dataU) ? dataU : []);
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "Erro ao carregar dados do admin.");
      setCidades([]);
      setMedicos([]);
    } finally {
      setLoading(false);
    }
  }

  async function adicionarCidade() {
    const nome = novaCidade.trim();
    if (!nome) return alert("Digite o nome da cidade/local.");

    try {
      const h = makeHeaders(adminToken);
      h.set("Content-Type", "application/json");

      const res = await fetch("/api/admin/cities", {
        method: "POST",
        headers: h,
        body: JSON.stringify({ nome }),
      });

      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(`Falha ao criar cidade: ${res.status} ${t || res.statusText}`);
      }

      setNovaCidade("");
      await carregar();
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "Erro ao adicionar cidade.");
    }
  }

  async function adicionarMedico() {
    const nome = novoNome.trim();
    const email = novoEmail.trim().toLowerCase();
    const senha = novaSenha.trim();
    const crm = novoCrm.trim() ? novoCrm.trim() : null;

    if (!nome || !email || !senha) {
      return alert("Preencha Nome, E-mail e Senha.");
    }

    try {
      const h = makeHeaders(adminToken);
      h.set("Content-Type", "application/json");

      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: h,
        body: JSON.stringify({
          nome,
          email,
          senha,
          crm,
          perfil: novoPerfil,
        }),
      });

      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(`Falha ao criar médico: ${res.status} ${t || res.statusText}`);
      }

      setNovoNome("");
      setNovoEmail("");
      setNovaSenha("");
      setNovoCrm("");
      setNovoPerfil("medico");
      await carregar();
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "Erro ao adicionar médico.");
    }
  }

  function salvarTokenLocal() {
    localStorage.setItem("ADMIN_TOKEN_UI", adminToken.trim());
    alert("Token salvo neste navegador. Agora clique em Recarregar.");
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-4">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold">Painel do administrador</h1>
          <p className="text-sm text-slate-500">
            Cadastre cidades/locais e usuários. (Se der unauthorized, confirme o ADMIN_TOKEN na Vercel.)
          </p>
        </header>

        <section className="bg-white rounded-xl shadow-sm p-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-1 w-full md:max-w-xl">
            <label className="text-sm font-medium">Token (opcional)</label>
            <input
              value={adminToken}
              onChange={(e) => setAdminToken(e.target.value)}
              placeholder="cole aqui o ADMIN_TOKEN"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
            <div className="flex gap-2">
              <button
                onClick={salvarTokenLocal}
                className="rounded-md border border-slate-300 px-3 py-2 text-xs font-medium hover:bg-slate-50"
              >
                Salvar token neste PC
              </button>
              <button
                onClick={carregar}
                className="rounded-md bg-slate-900 px-3 py-2 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50"
                disabled={loading}
              >
                {loading ? "Carregando..." : "Recarregar"}
              </button>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-4 space-y-3">
            <h2 className="text-lg font-semibold">Cidades / Locais</h2>
            <div className="flex gap-2">
              <input
                value={novaCidade}
                onChange={(e) => setNovaCidade(e.target.value)}
                placeholder="Ex: São Manuel - TC"
                className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
              <button
                onClick={adicionarCidade}
                className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
              >
                Adicionar
              </button>
            </div>

            {cidades.length === 0 ? (
              <p className="text-sm text-slate-500">Nenhuma cidade cadastrada ainda.</p>
            ) : (
              <ul className="text-sm space-y-1">
                {cidades.map((c) => (
                  <li key={c.id} className="flex justify-between border-b border-slate-100 py-1">
                    <span>{c.nome}</span>
                    <span className="text-slate-400">#{c.id}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 space-y-3">
            <h2 className="text-lg font-semibold">Médicos (banco)</h2>

            <input
              value={novoNome}
              onChange={(e) => setNovoNome(e.target.value)}
              placeholder="Nome do médico"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              value={novoCrm}
              onChange={(e) => setNovoCrm(e.target.value)}
              placeholder="CRM (opcional)"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              value={novoEmail}
              onChange={(e) => setNovoEmail(e.target.value)}
              placeholder="E-mail"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              placeholder="Senha"
              type="password"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />

            <div className="flex gap-2 items-center">
              <label className="text-sm font-medium w-16">Perfil</label>
              <select
                value={novoPerfil}
                onChange={(e) => setNovoPerfil(e.target.value === "admin" ? "admin" : "medico")}
                className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="medico">Médico</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <button
              onClick={adicionarMedico}
              className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Adicionar médico
            </button>

            {medicos.length === 0 ? (
              <p className="text-sm text-slate-500">Nenhum médico cadastrado ainda.</p>
            ) : (
              <ul className="text-sm space-y-1">
                {medicos.map((m) => (
                  <li key={m.id} className="border-b border-slate-100 py-2">
                    <div className="flex justify-between">
                      <span className="font-medium">{m.nome}</span>
                      <span className="text-slate-400">#{m.id}</span>
                    </div>
                    <div className="text-slate-600">{m.email}</div>
                    <div className="text-slate-500 text-xs">
                      perfil: {m.perfil} {m.crm ? `• CRM: ${m.crm}` : ""}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
