import { Loader2, Package, Save, Wand2, X } from "lucide-react";
import React, { useState } from "react";
import { createPortal } from "react-dom";
import { api, ApiError } from "../../api";
import { ImageUploadControl } from "../../shared/components/ImageUploadControl";
import { Input } from "../../shared/components/Input";
import { currency } from "../../shared/utils/currency";
import type { Category, PricingType, Product } from "../../types";

export function ProductEditModal({
  product,
  categories,
  aiImageCredits,
  close,
  onSaved
}: {
  product: Product;
  categories: Category[];
  aiImageCredits: number;
  close: () => void;
  onSaved: () => Promise<void>;
}) {
  const [form, setForm] = useState({
    categoryId: product.categoryId,
    name: product.name,
    description: product.description || "",
    price: String(product.price),
    pricingType: product.pricingType,
    minQuantity: String(product.minQuantity || 1),
    stepQuantity: String(product.stepQuantity || 1),
    imageUrl: product.imageUrl || "",
    isActive: product.isActive
  });
  const [saving, setSaving] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [localCredits, setLocalCredits] = useState(aiImageCredits);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.updateProduct(product.id, {
        categoryId: form.categoryId,
        name: form.name,
        description: form.description,
        price: Number(form.price),
        pricingType: form.pricingType,
        minQuantity: form.minQuantity ? Number(form.minQuantity) : undefined,
        stepQuantity: Number(form.stepQuantity),
        imageUrl: form.imageUrl || undefined,
        isActive: form.isActive
      });
      await onSaved();
    } catch {
      setError("Não foi possível salvar o produto.");
    } finally {
      setSaving(false);
    }
  };

  const enhanceImage = async () => {
    if (form.imageUrl !== (product.imageUrl || "")) {
      setError("Salve a foto enviada antes de melhorar com IA.");
      return;
    }

    setEnhancing(true);
    setError("");
    setNotice("");
    try {
      const result = await api.enhanceProductImage(product.id);
      setForm((current) => ({ ...current, imageUrl: result.image.url }));
      setLocalCredits(result.aiImageCredits);
      setNotice("Imagem melhorada com IA e salva no produto.");
    } catch (err) {
      const message =
        err instanceof ApiError && err.status === 402
          ? "Este estabelecimento não tem créditos de IA."
          : "Não foi possível melhorar a imagem com IA.";
      setError(message);
    } finally {
      setEnhancing(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <form onSubmit={submit} className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-xl bg-white p-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-xl font-semibold">Editar produto</h2>
            <p className="mt-1 text-sm text-slate-500">Altere preço, descrição, categoria, foto e disponibilidade.</p>
          </div>
          <button type="button" onClick={close} className="rounded-full p-2 transition hover:bg-slate-100" aria-label="Fechar edição">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[240px_1fr]">
          <aside className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="aspect-square overflow-hidden rounded-lg bg-white">
              {form.imageUrl ? (
                <img src={form.imageUrl} alt={form.name || product.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-slate-400">
                  <Package className="h-8 w-8" />
                </div>
              )}
            </div>
            <p className="mt-3 text-sm font-semibold text-slate-900">{form.name || "Nome do produto"}</p>
            <p className="mt-1 text-sm text-slate-500">{currency.format(Number(form.price) || 0)}</p>
            <span className={`mt-3 inline-flex rounded-md px-2 py-1 text-xs font-medium ${form.isActive ? "bg-green-50 text-green-700" : "bg-slate-200 text-slate-600"}`}>
              {form.isActive ? "Visível no cardápio" : "Oculto do cardápio"}
            </span>
          </aside>

          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Nome" value={form.name} onChange={(value) => setForm({ ...form, name: value })} required />
            <label className="block text-sm font-medium text-slate-700">
              Categoria
              <select
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                value={form.categoryId}
                onChange={(event) => setForm({ ...form, categoryId: event.target.value })}
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <Input label="Preço" type="number" value={form.price} onChange={(value) => setForm({ ...form, price: value })} required />
            <label className="block text-sm font-medium text-slate-700">
              Tipo de preço
              <select
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                value={form.pricingType}
                onChange={(event) => setForm({ ...form, pricingType: event.target.value as PricingType })}
              >
                <option value="UNIT">Unidade</option>
                <option value="HUNDRED">Cento</option>
                <option value="KG">Kg</option>
              </select>
            </label>
            <Input label="Quantidade mínima" type="number" value={form.minQuantity} onChange={(value) => setForm({ ...form, minQuantity: value })} />
            <Input label="Incremento" type="number" value={form.stepQuantity} onChange={(value) => setForm({ ...form, stepQuantity: value })} />
            <div className="md:col-span-2">
              <Input label="Foto URL" value={form.imageUrl} onChange={(value) => setForm({ ...form, imageUrl: value })} />
            </div>
            <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-2 md:col-span-2">
              <ImageUploadControl
                label="Enviar nova foto"
                establishmentId={product.establishmentId}
                scope="product"
                nameHint={form.name || product.name}
                onUploaded={(url) => {
                  setForm((current) => ({ ...current, imageUrl: url }));
                  setNotice("Foto otimizada. Salve o produto para aplicar.");
                }}
              />
              <div>
                <button
                  type="button"
                  onClick={enhanceImage}
                  disabled={enhancing || localCredits <= 0 || !product.imageUrl}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-orange-500 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {enhancing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                  Melhorar com IA
                </button>
                <p className="mt-1 text-xs text-slate-500">
                  Saldo: {localCredits} crédito{localCredits === 1 ? "" : "s"}. Custo: 1 por imagem.
                </p>
              </div>
            </div>
            <label className="md:col-span-2 block text-sm font-medium text-slate-700">
              Descrição
              <textarea
                className="mt-1 min-h-24 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
              />
            </label>
            <label className="md:col-span-2 flex items-center gap-2 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) => setForm({ ...form, isActive: event.target.checked })}
              />
              Produto visível no cardápio
            </label>
          </div>
        </div>

        {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        {notice && <p className="mt-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{notice}</p>}

        <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 pt-4">
          <button type="button" onClick={close} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium transition hover:bg-slate-50">
            Cancelar
          </button>
          <button className="flex items-center gap-2 rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:bg-slate-400" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar produto
          </button>
        </div>
      </form>
    </div>,
    document.body
  );
}
