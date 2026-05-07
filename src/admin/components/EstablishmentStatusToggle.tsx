import { useState } from "react";
import { api } from "../../api";
import { Panel } from "../../shared/components/Panel";
import type { EstablishmentDetail, EstablishmentStatus } from "../../types";

const OPTIONS: { value: EstablishmentStatus; label: string; description: string; tone: string }[] = [
  {
    value: "ACTIVE",
    label: "Ativo",
    description: "Cardápio público acessível normalmente.",
    tone: "border-green-500 bg-green-50 text-green-800"
  },
  {
    value: "SUSPENDED",
    label: "Suspenso",
    description: "Tenant ativo mas escondido do público.",
    tone: "border-amber-500 bg-amber-50 text-amber-800"
  },
  {
    value: "ARCHIVED",
    label: "Arquivado",
    description: "Não aparece para clientes nem na lista do tenant.",
    tone: "border-slate-500 bg-slate-100 text-slate-700"
  }
];

export function EstablishmentStatusToggle({
  establishment,
  reload
}: {
  establishment: EstablishmentDetail;
  reload: () => Promise<void> | void;
}) {
  const [saving, setSaving] = useState<EstablishmentStatus | null>(null);
  const [error, setError] = useState("");

  const change = async (status: EstablishmentStatus) => {
    if (status === establishment.status) return;
    setSaving(status);
    setError("");
    try {
      await api.updateEstablishment(establishment.id, { status });
      await reload();
    } catch {
      setError("Não foi possível alterar o status.");
    } finally {
      setSaving(null);
    }
  };

  return (
    <Panel>
      <div className="flex flex-col gap-1">
        <h3 className="font-semibold">Status do estabelecimento</h3>
        <p className="text-sm text-slate-500">
          Controla se o cardápio público fica visível e se o tenant aparece nas listas.
        </p>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {OPTIONS.map((option) => {
          const active = option.value === establishment.status;
          const isSaving = saving === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => change(option.value)}
              disabled={Boolean(saving)}
              className={`rounded-xl border-2 p-4 text-left transition disabled:opacity-60 ${
                active ? option.tone : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <p className="text-sm font-semibold">{option.label}</p>
              <p className="mt-1 text-xs text-slate-600">{option.description}</p>
              {isSaving && <p className="mt-2 text-xs font-medium text-slate-500">Salvando…</p>}
            </button>
          );
        })}
      </div>

      {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
    </Panel>
  );
}
