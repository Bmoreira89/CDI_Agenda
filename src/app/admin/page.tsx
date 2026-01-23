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

type Permissao = {
  id: number;
  email: string;
  cidade: string;
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
  const [permissoes, setPermissoes] = useState<Permissao[]>([]);

  const [novaCidade, setNovaCidade] = useState("");
  const [novoNome, setNovoNome] = useState("");
  const [novoCrm, setNovoCrm] = useState("");
  const [novoEmail, setNovoEmail] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [novoPerfil, setNovoPerfil] = useState<"medico" | "admin">("medico");

  const [permEmail, setPermEmail] = useState("");
  const [permCidade, setPermCidade] = useState("");

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

      const [resC, resU, resP] = await Promise.all([
        fetch("/api/admin/cities", { method: "GET", headers: h, cache: "no-store" }),
        fetch("/api/admin/users", { method: "GET", headers: h, cache: "no-store" }),
        fetch("/api/admin/permissoes", { method: "GET", headers: h, cache: "no-store" }),
      ]);

      if (!resC.ok) throw new Error(`Cidades: ${resC.status} ${await resC.text().catch(() => resC.statusText)}`);
      if (!resU.ok) throw new Error(`Médicos: ${resU.status} ${await resU.text().catch(() => resU.statusText)}`);
      if (!resP.ok) throw new Error(`Permissões: ${resP.status} ${await resP.text().catch(() => resP.statusText)}`);

      const dataC = (await resC.json()) as Cidade[];
      const dataU = (await resU.json()) as Medico[];
      const dataP = (await resP.json()) as Permissao[];

      setCidades(Array.isArray(dataC) ? dataC : []);
      setMedicos(Array.isArray(dataU) ? dataU : []);
      setPermissoes(Array.isArray(dataP) ? dataP : []);
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "Erro ao carregar dados do admin.");
      setCidades([]);
      setMedicos([]);
      setPermissoes([]);
    } finally {
      setLoading(false);
    }
  }

  async function adicionarCidade() {
    const nome = novaCidade.trim();
    if (!nome) return alert("Digite o nome do local.");

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
        throw new Error(`Falha ao criar local: ${res.status} ${t || res.statusText}`);
      }

      setNovaCidade("");
      await carregar();
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "Erro ao adicionar local.");
    }
  }

  async function excluirCidade(id: number) {
    if (!confirm("Excluir este local? Isso também remove permissões e eventos desse local.")) return;

    try {
      const h = makeHeaders(adminToken);
      const res = await fetch(`/api/admin/cities?id=${id}`, { method: "DELETE", headers: h });

      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(`Falha ao excluir local: ${res.status} ${t || res.statusText}`);
      }

      await carregar();
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "Erro ao excluir local.");
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

  async function excluirMedico(id: number) {
    if (!confirm("Excluir este médico? Isso também remove permissões, eventos e logs dele.")) return;

    try {
      const h = makeHeaders(adminToken);
      const res = await fetch(`/api/admin/users?id=${id}`, { method: "DELETE", headers: h });

      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(`Falha ao excluir médico: ${res.status} ${t || res.statusText}`);
      }

      await carregar();
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "Erro ao excluir médico.");
    }
  }

  async function adicionarPermissao() {
    const email = permEmail.trim().toLowerCase();
    const cidade = permCidade.trim();

    if (!email || !cidade) return alert("Selecione o médico (email) e o local.");

    try {
      const h = makeHeaders(adminToken);
      h.set("Content-Type", "application/json");

      const res = await fetch("/api/admin/permissoes", {
        method: "POST",
        headers: h,
        body: JSON.stringify({ email, cidade }),
      });

      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(`Falha ao criar permissão: ${res.status} ${t || res.statusText}`);
      }

      await carregar();
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "Erro ao adicionar permissão.");
    }
  }

  async function excluirPermissao(id: number) {
    if (!confirm("Excluir esta permissão?")) return;

    try {
      const h = makeHeaders(adminToken);
      const res = await fetch(`/api/admin/permissoes?id=${id}`, { method: "DELETE", headers: h });

      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(`Falha ao excluir permissão: ${res.status} ${t || res.statusText}`);
      }

      await carregar();
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "Erro ao excluir permissão.");
    }
  }

  function salvarTokenLocal() {
    localStorage.setItem("ADMIN_TOKEN_UI", adminToken.trim());
    alert("Token salvo neste navegador. Agora clique em Recarregar.");
  }

  useEffect(() => {
    // auto-carrega ao abrir
    carregar().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-4">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold">Painel do administrador</h1>
          <p className="text-sm text-slate-500">
            Cadastre locais, médicos e permissões por login (e-mail).
          </p>
        </header>

        <section className="bg-white rounded-xl shadow-sm p-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-1 w-full md:max-w-xl">
            <label className="text-sm font-medium">ADMIN_TOKEN</label>
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
            <h2 className="text-lg font-semibold">Locais</h2>
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
              <p className="text-sm text-slate-500">Nenhum local cadastrado ainda.</p>
            ) : (
              <ul className="text-sm space-y-1">
                {cidades.map((c) => (
                  <li key={c.id} className="flex items-center justify-between border-b border-slate-100 py-2">
                    <div className="flex flex-col">
                      <span className="font-medium">{c.nome}</span>
                      <span className="text-slate-400 text-xs">#{c.id}</span>
                    </div>
                    <button
                      onClick={() => excluirCidade(c.id)}
                      className="rounded-md border border-rose-300 px-3 py-1 text-xs font-medium text-rose-700 hover:bg-rose-50"
                    >
                      Excluir
                    </button>
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
              <ul className="text-sm space-y-2">
                {medicos.map((m) => (
                  <li key={m.id} className="border-b border-slate-100 py-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">{m.nome}</div>
                        <div className="text-slate-600">{m.email}</div>
                        <div className="text-slate-500 text-xs">
                          perfil: {m.perfil} {m.crm ? `• CRM: ${m.crm}` : ""} • #{m.id}
                        </div>
                      </div>
                      <button
                        onClick={() => excluirMedico(m.id)}
                        className="rounded-md border border-rose-300 px-3 py-1 text-xs font-medium text-rose-700 hover:bg-rose-50"
                      >
                        Excluir
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section className="bg-white rounded-xl shadow-sm p-4 space-y-3">
          <h2 className="text-lg font-semibold">Permissões por médico (email/login)</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <select
              value={permEmail}
              onChange={(e) => setPermEmail(e.target.value)}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Selecione o médico (email)</option>
              {medicos
                .filter((m) => m.perfil !== "admin")
                .map((m) => (
                  <option key={m.id} value={m.email}>
                    {m.nome} — {m.email}
                  </option>
                ))}
            </select>

            <select
              value={permCidade}
              onChange={(e) => setPermCidade(e.target.value)}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Selecione o local</option>
              {cidades.map((c) => (
                <option key={c.id} value={c.nome}>
                  {c.nome}
                </option>
              ))}
            </select>

            <button
              onClick={adicionarPermissao}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Adicionar permissão
            </button>
          </div>

          {permissoes.length === 0 ? (
            <p className="text-sm text-slate-500">Nenhuma permissão cadastrada ainda.</p>
          ) : (
            <ul className="text-sm space-y-1">
              {permissoes.map((p) => (
                <li key={p.id} className="flex items-center justify-between border-b border-slate-100 py-2">
                  <div className="flex flex-col">
                    <span className="font-medium">{p.email}</span>
                    <span className="text-slate-600">{p.cidade}</span>
                    <span className="text-slate-400 text-xs">#{p.id}</span>
                  </div>
                  <button
                    onClick={() => excluirPermissao(p.id)}
                    className="rounded-md border border-rose-300 px-3 py-1 text-xs font-medium text-rose-700 hover:bg-rose-50"
                  >
                    Excluir
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
