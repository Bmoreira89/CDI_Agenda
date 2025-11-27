"use client";

import React from "react";

interface MedicoResumo {
  id: number;
  nome: string;
}

interface CityModalProps {
  isOpen: boolean;
  dateLabel: string;
  cidades: string[];

  // infos do médico
  isAdmin: boolean;
  medicos?: MedicoResumo[];
  selectedMedicoId?: number | null;
  onSelectMedico?: (id: number | null) => void;

  // cidade escolhida
  onSelectCidade: (cidade: string) => void;
  onClose: () => void;
}

export function CityModal({
  isOpen,
  dateLabel,
  cidades,
  isAdmin,
  medicos = [],
  selectedMedicoId,
  onSelectMedico,
  onSelectCidade,
  onClose,
}: CityModalProps) {
  if (!isOpen) return null;

  const handleChangeMedico = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!onSelectMedico) return;
    const value = e.target.value;
    if (!value) {
      onSelectMedico(null);
    } else {
      onSelectMedico(Number(value));
    }
  };

  const medicoObrigatorioNaoEscolhido =
    isAdmin && medicos.length > 0 && !selectedMedicoId;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <h2 className="text-lg font-semibold mb-1">Escolha a cidade / local</h2>
        <p className="text-sm text-gray-600 mb-4">
          Selecione onde serão lançados os exames para o dia{" "}
          <span className="font-semibold">{dateLabel}</span>.
        </p>

        {isAdmin && (
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">
              Médico responsável
            </label>
            {medicos.length === 0 ? (
              <p className="text-xs text-red-600">
                Nenhum médico encontrado. Cadastre médicos no painel Admin.
              </p>
            ) : (
              <select
                className="w-full border rounded-md px-3 py-2 text-sm"
                value={selectedMedicoId ?? ""}
                onChange={handleChangeMedico}
              >
                <option value="">Selecione o médico...</option>
                {medicos.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nome}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
          {cidades.map((cidade) => (
            <button
              key={cidade}
              type="button"
              onClick={() => onSelectCidade(cidade)}
              disabled={medicoObrigatorioNaoEscolhido}
              className={`w-full text-left px-3 py-2 rounded-md border text-sm hover:bg-gray-50 ${
                medicoObrigatorioNaoEscolhido
                  ? "opacity-60 cursor-not-allowed"
                  : "cursor-pointer"
              }`}
            >
              {cidade}
            </button>
          ))}
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-sm rounded-md border hover:bg-gray-50"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
