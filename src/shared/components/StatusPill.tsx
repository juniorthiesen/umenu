import type { EstablishmentStatus } from "../../types";

const STATUS_STYLES: Record<EstablishmentStatus, { label: string; className: string }> = {
  ACTIVE: { label: "Ativo", className: "bg-green-50 text-green-700" },
  SUSPENDED: { label: "Suspenso", className: "bg-amber-50 text-amber-700" },
  ARCHIVED: { label: "Arquivado", className: "bg-slate-100 text-slate-600" }
};

export function StatusPill({ status }: { status: EstablishmentStatus | string }) {
  const style = STATUS_STYLES[status as EstablishmentStatus] ?? {
    label: String(status),
    className: "bg-slate-100 text-slate-600"
  };

  return (
    <span className={`rounded-md px-2 py-1 text-xs font-medium ${style.className}`}>{style.label}</span>
  );
}
