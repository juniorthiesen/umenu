export const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL"
});

export const normalizeSearchText = (value: string | null | undefined) =>
  (value || "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();

export const includesSearchTerm = (value: string | null | undefined, normalizedTerm: string) =>
  normalizeSearchText(value).includes(normalizedTerm);
