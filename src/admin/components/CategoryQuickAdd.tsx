import { Loader2, Plus } from "lucide-react";
import React, { useState } from "react";
import { api } from "../../api";
import { Input } from "../../shared/components/Input";
import { Panel } from "../../shared/components/Panel";

export function CategoryQuickAdd({
  establishmentId,
  defaultDisplayOrder,
  onCreated
}: {
  establishmentId: string;
  defaultDisplayOrder: number;
  onCreated: () => Promise<void> | void;
}) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError("");
    try {
      await api.createCategory(establishmentId, {
        name,
        displayOrder: defaultDisplayOrder
      });
      setName("");
      await onCreated();
    } catch {
      setError("Não foi possível criar a categoria.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Panel>
      <form onSubmit={submit} className="space-y-3">
        <div>
          <h3 className="font-semibold">Nova categoria</h3>
          <p className="mt-1 text-sm text-slate-500">Agrupa produtos no cardápio público.</p>
        </div>
        <Input label="Nome" value={name} onChange={setName} required />
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <button
          className="flex items-center gap-2 rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:bg-slate-400"
          disabled={saving}
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Adicionar categoria
        </button>
      </form>
    </Panel>
  );
}
