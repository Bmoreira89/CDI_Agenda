"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type PerfilTipo = "medico" | "admin";

type Cidade = { id: number; nome: string };
type Usuario = { id: number; nome: string; email: string; crm: string | null; perfil: PerfilTipo };

function getAuthHeaders() {
  if (typeof window === "undefined") return {};
  const id = localStorage.getItem("agenda_cdi_user_id");
  if (!id) return {};
  return { "x-user-id": String(id) };
}

export default function AdminPage() {
  const router = useRouter();

  const [perfil, setPerfil] = useState<PerfilTipo>("medico");
  const [userId, setUserId] = useState<number | null>(null);

  const [cidades, setCidades] = useState<Cidade[]>([]);
  const [medicos, setMedicos] = useState<Usuario[]>([]);

  const [cidadeNome, setCidadeNome] = useState("");
  const [novoNome, setNovoNome] = useState("");
  const [novoCRM, setNovoCRM] = useState("");
  const [novoEmail, setNovoEmail] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [novoPerfil, setNovoPerfil] = useState<PerfilTipo>("medico");

  const [erroCidades, setErroCidades] = useState("");
  const [erroMedicos, setErroMedicos] = useState("");

  // permissões continuam locais (como você já tinha)
  const [permissoes, setPermissoes] = useState<Record<string, string[]>>({});
  const [medicoSelecionado, setMedicoSelecionado] = useState<string>("");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedPerfil = localStorage.getItem("agenda_cdi_perfil");
    const storedUserId = localStorage.getItem("agenda_cdi_user_id");

    const perfilAtual: PerfilTipo = storedPerfil === "admin" ? "admin" : "medico";
    setPerfil(perfilAtual);

    if (storedUserId && !Number.isNaN(Number(storedUserId))) {
      setUserId(Number(storedUserId));
    }

    const storedPerm = localStorage.getItem("agenda_cdi_permissoes");
    if (storedPerm) {
      try {
        setPermissoes(JSON.parse(storedPerm));
      } catch {
        setPermissoes({});
      }
    }
  }, []);

  useEffect(() => {
    // se não for admin, volta pro calendário
    if (perfil !== "admin") return;
    carregarTudo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [perfil]);

  async function carregarTudo() {
    await Promise.all([carregarCidades(), carregarMedicos()]);
  }

  async function carregarCidades() {
    setErroCidades("");
    try {
      const res = await fetch("/api/admin/cities", {
        method: "GET",
        headers: { ...getAuthHeaders() },
        cache: "no-store",
      });

      if (res.status === 401) {
        alert("unauthorized (admin). Faça login novamente.");
        router.push("/login");
        return;
      }

      if (!res.ok) throw new Error("Erro ao carregar cidades");
      const data: Cidade[] = await res.json();
      setCidades(data);
    } catch (e) {
      console.error(e);
      setErroCidades("Não foi possível carregar a lista de cidades/locais.");
    }
  }

  async function carregarMedicos() {
    setErroMedicos("");
    try {
      const res = await fetch("/api/admin/users", {
        method: "GET",
        headers: { ...getAuthHeaders() },
        cache: "no-store",
      });

      if (res.status === 401) {
        alert("unauthorized (admin). Faça login novamente.");
        router.push("/login");
        return;
      }

      if (!res.ok) throw new Error("Erro ao carregar médicos");
      const data: Usuario[] = await res.json();
      setMedicos(data);
    } catch (e) {
      console.error(e);
      setErroMedicos("Não foi possível carregar a lista de médicos.");
    }
  }

  async function adicionarCidade() {
    const nome = cidadeNome.trim();
    if (!nome) return;

    try {
      const res = await fetch("/api/admin/cities", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ nome }),
      });

      const json = await res.json().catch(() => ({}));

      if (res.status === 401) {
        alert("unauthorized");
        router.push("/login");
        return;
      }

      if (!res.ok) {
        alert(json?.error || "Erro ao criar cidade");
        return;
      }

      setCidadeNome("");
      await carregarCidades();
    } catch (e) {
      console.error(e);
      alert("Erro ao comunicar com o servidor (cidades).");
    }
  }

  async function adicionarMedico() {
    const nome = novoNome.trim();
    const email = novoEmail.trim().toLowerCase();
    const senha = novaSenha.trim();
    const crm = novoCRM.trim() || null;
    const perfilSel: PerfilTipo = novoPerfil === "admin" ? "admin" : "medico";

    if (!nome || !email || !senha) {
      alert("Preencha nome, e-mail e senha.");
      return;
    }

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ nome, email, senha, crm, perfil: perfilSel }),
      });

      const json = await res.json().catch(() => ({}));

      if (res.status === 401) {
        alert("unauthorized");
        router.push("/login");
        return;
      }

      if (!res.ok) {
        alert(json?.error || "Erro ao criar médico");
        return;
      }

      setNovoNome("");
      setNovoCRM("");
      setNovoEmail("");
      setNovaSenha("");
      setNovoPerfil("medico");
      await carregarMedicos();
    } catch (e) {
      console.error(e);
      alert("Erro ao comunicar com o servidor (médicos).");
    }
  }

  const cidadesNomes = useMemo(() => cidades.map((c) => c.nome), [cidades]);

  function togglePermissao(cidade: string) {
    if (!medicoSelecionado) return;
    const atual = permissoes[medicoSelecionado] || [];
    const existe = atual.includes(cidade);
    const novo = existe ? atual.filter((x) => x !== cidade) : [...atual, cidade];
    const updated = { ...permissoes, [medicoSelecionado]: novo };
    setPermissoes(updated);
    localStorage.setItem("agenda_cdi_permissoes", JSON.stringify(updated));
  }

  function sair() {
    if (typeof window !== "undefined") localStorage.clear();
    router.push("/login");
  }

  if (perfil !== "admin") {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold mb-2">Acesso restrito</h1>
        <p className="mb-4">Você não está como administrador.</p>
        <button className="px-4 py-2 rounded bg-black text-white" onClick={() => router.push("/calendario")}>
          Ir para o calendário
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Painel do administrador</h1>
          <p className="text-sm opacity-70">
            Cadastre cidades/locais, médicos (no banco) e quais locais cada médico pode agendar exames.
          </p>
          <p className="text-xs opacity-60 mt-1">Admin ID logado: {userId ?? "?"}</p>
        </div>
        <button onClick={sair} className="px-4 py-2 rounded bg-black text-white">
          Sair
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CIDADES */}
        <div className="bg-white rounded-lg border p-4">
          <h2 className="font-semibold mb-3">Cidades / Locais</h2>
          <div className="flex gap-2">
            <input
              className="border rounded px-3 py-2 flex-1"
              placeholder="Ex: São Manuel - TC"
              value={cidadeNome}
              onChange={(e) => setCidadeNome(e.target.value)}
            />
            <button className="px-4 py-2 rounded bg-black text-white" onClick={adicionarCidade}>
              Adicionar
            </button>
          </div>

          {erroCidades && <div className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 p-2 rounded">{erroCidades}</div>}

          <div className="mt-4 text-sm">
            {cidades.length === 0 ? (
              <div className="opacity-70">Nenhuma cidade cadastrada ainda.</div>
            ) : (
              <ul className="list-disc pl-5">
                {cidades.map((c) => (
                  <li key={c.id}>{c.nome}</li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* MEDICOS */}
        <div className="bg-white rounded-lg border p-4">
          <h2 className="font-semibold mb-3">Médicos (banco)</h2>

          <div className="space-y-2">
            <input className="border rounded px-3 py-2 w-full" placeholder="Nome do médico" value={novoNome} onChange={(e) => setNovoNome(e.target.value)} />
            <input className="border rounded px-3 py-2 w-full" placeholder="CRM (opcional)" value={novoCRM} onChange={(e) => setNovoCRM(e.target.value)} />
            <input className="border rounded px-3 py-2 w-full" placeholder="E-mail" value={novoEmail} onChange={(e) => setNovoEmail(e.target.value)} />
            <input className="border rounded px-3 py-2 w-full" placeholder="Senha" type="password" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} />

            <div className="flex items-center gap-2">
              <label className="text-sm opacity-70">Perfil</label>
              <select className="border rounded px-3 py-2" value={novoPerfil} onChange={(e) => setNovoPerfil(e.target.value as PerfilTipo)}>
                <option value="medico">Médico</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <button className="px-4 py-2 rounded bg-black text-white" onClick={adicionarMedico}>
              Adicionar médico
            </button>
          </div>

          {erroMedicos && <div className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 p-2 rounded">{erroMedicos}</div>}

          <div className="mt-4 text-sm">
            {medicos.length === 0 ? (
              <div className="opacity-70">Nenhum médico cadastrado ainda.</div>
            ) : (
              <ul className="list-disc pl-5">
                {medicos.map((m) => (
                  <li key={m.id}>
                    {m.nome} — {m.email} ({m.perfil})
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* PERMISSOES */}
      <div className="bg-white rounded-lg border p-4 mt-6">
        <h2 className="font-semibold mb-2">Permissões por médico</h2>
        <p className="text-sm opacity-70 mb-3">
          Selecione um médico e marque as cidades em que ele pode agendar exames. (As permissões ainda ficam salvas localmente neste computador.)
        </p>

        <select
          className="border rounded px-3 py-2 w-full md:w-80"
          value={medicoSelecionado}
          onChange={(e) => setMedicoSelecionado(e.target.value)}
        >
          <option value="">Selecione um médico</option>
          {medicos.map((m) => (
            <option key={m.id} value={String(m.id)}>
              {m.nome} ({m.perfil})
            </option>
          ))}
        </select>

        {medicoSelecionado && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-2">
            {cidadesNomes.map((c) => {
              const atual = permissoes[medicoSelecionado] || [];
              const marcado = atual.includes(c);
              return (
                <label key={c} className="flex items-center gap-2 border rounded p-2">
                  <input type="checkbox" checked={marcado} onChange={() => togglePermissao(c)} />
                  <span className="text-sm">{c}</span>
                </label>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
