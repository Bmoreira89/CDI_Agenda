"use client";

import { useEffect, useState } from "react";

interface Cidade {
  id: number;
  nome: string;
}

type PerfilTipo = "medico" | "admin";

interface Medico {
  id: number;
  nome: string;
  crm?: string | null;
  email?: string | null;
  perfil: PerfilTipo;
}

type Permissoes = Record<string, string[]>;

export default function AdminPage() {
  const [cidades, setCidades] = useState<Cidade[]>([]);
  const [medicos, setMedicos] = useState<Medico[]>([]);
  const [permissoes, setPermissoes] = useState<Permissoes>({});
  const [cidadeNome, setCidadeNome] = useState("");
  const [medicoNome, setMedicoNome] = useState("");
  const [medicoCrm, setMedicoCrm] = useState("");
  const [medicoEmail, setMedicoEmail] = useState("");
  const [medicoSenha, setMedicoSenha] = useState("");
  const [medicoPerfil, setMedicoPerfil] = useState<PerfilTipo>("medico");
  const [medicoSelecionado, setMedicoSelecionado] = useState("");

  const [loadingMedicos, setLoadingMedicos] = useState(false);
  const [erroMedicos, setErroMedicos] = useState("");
  const [loadingCidades, setLoadingCidades] = useState(false);
  const [erroCidades, setErroCidades] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedPerm = localStorage.getItem("agenda_cdi_permissoes");
    if (storedPerm) {
      try {
        setPermissoes(JSON.parse(storedPerm));
      } catch {
        setPermissoes({});
      }
    }

    carregarCidades();
    carregarMedicos();
  }, []);

  const carregarCidades = async () => {
    try {
      setLoadingCidades(true);
      setErroCidades("");
      const res = await fetch("/api/cidades");
      if (!res.ok) throw new Error("Erro ao carregar cidades");
      const data: Cidade[] = await res.json();
      setCidades(data);
    } catch (err: any) {
      console.error(err);
      setErroCidades("Não foi possível carregar a lista de cidades/locais.");
    } finally {
      setLoadingCidades(false);
    }
  };

  const carregarMedicos = async () => {
    try {
      setLoadingMedicos(true);
      setErroMedicos("");
      const res = await fetch("/api/medicos");
      if (!res.ok) throw new Error("Erro ao carregar médicos");
      const data: Medico[] = await res.json();
      setMedicos(data);
    } catch (err: any) {
      console.error(err);
      setErroMedicos("Não foi possível carregar a lista de médicos.");
    } finally {
      setLoadingMedicos(false);
    }
  };

  const salvarPermissoesLocal = (obj: Permissoes) => {
    setPermissoes(obj);
    if (typeof window !== "undefined") {
      localStorage.setItem("agenda_cdi_permissoes", JSON.stringify(obj));
    }
  };

  const handleSalvarPermissoesClick = () => {
    try {
      salvarPermissoesLocal(permissoes);
      alert("Permissões salvas neste computador!");
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar as permissões.");
    }
  };

  const handleAdicionarCidade = async () => {
    const nome = cidadeNome.trim();
    if (!nome) return;

    try {
      const res = await fetch("/api/cidades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Erro ao criar cidade/local.");
        return;
      }

      setCidades((prev) => [...prev, data]);
      setCidadeNome("");
    } catch (error) {
      console.error(error);
      alert("Erro ao comunicar com o servidor (cidades).");
    }
  };

  const handleAdicionarMedico = async () => {
    const nome = medicoNome.trim();
    const email = medicoEmail.trim();
    const senha = medicoSenha.trim();

    if (!nome || !email || !senha) {
      alert("Nome, e-mail e senha são obrigatórios.");
      return;
    }

    try {
      const res = await fetch("/api/medicos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome,
          crm: medicoCrm.trim() || null,
          email,
          senha,
          perfil: medicoPerfil,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Erro ao criar médico.");
        return;
      }

      setMedicos((prev) => [
        ...prev,
        {
          id: data.id,
          nome: data.nome,
          email: data.email,
          perfil: data.perfil as PerfilTipo,
          crm: data.crm,
        },
      ]);

      setMedicoNome("");
      setMedicoCrm("");
      setMedicoEmail("");
      setMedicoSenha("");
      setMedicoPerfil("medico");
    } catch (error) {
      console.error(error);
      alert("Erro ao comunicar com o servidor (médicos).");
    }
  };

  const togglePermissao = (medicoId: string, cidadeNome: string) => {
    const atual = permissoes[medicoId] || [];
    let atualizado: string[];

    if (atual.includes(cidadeNome)) {
      atualizado = atual.filter((c) => c !== cidadeNome);
    } else {
      atualizado = [...atual, cidadeNome];
    }

    const novoObj: Permissoes = {
      ...permissoes,
      [medicoId]: atualizado,
    };

    salvarPermissoesLocal(novoObj);
  };

  const handleRedefinirSenha = async (medico: Medico) => {
    const nova = prompt(`Nova senha para ${medico.nome}:`);
    if (!nova) return;

    try {
      const res = await fetch("/api/medicos/reset-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ medicoId: medico.id, novaSenha: nova }),
      });

      if (!res.ok) {
        alert("Erro ao redefinir senha.");
        return;
      }

      alert("Senha redefinida com sucesso!");
    } catch (error) {
      console.error(error);
      alert("Erro ao comunicar com o servidor (redefinição de senha).");
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto space-y-4">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold">Painel do administrador</h1>
          <p className="text-sm text-slate-500">
            Cadastre cidades/locais, médicos (no banco) e quais locais cada
            médico pode agendar exames.
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-2">
          {/* Cidades */}
          <div className="bg-white rounded-xl shadow-sm p-4 space-y-3 text-sm">
            <h2 className="text-base font-semibold">Cidades / Locais</h2>
            <div className="flex gap-2">
              <input
                type="text"
                value={cidadeNome}
                onChange={(e) => setCidadeNome(e.target.value)}
                placeholder="Ex: São Manuel - TC"
                className="flex-1 rounded-md border border-slate-300 px-3 py-2"
              />
              <button
                onClick={handleAdicionarCidade}
                className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
              >
                Adicionar
              </button>
            </div>

            {loadingCidades && (
              <p className="text-xs text-slate-500 mt-1">
                Carregando cidades...
              </p>
            )}
            {erroCidades && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-md px-2 py-1 mt-1">
                {erroCidades}
              </p>
            )}

            <ul className="space-y-1 mt-1">
              {cidades.length === 0 && !loadingCidades && (
                <li className="text-slate-500">
                  Nenhuma cidade cadastrada ainda.
                </li>
              )}
              {cidades.map((c) => (
                <li key={c.id}>• {c.nome}</li>
              ))}
            </ul>
          </div>

          {/* Médicos */}
          <div className="bg-white rounded-xl shadow-sm p-4 space-y-3 text-sm">
            <h2 className="text-base font-semibold">Médicos (banco)</h2>

            <input
              type="text"
              value={medicoNome}
              onChange={(e) => setMedicoNome(e.target.value)}
              placeholder="Nome do médico"
              className="w-full rounded-md border border-slate-300 px-3 py-2"
            />
            <input
              type="text"
              value={medicoCrm}
              onChange={(e) => setMedicoCrm(e.target.value)}
              placeholder="CRM (opcional)"
              className="w-full rounded-md border border-slate-300 px-3 py-2"
            />
            <input
              type="email"
              value={medicoEmail}
              onChange={(e) => setMedicoEmail(e.target.value)}
              placeholder="E-mail de login"
              className="w-full rounded-md border border-slate-300 px-3 py-2"
            />
            <input
              type="password"
              value={medicoSenha}
              onChange={(e) => setMedicoSenha(e.target.value)}
              placeholder="Senha de acesso"
              className="w-full rounded-md border border-slate-300 px-3 py-2"
            />

            <div className="space-y-1">
              <label className="block text-slate-600">Perfil</label>
              <select
                value={medicoPerfil}
                onChange={(e) =>
                  setMedicoPerfil(
                    e.target.value === "admin" ? "admin" : "medico"
                  )
                }
                className="w-full rounded-md border border-slate-300 px-3 py-2"
              >
                <option value="medico">Médico</option>
                <option value="admin">Administrador</option>
              </select>
            </div>

            <button
              onClick={handleAdicionarMedico}
              className="mt-2 rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Adicionar médico
            </button>

            {loadingMedicos && (
              <p className="text-xs text-slate-500 mt-2">
                Carregando médicos...
              </p>
            )}
            {erroMedicos && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-md px-2 py-1 mt-2">
                {erroMedicos}
              </p>
            )}

            <ul className="space-y-1 mt-2">
              {medicos.length === 0 && !loadingMedicos && (
                <li className="text-slate-500">
                  Nenhum médico cadastrado ainda.
                </li>
              )}
              {medicos.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between border-b py-1"
                >
                  <span>
                    • {m.nome}{" "}
                    {m.crm && <span>(CRM {m.crm})</span>}{" "}
                    {m.email && (
                      <span className="text-slate-500"> - {m.email}</span>
                    )}{" "}
                    {m.perfil === "admin" && (
                      <span className="text-amber-700 font-semibold">
                        {" "}
                        [admin]
                      </span>
                    )}
                  </span>
                  <button
                    onClick={() => handleRedefinirSenha(m)}
                    className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-500"
                  >
                    Redefinir senha
                  </button>
                </div>
              ))}
            </ul>
          </div>
        </section>

        {/* Permissões */}
        <section className="bg-white rounded-xl shadow-sm p-4 space-y-3 text-sm">
          <h2 className="text-base font-semibold">Permissões por médico</h2>
          <p className="text-slate-500">
            Selecione um médico e marque as cidades em que ele pode agendar
            exames. (As permissões ainda são salvas localmente neste
            computador.)
          </p>

          <select
            value={medicoSelecionado}
            onChange={(e) => setMedicoSelecionado(e.target.value)}
            className="min-w-[220px] rounded-md border border-slate-300 px-3 py-2"
          >
            <option value="">Selecione um médico</option>
            {medicos.map((m) => (
              <option key={m.id} value={String(m.id)}>
                {m.nome}
              </option>
            ))}
          </select>

          {medicoSelecionado && (
            <div className="space-y-2">
              <p className="text-slate-600">Cidades permitidas:</p>
              <div className="flex flex-wrap gap-3">
                {cidades.length === 0 && (
                  <span className="text-slate-500">
                    Nenhuma cidade cadastrada.
                  </span>
                )}
                {cidades.map((c) => {
                  const marcado =
                    (permissoes[medicoSelecionado] || []).includes(c.nome);
                  return (
                    <label key={c.id} className="flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={marcado}
                        onChange={() =>
                          togglePermissao(medicoSelecionado, c.nome)
                        }
                      />
                      <span>{c.nome}</span>
                    </label>
                  );
                })}
              </div>

              <div className="mt-3">
                <button
                  type="button"
                  onClick={handleSalvarPermissoesClick}
                  className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
                >
                  Salvar permissões
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
