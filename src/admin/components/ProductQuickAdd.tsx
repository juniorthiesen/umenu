import { Loader2, Plus } from "lucide-react";
import React, { useEffect, useState } from "react";
import { api } from "../../api";
import { ImageUploadControl } from "../../shared/components/ImageUploadControl";
import { Input } from "../../shared/components/Input";
import { Panel } from "../../shared/components/Panel";
import type { Category, PricingType } from "../../types";

const empty = {
  name: "",
  description: "",
  price: "0",
  pricingType: "UNIT" as PricingType,
  minQuantity: "1",
  stepQuantity: "1",
  imageUrl: "",
  categoryId: ""
};

export function ProductQuickAdd({
  establishmentId,
  categories,
  onCreated
}: {
  establishmentId: string;
  categories: Category[];
  onCreated: () => Promise<void> | void;
}) {
  const [form, setForm] = useState({ ...empty });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setForm((current) => ({
      ...current,
      categoryId: current.categoryId || categories[0]?.id || ""
    }));
  }, [categories]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.createProduct(establishmentId, {
        ...form,
        price: Number(form.price),
        minQuantity: form.minQuantity ? Number(form.minQuantity) : undefined,
        stepQuantity: Number(form.stepQuantity),
        imageUrl: form.imageUrl || undefined
      });
      setForm({ ...empty, categoryId: form.categoryId });
      await onCreated();
    } catch {
      setError("Não foi possível criar o produto.");
    } finally {
      setSaving(false);
    }
  };

  if (categories.length === 0) {
    return (
      <Panel>
        <h3 className="font-semibold">Novo produto</h3>
        <p className="mt-2 text-sm text-slate-500">Crie pelo menos uma categoria antes de cadastrar produtos.</p>
      </Panel>
    );
  }

  return (
    <Panel>
      <form onSubmit={submit} className="space-y-3">
        <div>
          <h3 className="font-semibold">Novo produto</h3>
          <p className="mt-1 text-sm text-slate-500">Adiciona ao cardápio. Você pode editar fotos e descrição depois.</p>
        </div>
        <label className="block text-sm font-medium text-slate-700">
          Categoria
          <select
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
            value={form.categoryId}
            onChange={(event) => setForm({ ...form, categoryId: event.target.value })}
            required
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Nome" value={form.name} onChange={(value) => setForm({ ...form, name: value })} required />
          <Input label="Preço" type="number" value={form.price} onChange={(value) => setForm({ ...form, price: value })} required />
        </div>
        <Input
          label="Descrição"
          value={form.description}
          onChange={(value) => setForm({ ...form, description: value })}
        />
        <Input label="Foto URL" value={form.imageUrl} onChange={(value) => setForm({ ...form, imageUrl: value })} />
        <ImageUploadControl
          label="Enviar foto"
          establishmentId={establishmentId}
          scope="product"
          nameHint={form.name || "produto"}
          onUploaded={(url) => setForm((current) => ({ ...current, imageUrl: url }))}
        />
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block text-sm font-medium text-slate-700">
            Tipo
            <select
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
              value={form.pricingType}
              onChange={(event) => setForm({ ...form, pricingType: event.target.value as PricingType })}
            >
              <option value="UNIT">Unidade</option>
              <option value="HUNDRED">Cento</option>
              <option value="KG">Kg</option>
            </select>
          </label>
          <Input label="Min." type="number" value={form.minQuantity} onChange={(value) => setForm({ ...form, minQuantity: value })} />
          <Input label="Passo" type="number" value={form.stepQuantity} onChange={(value) => setForm({ ...form, stepQuantity: value })} />
        </div>
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <button
          className="flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 disabled:bg-slate-400"
          disabled={saving}
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Adicionar produto
        </button>
      </form>
    </Panel>
  );
}
