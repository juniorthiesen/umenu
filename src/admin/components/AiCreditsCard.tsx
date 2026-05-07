import { Loader2, Save } from "lucide-react";
import React, { useEffect, useState } from "react";
import { api } from "../../api";
import { Input } from "../../shared/components/Input";
import { Panel } from "../../shared/components/Panel";
import type { EstablishmentDetail } from "../../types";

export function AiCreditsCard({
  establishment,
  canManage,
  reload
}: {
  establishment: EstablishmentDetail;
  canManage: boolean;
  reload: () => Promise<void> | void;
}) {
  const [credits, setCredits] = useState(String(establishment.aiImageCredits));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setCredits(String(establishment.aiImageCredits));
  }, [establishment.aiImageCredits]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      await api.setAiCredits(establishment.id, Number(credits));
      setMessage("Créditos atualizados.");
      await reload();
    } catch {
      setMessage("Não foi possível atualizar os créditos.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Panel>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="font-semibold">Créditos de imagem com IA</h3>
          <p className="mt-1 text-sm text-slate-500">
            Cada melhoria de foto consome 1 crédito do estabelecimento.
          </p>
        </div>
        <div className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-orange-700">Saldo atual</p>
          <p className="text-2xl font-semibold text-orange-950">{establishment.aiImageCredits}</p>
        </div>
      </div>

      {canManage && (
        <form onSubmit={submit} className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,280px)_auto] sm:items-end">
          <Input label="Definir saldo" type="number" value={credits} onChange={setCredits} step="1" min="0" />
          <button
            className="flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:bg-slate-400"
            disabled={saving}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar créditos
          </button>
          {message && <p className="text-sm text-slate-500 sm:col-span-2">{message}</p>}
        </form>
      )}
    </Panel>
  );
}
