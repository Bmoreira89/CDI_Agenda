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

const LS_TOKEN = "ADMIN_TOKEN_UI";
const LS_PERMS = "PERMISSOES_POR_EMAIL_V1"; // { [email: string]: number[] }

function makeHeaders(adminToken?: string) {
  const h = new Headers();
  if (adminToken && adminToken.trim()) h.set("x-admin-token", adminToken.trim());
  return h;
}

function loadPerms(): Record<string, number[]> {
  if (typeof window === "undefined") return {};
  const raw = localStorage.getItem(LS_PERMS);
  if (!raw) return {};
  try {
    const obj = JSON.parse(raw);
    if (!obj || typeof obj !== "object") return {};
    const out: Record<string, number[]> = {};
    for (const [k, v] of Object.entries(obj)) {
      if (typeof k === "string" && Array.isArray(v)) {
        out[k.toLowerCase()] = v.map((x) => Number(x)).filter((n) => Number.isFinite(n));
      }
    }
    return out;
  } catch {
    return {};
  }
}

function savePerms(perms: Record<string, number[]>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LS_PERMS, JSON.stringify(perms));
}

function friendlyApiError(status: number, text: string) {
  const t = (text || "").trim();

  if (status === 401) return "unauthorized (confira o ADMIN_TOKEN)";
  if (status === 409) {
    if (t.includes("cidade_duplicada")) return "Cidade/local duplicado.";
    if (t.includes("email_duplicado")) return "E-mail já cadastrado.";
    if (t.includes("cidade_em_uso")) return "Cidade/local em uso (há vínculos).";
    if (t.includes("medico_em_uso")) return "Médico em uso (há vínculos).";
    return "Conflito (duplicado ou vínculo).";
  }

  return `${status} ${t || ""}`.trim();
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

  // permissões por email
  const [perms, setPerms] = useState<Record<string, number[]>>({});
  const [emailPerm, setEmailPerm] = useState<string>("");

  const tokenSalvo = useMemo(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem(LS_TOKEN) || "";
  }, []);

  useEffect(() => {
    if (tokenSalvo) setAdminToken(tokenSalvo);
    setPerms(loadPerms());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // se o token já está salvo, tenta carregar ao entrar
    if (tokenSalvo) carregar();
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
        throw new Error(`Cidades: ${friendlyApiError(resC.status, t)}`);
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
        throw new Error(`Médicos: ${friendlyApiError(resU.status, t)}`);
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

  function salvarTokenLocal() {
    localStorage.setItem(LS_TOKEN, adminToken.trim());
    alert("Token salvo neste navegador. Agora clique em Recarregar.");
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
        throw new Error(`Falha ao criar cidade: ${friendlyApiError(res.status, t)}`);
      }

      setNovaCidade("");
      await carregar();
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "Erro ao adicionar cidade.");
    }
  }

  async function excluirCidade(id: number, nome: string) {
    const ok = confirm(`Excluir "${nome}"?`);
    if (!ok) return;

    try {
      const h = makeHeaders(adminToken);
      const res = await fetch(`/api/admin/cities?id=${id}`, {
        method: "DELETE",
        headers: h,
      });

      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(`Falha ao excluir cidade: ${friendlyApiError(res.status, t)}`);
      }

      // também limpa permissões locais que referenciam essa cidade
      const novo = { ...perms };
      for (const k of Object.keys(novo)) {
        novo[k] = (novo[k] || []).filter((cid) => cid !== id);
      }
      setPerms(novo);
      savePerms(novo);

      await carregar();
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "Erro ao excluir cidade.");
    }
  }

  async function adicionarMedico() {
    const nome = novoNome.trim();
    const email = novoEmail.trim().toLowerCase();
    const senha = novaSenha.trim();
    const crm = novoCrm.trim() ? novoCrm.trim() : null;

    if (!nome || !email || !senha) return alert("Preencha Nome, E-mail e Senha.");

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
        throw new Error(`Falha ao criar médico: ${friendlyApiError(res.status, t)}`);
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

  async function excluirMedico(id: number, nome: string, email: string) {
    const ok = confirm(`Excluir médico "${nome}" (${email})?`);
    if (!ok) return;

    try {
      const h = makeHeaders(adminToken);
      const res = await fetch(`/api/admin/users?id=${id}`, {
        method: "DELETE",
        headers: h,
      });

      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(`Falha ao excluir médico: ${friendlyApiError(res.status, t)}`);
      }

      // remove permissões locais desse e-mail
      const emailKey = (email || "").toLowerCase();
      const novo = { ...perms };
      delete novo[emailKey];
      setPerms(novo);
      savePerms(novo);

      if ((emailPerm || "").toLowerCase() === emailKey) setEmailPerm("");

      await carregar();
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "Erro ao excluir médico.");
    }
  }

  // ===== permissões locais por email =====
  const emailKey = (emailPerm || "").trim().toLowerCase();
  const allowed = perms[emailKey] || [];

  function toggleCidadePerm(cidadeId: number) {
    if (!emailKey) return;
    const set = new Set(allowed);
    if (set.has(cidadeId)) set.delete(cidadeId);
    else set.add(cidadeId);

    const novo = { ...perms, [emailKey]: Array.from(set).sort((a, b) => a - b) };
    setPerms(novo);
  }

  function salvarPermissoes() {
    if (!emailKey) return alert("Selecione um médico (e-mail) para configurar permissões.");
    savePerms(perms);
    alert("Permissões salvas neste navegador (por e-mail).");
  }

  function liberarTodas() {
    if (!emailKey) return alert("Selecione um médico (e-mail).");
    const all = cidades.map((c) => c.id);
    const novo = { ...perms, [emailKey]: all };
    setPerms(novo);
  }

  function limparPerms() {
    if (!emailKey) return alert("Selecione um médico (e-mail).");
    const novo = { ...perms, [emailKey]: [] };
    setPerms(novo);
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
          {/* CIDADES */}
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
                  <li
                    key={c.id}
                    className="flex items-center justify-between border-b border-slate-100 py-2 gap-3"
                  >
                    <div className="min-w-0">
                      <div className="font-medium truncate">{c.nome}</div>
                      <div className="text-xs text-slate-400">#{c.id}</div>
                    </div>

                    <button
                      onClick={() => excluirCidade(c.id, c.nome)}
                      className="shrink-0 rounded-md border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-100"
                      title="Excluir cidade/local"
                    >
                      Excluir
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* MÉDICOS */}
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
                  <li key={m.id} className="border border-slate-100 rounded-lg p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold truncate">{m.nome}</span>
                          <span className="text-slate-400 text-xs">#{m.id}</span>
                        </div>
                        <div className="text-slate-600 truncate">{m.email}</div>
                        <div className="text-slate-500 text-xs">
                          perfil: {m.perfil} {m.crm ? `• CRM: ${m.crm}` : ""}
                        </div>
                      </div>

                      <button
                        onClick={() => excluirMedico(m.id, m.nome, m.email)}
                        className="shrink-0 rounded-md border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-100"
                        title="Excluir médico"
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

        {/* PERMISSÕES */}
        <section className="bg-white rounded-xl shadow-sm p-4 space-y-3">
          <h2 className="text-lg font-semibold">Permissões por médico (por e-mail)</h2>
          <p className="text-sm text-slate-500">
            Nesta versão, as permissões ficam salvas neste navegador (localStorage) por e-mail/login.
            Depois a gente leva isso para o banco.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <div className="md:col-span-1">
              <label className="text-sm font-medium">Médico</label>
              <select
                value={emailPerm}
                onChange={(e) => setEmailPerm(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="">Selecione...</option>
                {medicos.map((m) => (
                  <option key={m.id} value={m.email}>
                    {m.nome} — {m.email}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2 flex gap-2">
              <button
                onClick={liberarTodas}
                className="rounded-md border border-slate-300 px-3 py-2 text-xs font-medium hover:bg-slate-50"
              >
                Liberar todas
              </button>
              <button
                onClick={limparPerms}
                className="rounded-md border border-slate-300 px-3 py-2 text-xs font-medium hover:bg-slate-50"
              >
                Limpar
              </button>
              <button
                onClick={salvarPermissoes}
                className="rounded-md bg-slate-900 px-3 py-2 text-xs font-medium text-white hover:bg-slate-800"
              >
                Salvar permissões
              </button>
            </div>
          </div>

          {!emailKey ? (
            <p className="text-sm text-slate-500">Selecione um médico acima para marcar as cidades/locais permitidos.</p>
          ) : cidades.length === 0 ? (
            <p className="text-sm text-slate-500">Cadastre cidades/locais primeiro.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {cidades.map((c) => {
                const checked = allowed.includes(c.id);
                return (
                  <label
                    key={c.id}
                    className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleCidadePerm(c.id)}
                    />
                    <span className="truncate">{c.nome}</span>
                  </label>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
