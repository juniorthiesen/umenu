import type { PricingType, ProductOptionGroup, ProductOptionItem } from "../types";

export type SelectedOptions = Record<string, string[]>;

export interface PriceableProduct {
  price: number;
  pricingType: PricingType;
  optionGroups?: ProductOptionGroup[];
}

const getSelectedItems = (group: ProductOptionGroup, selected: string[]): ProductOptionItem[] =>
  group.items.filter((item) => selected.includes(item.id));

const groupModifier = (group: ProductOptionGroup, items: ProductOptionItem[]): number => {
  if (items.length === 0) return 0;
  switch (group.pricingRule) {
    case "SUM":
      return items.reduce((sum, item) => sum + item.priceDelta, 0);
    case "HIGHEST":
      return items.reduce((max, item) => (item.priceDelta > max ? item.priceDelta : max), items[0].priceDelta);
    case "AVERAGE":
      return items.reduce((sum, item) => sum + item.priceDelta, 0) / items.length;
    case "REPLACE":
      // tratado em calculateUnitPrice; aqui retornamos 0 pra não duplicar
      return 0;
  }
};

export const calculateUnitPrice = (
  product: PriceableProduct,
  selected: SelectedOptions
): number => {
  let basePrice = product.price;
  let modifiers = 0;

  for (const group of product.optionGroups || []) {
    const selectedIds = selected[group.id] || [];
    const items = getSelectedItems(group, selectedIds);
    if (items.length === 0) continue;

    if (group.pricingRule === "REPLACE") {
      // REPLACE: se mais de um item selecionado, pega o maior (caso single, é único)
      basePrice = items.reduce(
        (max, item) => (item.priceDelta > max ? item.priceDelta : max),
        items[0].priceDelta
      );
    } else {
      modifiers += groupModifier(group, items);
    }
  }

  return basePrice + modifiers;
};

export const calculateLineTotal = (
  product: PriceableProduct,
  selected: SelectedOptions,
  quantity: number
): number => {
  const unit = calculateUnitPrice(product, selected);
  if (product.pricingType === "HUNDRED") {
    return (unit / 100) * quantity;
  }
  return unit * quantity;
};

export const defaultSelectionsFor = (groups: ProductOptionGroup[] | undefined): SelectedOptions => {
  const result: SelectedOptions = {};
  if (!groups) return result;
  for (const group of groups) {
    if (group.selectionType === "SINGLE") {
      const defaultItem = group.items.find((item) => item.isDefault) || (group.required ? group.items[0] : null);
      result[group.id] = defaultItem ? [defaultItem.id] : [];
    } else if (group.selectionType === "MULTIPLE") {
      result[group.id] = group.items.filter((item) => item.isDefault).map((item) => item.id);
    } else {
      result[group.id] = [];
    }
  }
  return result;
};

export const validateSelections = (
  groups: ProductOptionGroup[] | undefined,
  selected: SelectedOptions
): { ok: true } | { ok: false; reason: string } => {
  if (!groups) return { ok: true };
  for (const group of groups) {
    const count = (selected[group.id] || []).length;
    if (group.required && count === 0) {
      return { ok: false, reason: `Escolha uma opção em "${group.name}".` };
    }
    if (group.minSelections > 0 && count < group.minSelections) {
      return { ok: false, reason: `"${group.name}" exige no mínimo ${group.minSelections} opções.` };
    }
    if (group.maxSelections && count > group.maxSelections) {
      return { ok: false, reason: `"${group.name}" aceita no máximo ${group.maxSelections} opções.` };
    }
  }
  return { ok: true };
};

export const serializeSelections = (
  groups: ProductOptionGroup[] | undefined,
  selected: SelectedOptions
) => {
  if (!groups) return [];
  const result: Array<{ groupId: string; groupName: string; itemIds: string[]; itemNames: string[] }> = [];
  for (const group of groups) {
    const ids = selected[group.id] || [];
    if (ids.length === 0) continue;
    const items = group.items.filter((item) => ids.includes(item.id));
    result.push({
      groupId: group.id,
      groupName: group.name,
      itemIds: items.map((item) => item.id),
      itemNames: items.map((item) => item.name)
    });
  }
  return result;
};
