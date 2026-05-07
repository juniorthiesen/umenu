import { ExternalLink, Plus, RefreshCw, Search, Store } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate, useOutletContext } from "react-router-dom";
import { Panel } from "../../shared/components/Panel";
import { StatusPill } from "../../shared/components/StatusPill";
import { normalizeSearchText } from "../../shared/utils/currency";
import { publicUrlFor } from "../../shared/utils/hostname";
import type { EstablishmentSummary } from "../../types";
import { EstablishmentCreateDialog } from "../components/EstablishmentCreateDialog";

type Context = {
  establishments: EstablishmentSummary[];
  reload: () => Promise<void>;
  isPlatformAdmin: boolean;
};

export function EstablishmentsPage() {
  const { establishments, reload, isPlatformAdmin } = useOutletContext<Context>();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);

  const filtered = useMemo(() => {
    const normalized = normalizeSearchText(query);
    return establishments.filter((item) =>
      normalizeSearchText(`${item.name} ${item.subdomain}`).includes(normalized)
    );
  }, [establishments, query]);

  return (
    <div className="space-y-5">
      <Panel>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Estabelecimentos</h2>
            <p className="mt-1 text-sm text-slate-500">
              {filtered.length} de {establishments.length} registros.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 sm:w-72"
                placeholder="Buscar"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            <button
              onClick={() => reload()}
              className="flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium hover:bg-slate-50"
            >
              <RefreshCw className="h-4 w-4" />
              Atualizar
            </button>
            {isPlatformAdmin && (
              <button
                onClick={() => setCreating(true)}
                className="flex h-10 items-center justify-center gap-2 rounded-lg bg-orange-600 px-4 text-sm font-semibold text-white hover:bg-orange-700"
              >
                <Plus className="h-4 w-4" />
                Novo
              </button>
            )}
          </div>
        </div>
      </Panel>

      <Panel className="p-0">
        {filtered.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">Nenhum estabelecimento encontrado.</p>
        ) : (
          <ul className="divide-y divide-slate-200">
            {filtered.map((item) => (
              <li key={item.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                <button
                  className="flex flex-1 items-start gap-3 text-left"
                  onClick={() => navigate(`/estabelecimentos/${item.id}`)}
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                    <Store className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-slate-950">{item.name}</p>
                      <StatusPill status={item.status} />
                    </div>
                    <p className="mt-1 break-all text-sm text-slate-500">{item.subdomain}</p>
                    <p className="mt-1 text-xs text-slate-500">WhatsApp: {item.whatsappPhone}</p>
                  </div>
                </button>
                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  <span className="rounded-md bg-orange-50 px-2 py-1 text-xs font-medium text-orange-700">
                    {item.aiImageCredits} créditos IA
                  </span>
                  <a
                    href={publicUrlFor(item.subdomain)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-50"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Cardápio
                  </a>
                  <Link
                    to={`/estabelecimentos/${item.id}`}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-slate-950 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                  >
                    Gerenciar
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <EstablishmentCreateDialog
        open={creating}
        onClose={() => setCreating(false)}
        onCreated={async (id) => {
          await reload();
          navigate(`/estabelecimentos/${id}`);
        }}
      />
    </div>
  );
}
