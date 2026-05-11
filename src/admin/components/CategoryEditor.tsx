import { ArrowDown, ArrowUp, Loader2, Save, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { api, ApiError } from "../../api";
import { ConfirmDialog } from "../../shared/components/ConfirmDialog";
import type { Category, Template } from "../../types";
import { ProductTable } from "./ProductTable";

export function CategoryEditor({
  category,
  categories,
  index,
  total,
  aiImageCredits,
  template,
  reload
}: {
  category: Category;
  categories: Category[];
  index: number;
  total: number;
  aiImageCredits: number;
  template: Template;
  reload: () => Promise<void> | void;
}) {
  const [name, setName] = useState(category.name);
  const [saving, setSaving] = useState(false);
  const [moving, setMoving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => setName(category.name), [category.name]);

  const saveName = async () => {
    if (!name.trim() || name === category.name) return;
    setSaving(true);
    try {
      await api.updateCategory(category.id, { name });
      await reload();
    } finally {
      setSaving(false);
    }
  };

  const move = async (direction: -1 | 1) => {
    const sorted = [...categories].sort((a, b) => a.displayOrder - b.displayOrder);
    const localIndex = sorted.findIndex((item) => item.id === category.id);
    const targetIndex = localIndex + direction;
    if (targetIndex < 0 || targetIndex >= sorted.length) return;

    const target = sorted[targetIndex];
    setMoving(true);
    try {
      await Promise.all([
        api.reorderCategory(category.id, target.displayOrder),
        api.reorderCategory(target.id, category.displayOrder)
      ]);
      await reload();
    } finally {
      setMoving(false);
    }
  };

  const remove = async () => {
    try {
      await api.deleteCategory(category.id);
      await reload();
      setDeleting(false);
    } catch (err) {
      if (err instanceof ApiError && err.message === "category_has_products") {
        throw new Error("Esvazie a categoria antes de excluir.");
      }
      throw new Error("Não foi possível excluir a categoria.");
    }
  };

  return (
    <section className="border-b border-slate-200 p-4 last:border-b-0 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <input
            className="w-full min-w-0 rounded-lg border border-transparent bg-slate-50 px-3 py-2 text-sm font-semibold outline-none focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-200"
            value={name}
            onChange={(event) => setName(event.target.value)}
            onBlur={saveName}
          />
          {saving && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-slate-500">{category.products.length} produtos</span>
          <button
            type="button"
            onClick={() => move(-1)}
            disabled={index === 0 || moving}
            className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 disabled:opacity-40"
            aria-label="Subir categoria"
            title="Subir"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => move(1)}
            disabled={index === total - 1 || moving}
            className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 disabled:opacity-40"
            aria-label="Descer categoria"
            title="Descer"
          >
            <ArrowDown className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={saveName}
            disabled={saving || name === category.name}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            <span className="hidden sm:inline">Salvar</span>
          </button>
          <button
            type="button"
            onClick={() => setDeleting(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-red-200 p-2 text-red-600 transition hover:bg-red-50"
            aria-label="Excluir categoria"
            title="Excluir categoria"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
        <ProductTable
          category={category}
          categories={categories}
          aiImageCredits={aiImageCredits}
          template={template}
          reload={reload}
        />
      </div>

      <ConfirmDialog
        open={deleting}
        destructive
        title="Excluir categoria?"
        description={
          category.products.length > 0
            ? `A categoria "${category.name}" tem ${category.products.length} produto(s). Esvazie antes de excluir.`
            : `A categoria "${category.name}" será removida.`
        }
        confirmLabel="Excluir categoria"
        onCancel={() => setDeleting(false)}
        onConfirm={remove}
      />
    </section>
  );
}
