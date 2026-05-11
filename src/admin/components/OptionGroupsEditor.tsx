import { ChevronDown, ChevronRight, Loader2, Plus, Sparkles, Trash2 } from "lucide-react";
import { useState } from "react";
import { api } from "../../api";
import { ConfirmDialog } from "../../shared/components/ConfirmDialog";
import { Input } from "../../shared/components/Input";
import { TEMPLATES } from "../../shared/templates/registry";
import type { PricingRule, ProductOptionGroup, SelectionType, Template } from "../../types";

const SELECTION_LABELS: Record<SelectionType, string> = {
  SINGLE: "Escolha 1 (radio)",
  MULTIPLE: "Múltipla escolha",
  QUANTITY: "Quantidade variável"
};

const PRICING_RULE_LABELS: Record<PricingRule, string> = {
  SUM: "Soma os adicionais",
  HIGHEST: "Cobra só o mais caro (ex.: meio-a-meio)",
  AVERAGE: "Média dos itens",
  REPLACE: "Substitui o preço base"
};

export function OptionGroupsEditor({
  productId,
  groups,
  template,
  reload
}: {
  productId: string;
  groups: ProductOptionGroup[];
  template: Template;
  reload: () => Promise<void> | void;
}) {
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [applyingPreset, setApplyingPreset] = useState<string | null>(null);
  const [presetError, setPresetError] = useState("");

  const createGroup = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await api.createOptionGroup(productId, { name: newName, displayOrder: groups.length });
      setNewName("");
      await reload();
    } finally {
      setCreating(false);
    }
  };

  const presets = TEMPLATES[template].productPresets;

  const applyPreset = async (presetKey: string) => {
    const preset = presets.find((p) => p.key === presetKey);
    if (!preset) return;

    setApplyingPreset(presetKey);
    setPresetError("");
    try {
      let order = groups.length;
      for (const group of preset.groups) {
        const created = await api.createOptionGroup(productId, {
          name: group.name,
          selectionType: group.selectionType,
          pricingRule: group.pricingRule,
          required: group.required,
          maxSelections: group.maxSelections,
          displayOrder: order++
        });
        let itemOrder = 0;
        for (const item of group.items) {
          await api.createOptionItem(created.id, {
            name: item.name,
            priceDelta: item.priceDelta,
            displayOrder: itemOrder++,
            isDefault: item.isDefault || false
          });
        }
      }
      await reload();
    } catch {
      setPresetError("Não foi possível aplicar o preset. Tenta de novo.");
    } finally {
      setApplyingPreset(null);
    }
  };

  const sorted = [...groups].sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div>
        <h4 className="font-semibold text-slate-900">Opções do produto</h4>
        <p className="mt-1 text-xs text-slate-500">
          Cadastre tamanhos, sabores, adicionais ou variações. Cada grupo define como o cliente escolhe e como o preço é calculado.
        </p>
      </div>

      {presets.length > 0 && (
        <div className="mt-4 rounded-lg border border-dashed border-orange-300 bg-orange-50/40 p-3">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-orange-800">
            <Sparkles className="h-3.5 w-3.5" />
            Presets do template {TEMPLATES[template].label}
          </p>
          <p className="mt-1 text-xs text-slate-600">
            Cria os grupos e itens prontos. Você ajusta depois.
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {presets.map((preset) => (
              <button
                key={preset.key}
                type="button"
                onClick={() => applyPreset(preset.key)}
                disabled={applyingPreset !== null}
                className="flex flex-col items-start gap-1 rounded-lg border border-orange-200 bg-white px-3 py-2 text-left text-xs transition hover:border-orange-400 hover:bg-orange-50 disabled:opacity-60"
              >
                <span className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  {applyingPreset === preset.key && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {preset.label}
                </span>
                <span className="text-slate-500">{preset.description}</span>
              </button>
            ))}
          </div>
          {presetError && <p className="mt-2 text-xs text-red-600">{presetError}</p>}
        </div>
      )}

      <div className="mt-4 space-y-3">
        {sorted.length === 0 && (
          <p className="rounded-lg border border-dashed border-slate-300 bg-white p-4 text-center text-sm text-slate-500">
            Nenhuma opção. Esse produto vai aparecer com adição rápida no cardápio.
          </p>
        )}
        {sorted.map((group) => (
          <OptionGroupRow key={group.id} group={group} reload={reload} />
        ))}
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto]">
        <input
          className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
          placeholder="Novo grupo (ex.: Tamanho, Borda, Adicionais…)"
          value={newName}
          onChange={(event) => setNewName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              createGroup();
            }
          }}
        />
        <button
          type="button"
          onClick={createGroup}
          disabled={creating || !newName.trim()}
          className="flex items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:bg-slate-400"
        >
          {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Adicionar grupo
        </button>
      </div>
    </div>
  );
}

function OptionGroupRow({
  group,
  reload
}: {
  group: ProductOptionGroup;
  reload: () => Promise<void> | void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [name, setName] = useState(group.name);
  const [selectionType, setSelectionType] = useState<SelectionType>(group.selectionType);
  const [pricingRule, setPricingRule] = useState<PricingRule>(group.pricingRule);
  const [required, setRequired] = useState(group.required);
  const [maxSelections, setMaxSelections] = useState(group.maxSelections?.toString() || "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("0");
  const [creatingItem, setCreatingItem] = useState(false);

  const saveGroup = async () => {
    setSaving(true);
    try {
      await api.updateOptionGroup(group.id, {
        name,
        selectionType,
        pricingRule,
        required,
        maxSelections: maxSelections ? Number(maxSelections) : undefined
      });
      await reload();
    } finally {
      setSaving(false);
    }
  };

  const removeGroup = async () => {
    await api.deleteOptionGroup(group.id);
    await reload();
    setDeleting(false);
  };

  const addItem = async () => {
    if (!newItemName.trim()) return;
    setCreatingItem(true);
    try {
      await api.createOptionItem(group.id, {
        name: newItemName,
        priceDelta: Number(newItemPrice) || 0,
        displayOrder: group.items.length
      });
      setNewItemName("");
      setNewItemPrice("0");
      await reload();
    } finally {
      setCreatingItem(false);
    }
  };

  const removeItem = async (itemId: string) => {
    await api.deleteOptionItem(itemId);
    await reload();
  };

  const sortedItems = [...group.items].sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="flex w-full items-center justify-between gap-3 p-4 text-left"
      >
        <div className="flex items-center gap-3">
          {expanded ? <ChevronDown className="h-4 w-4 text-slate-500" /> : <ChevronRight className="h-4 w-4 text-slate-500" />}
          <div>
            <p className="font-semibold text-slate-900">{group.name}</p>
            <p className="text-xs text-slate-500">
              {SELECTION_LABELS[group.selectionType]} · {sortedItems.length} {sortedItems.length === 1 ? "item" : "itens"}
              {group.required && " · obrigatório"}
            </p>
          </div>
        </div>
        <span
          className="inline-flex items-center gap-1 rounded-full border border-red-200 px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
          onClick={(event) => {
            event.stopPropagation();
            setDeleting(true);
          }}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </span>
      </button>

      {expanded && (
        <div className="space-y-4 border-t border-slate-200 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Nome do grupo" value={name} onChange={setName} />
            <label className="block text-sm font-medium text-slate-700">
              Tipo de seleção
              <select
                value={selectionType}
                onChange={(event) => setSelectionType(event.target.value as SelectionType)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
              >
                {Object.entries(SELECTION_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Regra de preço
              <select
                value={pricingRule}
                onChange={(event) => setPricingRule(event.target.value as PricingRule)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
              >
                {Object.entries(PRICING_RULE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>
            <Input
              label="Máx. de seleções (vazio = ilimitado)"
              type="number"
              value={maxSelections}
              onChange={setMaxSelections}
            />
          </div>

          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={required}
              onChange={(event) => setRequired(event.target.checked)}
            />
            Cliente é obrigado a escolher pelo menos um
          </label>

          <button
            type="button"
            onClick={saveGroup}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:bg-slate-400"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Salvar grupo
          </button>

          <div className="border-t border-slate-200 pt-4">
            <h5 className="font-semibold text-slate-900">Itens</h5>
            <div className="mt-3 space-y-2">
              {sortedItems.length === 0 && (
                <p className="text-xs text-slate-500">Sem itens ainda. Adicione abaixo.</p>
              )}
              {sortedItems.map((item) => (
                <div key={item.id} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2 text-sm">
                  <span className="flex-1 font-medium text-slate-800">{item.name}</span>
                  <span className="text-xs text-slate-500">
                    {pricingRule === "REPLACE"
                      ? `R$ ${item.priceDelta.toFixed(2)}`
                      : `${item.priceDelta > 0 ? "+" : ""}R$ ${item.priceDelta.toFixed(2)}`}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="rounded p-1 text-red-500 hover:bg-red-50"
                    aria-label={`Excluir ${item.name}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_120px_auto]">
              <input
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                placeholder="Nome do item"
                value={newItemName}
                onChange={(event) => setNewItemName(event.target.value)}
              />
              <input
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                placeholder="Preço"
                type="number"
                step="0.01"
                value={newItemPrice}
                onChange={(event) => setNewItemPrice(event.target.value)}
              />
              <button
                type="button"
                onClick={addItem}
                disabled={creatingItem || !newItemName.trim()}
                className="flex items-center justify-center gap-2 rounded-lg bg-orange-600 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:bg-slate-400"
              >
                {creatingItem ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Item
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deleting}
        destructive
        title="Excluir grupo de opções?"
        description={`O grupo "${group.name}" e todos os ${sortedItems.length} itens dele serão removidos. Pedidos antigos com essas opções ficam intactos.`}
        confirmLabel="Excluir grupo"
        onCancel={() => setDeleting(false)}
        onConfirm={removeGroup}
      />
    </div>
  );
}
