import { ArrowDown, ArrowUp, Edit3, Eye, EyeOff, Loader2, Package, Trash2 } from "lucide-react";
import { useState } from "react";
import { api, ApiError } from "../../api";
import { ConfirmDialog } from "../../shared/components/ConfirmDialog";
import { currency } from "../../shared/utils/currency";
import type { Category, Product } from "../../types";
import { ProductEditModal } from "./ProductEditModal";

const PRICING_LABEL: Record<Product["pricingType"], string> = {
  UNIT: "Unidade",
  HUNDRED: "Cento",
  KG: "Kg"
};

export function ProductTable({
  category,
  categories,
  aiImageCredits,
  reload
}: {
  category: Category;
  categories: Category[];
  aiImageCredits: number;
  reload: () => Promise<void> | void;
}) {
  const [editing, setEditing] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const toggle = async (product: Product) => {
    setBusyId(product.id);
    try {
      await api.updateProduct(product.id, { isActive: !product.isActive });
      await reload();
    } finally {
      setBusyId(null);
    }
  };

  const move = async (product: Product, direction: -1 | 1) => {
    const ordered = [...category.products].sort((a, b) => a.displayOrder - b.displayOrder);
    const index = ordered.findIndex((item) => item.id === product.id);
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= ordered.length) return;

    const target = ordered[targetIndex];
    setBusyId(product.id);
    try {
      await Promise.all([
        api.reorderProduct(product.id, target.displayOrder),
        api.reorderProduct(target.id, product.displayOrder)
      ]);
      await reload();
    } finally {
      setBusyId(null);
    }
  };

  const remove = async () => {
    if (!deleting) return;
    try {
      await api.deleteProduct(deleting.id);
      await reload();
      setDeleting(null);
    } catch (err) {
      throw new Error(err instanceof ApiError ? "Falha ao excluir o produto." : "Erro desconhecido.");
    }
  };

  if (category.products.length === 0) {
    return <p className="p-4 text-sm text-slate-500">Categoria sem produtos.</p>;
  }

  const sorted = [...category.products].sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Produto</th>
              <th className="px-4 py-3">Preço</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {sorted.map((product, index) => (
              <tr key={product.id} className="transition hover:bg-slate-50/70">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-slate-400">
                          <Package className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="max-w-[260px] truncate text-xs text-slate-500">
                        {product.description || "Sem descrição"}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 font-medium">{currency.format(product.price)}</td>
                <td className="px-4 py-3 text-slate-500">{PRICING_LABEL[product.pricingType]}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-md px-2 py-1 text-xs font-medium ${
                      product.isActive ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {product.isActive ? "Ativo" : "Oculto"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-1.5">
                    <button
                      className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 disabled:opacity-40"
                      onClick={() => move(product, -1)}
                      disabled={index === 0 || busyId === product.id}
                      aria-label={`Mover ${product.name} para cima`}
                      title="Subir"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button
                      className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 disabled:opacity-40"
                      onClick={() => move(product, 1)}
                      disabled={index === sorted.length - 1 || busyId === product.id}
                      aria-label={`Mover ${product.name} para baixo`}
                      title="Descer"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </button>
                    <button
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700"
                      onClick={() => setEditing(product)}
                      aria-label={`Editar ${product.name}`}
                      title="Editar"
                    >
                      <Edit3 className="h-4 w-4" />
                      Editar
                    </button>
                    <button
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                      onClick={() => toggle(product)}
                      disabled={busyId === product.id}
                      aria-label={`${product.isActive ? "Ocultar" : "Exibir"} ${product.name}`}
                      title={product.isActive ? "Ocultar" : "Exibir"}
                    >
                      {busyId === product.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : product.isActive ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      className="inline-flex items-center gap-2 rounded-lg border border-red-200 p-2 text-red-600 transition hover:bg-red-50"
                      onClick={() => setDeleting(product)}
                      aria-label={`Excluir ${product.name}`}
                      title="Excluir"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <ProductEditModal
          product={editing}
          categories={categories}
          aiImageCredits={aiImageCredits}
          close={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null);
            await reload();
          }}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        destructive
        title="Excluir produto?"
        description={
          deleting
            ? `Esta ação remove "${deleting.name}" definitivamente. Não dá para desfazer.`
            : ""
        }
        confirmLabel="Excluir produto"
        onCancel={() => setDeleting(null)}
        onConfirm={remove}
      />
    </>
  );
}
