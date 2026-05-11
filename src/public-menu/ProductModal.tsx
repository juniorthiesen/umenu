import { CheckCircle2, Minus, Package, Plus, ShoppingCart, X } from "lucide-react";
import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import type { PricingType, ProductOptionGroup } from "../types";
import { currency } from "../shared/utils/currency";
import {
  calculateLineTotal,
  defaultSelectionsFor,
  type SelectedOptions,
  validateSelections
} from "./pricing";

export interface ProductModalProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  pricingType: PricingType;
  minQuantity: number | null;
  stepQuantity: number;
  imageUrl: string | null;
  allowsNotes: boolean;
  optionGroups: ProductOptionGroup[];
}

const getMinimum = (product: ProductModalProduct) =>
  product.minQuantity || (product.pricingType === "HUNDRED" ? 25 : 1);

const getStep = (product: ProductModalProduct) =>
  product.stepQuantity || (product.pricingType === "HUNDRED" ? 25 : 1);

const normalizeQty = (value: number, product: ProductModalProduct) => {
  const precision = product.pricingType === "KG" ? 3 : 0;
  return Number(Math.max(0, value).toFixed(precision));
};

const getPricingLabel = (type: PricingType) => {
  if (type === "HUNDRED") return "cento";
  if (type === "KG") return "kg";
  return "un.";
};

export interface ProductModalSubmit {
  selectedOptions: SelectedOptions;
  quantity: number;
  notes: string;
}

export function ProductModal({
  product,
  onClose,
  onAdd
}: {
  product: ProductModalProduct;
  onClose: () => void;
  onAdd: (submission: ProductModalSubmit) => void;
}) {
  const minimum = getMinimum(product);
  const step = getStep(product);
  const [selected, setSelected] = useState<SelectedOptions>(() =>
    defaultSelectionsFor(product.optionGroups)
  );
  const [quantity, setQuantity] = useState<number>(minimum);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const total = useMemo(() => calculateLineTotal(product, selected, quantity), [product, selected, quantity]);

  const toggleSingle = (groupId: string, itemId: string, required: boolean) => {
    setError("");
    setSelected((current) => {
      const currentIds = current[groupId] || [];
      const isSelected = currentIds.includes(itemId);
      if (isSelected && !required) {
        return { ...current, [groupId]: [] };
      }
      return { ...current, [groupId]: [itemId] };
    });
  };

  const toggleMultiple = (groupId: string, itemId: string, maxSelections: number | null) => {
    setError("");
    setSelected((current) => {
      const currentIds = current[groupId] || [];
      if (currentIds.includes(itemId)) {
        return { ...current, [groupId]: currentIds.filter((id) => id !== itemId) };
      }
      if (maxSelections && currentIds.length >= maxSelections) {
        return current;
      }
      return { ...current, [groupId]: [...currentIds, itemId] };
    });
  };

  const changeQty = (direction: 1 | -1) => {
    setError("");
    setQuantity((current) => {
      if (direction > 0) {
        return normalizeQty(current <= 0 ? minimum : current + step, product);
      }
      if (current <= minimum) return 0;
      return normalizeQty(Math.max(minimum, current - step), product);
    });
  };

  const submit = () => {
    if (quantity <= 0) {
      setError(`Quantidade mínima: ${minimum} ${getPricingLabel(product.pricingType)}`);
      return;
    }
    const validation = validateSelections(product.optionGroups, selected);
    if (!validation.ok) {
      setError(validation.reason);
      return;
    }
    onAdd({ selectedOptions: selected, quantity, notes: notes.trim() });
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-h-[90vh] sm:rounded-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="relative">
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name} className="h-52 w-full object-cover sm:h-64" />
          ) : (
            <div className="flex h-52 w-full items-center justify-center bg-slate-100 text-slate-400 sm:h-64">
              <Package className="h-12 w-12" />
            </div>
          )}
          <button
            onClick={onClose}
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow hover:bg-white"
            aria-label="Fechar"
          >
            <X className="h-5 w-5 text-slate-700" />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto p-5">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">{product.name}</h2>
            {product.description && (
              <p className="mt-1 text-sm leading-6 text-slate-600">{product.description}</p>
            )}
            <p className="mt-2 text-sm text-slate-500">
              A partir de <strong className="text-slate-900">{currency.format(product.price)}</strong> / {getPricingLabel(product.pricingType)}
            </p>
          </div>

          {product.optionGroups.map((group) => (
            <OptionGroupField
              key={group.id}
              group={group}
              selected={selected[group.id] || []}
              onToggleSingle={(itemId) => toggleSingle(group.id, itemId, group.required)}
              onToggleMultiple={(itemId) => toggleMultiple(group.id, itemId, group.maxSelections)}
            />
          ))}

          {product.allowsNotes && (
            <div>
              <label className="text-sm font-semibold text-slate-800">Observação</label>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value.slice(0, 500))}
                placeholder="Ex.: sem cebola, bem passado…"
                className="mt-2 min-h-20 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand-soft"
              />
              <p className="mt-1 text-xs text-slate-500">{notes.length}/500</p>
            </div>
          )}

          <div>
            <label className="text-sm font-semibold text-slate-800">Quantidade</label>
            <div className="mt-2 flex items-center justify-center gap-3 rounded-xl bg-slate-50 p-2">
              <button
                type="button"
                onClick={() => changeQty(-1)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow hover:bg-slate-100"
                aria-label="Diminuir"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="min-w-16 text-center text-lg font-bold text-slate-900">
                {quantity} {product.pricingType === "KG" ? "kg" : "un."}
              </span>
              <button
                type="button"
                onClick={() => changeQty(1)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow hover:bg-slate-100"
                aria-label="Aumentar"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-1 text-center text-xs text-slate-500">
              Mínimo {minimum} {product.pricingType === "KG" ? "kg" : "un."}
              {step !== minimum && `, incremento ${step}`}
            </p>
          </div>
        </div>

        {error && (
          <p className="border-t border-slate-200 bg-red-50 px-5 py-2 text-sm text-red-700">{error}</p>
        )}

        <div className="border-t border-slate-200 bg-white p-4">
          <button
            type="button"
            onClick={submit}
            className="flex w-full items-center justify-between gap-2 rounded-xl bg-brand px-5 py-3.5 text-sm font-bold text-white transition hover:bg-brand-strong disabled:bg-slate-300"
            disabled={quantity <= 0}
          >
            <span className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Adicionar
            </span>
            <span className="text-base">{currency.format(total)}</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function OptionGroupField({
  group,
  selected,
  onToggleSingle,
  onToggleMultiple
}: {
  group: ProductOptionGroup;
  selected: string[];
  onToggleSingle: (itemId: string) => void;
  onToggleMultiple: (itemId: string) => void;
}) {
  return (
    <fieldset className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <legend className="px-2 text-sm font-semibold text-slate-800">
        {group.name}
        {group.required && <span className="ml-2 rounded bg-brand-soft px-1.5 py-0.5 text-[10px] font-bold text-brand-strong">OBRIGATÓRIO</span>}
        {!group.required && group.selectionType === "MULTIPLE" && group.maxSelections && (
          <span className="ml-2 text-xs font-normal text-slate-500">(até {group.maxSelections})</span>
        )}
      </legend>
      <div className="mt-2 grid gap-2">
        {group.items.map((item) => {
          const isSelected = selected.includes(item.id);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() =>
                group.selectionType === "SINGLE"
                  ? onToggleSingle(item.id)
                  : onToggleMultiple(item.id)
              }
              className={`flex items-center justify-between rounded-xl border-2 px-4 py-3 text-left text-sm transition ${
                isSelected
                  ? "border-brand bg-brand-soft"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <span className="flex items-center gap-3">
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                    isSelected
                      ? group.selectionType === "MULTIPLE"
                        ? "border-brand bg-brand text-white"
                        : "border-brand"
                      : "border-slate-300"
                  } ${group.selectionType === "MULTIPLE" ? "rounded" : ""}`}
                >
                  {isSelected && group.selectionType === "MULTIPLE" && <CheckCircle2 className="h-3.5 w-3.5" />}
                  {isSelected && group.selectionType === "SINGLE" && (
                    <span className="h-2.5 w-2.5 rounded-full bg-brand" />
                  )}
                </span>
                <span className="font-medium text-slate-900">{item.name}</span>
              </span>
              {item.priceDelta !== 0 && (
                <span className="text-xs font-bold text-slate-700">
                  {group.pricingRule === "REPLACE"
                    ? currency.format(item.priceDelta)
                    : `${item.priceDelta > 0 ? "+" : ""}${currency.format(item.priceDelta)}`}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
