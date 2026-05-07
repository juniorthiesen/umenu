import { ExternalLink, Package, Store, Tag } from "lucide-react";
import { Link, useOutletContext } from "react-router-dom";
import { Panel } from "../../shared/components/Panel";
import { StatusPill } from "../../shared/components/StatusPill";
import { SummaryStat } from "../../shared/components/SummaryStat";
import { publicUrlFor } from "../../shared/utils/hostname";
import type { EstablishmentSummary } from "../../types";
import { DashboardOverview } from "../components/DashboardOverview";
import { useAnalytics } from "../hooks/useAnalytics";
import { useEstablishment } from "../hooks/useEstablishment";

type Context = {
  establishments: EstablishmentSummary[];
  selectedId: string;
};

export function OverviewPage() {
  const { establishments, selectedId } = useOutletContext<Context>();
  const { data, loading } = useEstablishment(selectedId);
  const analytics = useAnalytics(selectedId);

  if (!selectedId) {
    return (
      <Panel>
        <p className="text-sm text-slate-500">
          Você não tem estabelecimentos vinculados. Peça acesso ao administrador da plataforma.
        </p>
      </Panel>
    );
  }

  if (loading || !data) {
    return (
      <Panel>
        <p className="text-sm text-slate-500">Carregando dados…</p>
      </Panel>
    );
  }

  const totalProducts = data.categories.reduce((sum, category) => sum + category.products.length, 0);
  const activeProducts = data.categories.reduce(
    (sum, category) => sum + category.products.filter((product) => product.isActive).length,
    0
  );

  return (
    <div className="space-y-5">
      <Panel>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="break-words text-xl font-semibold tracking-tight sm:text-2xl">{data.name}</h2>
              <StatusPill status={data.status} />
            </div>
            <p className="mt-2 break-all text-sm text-slate-500">{publicUrlFor(data.subdomain)}</p>
            <p className="mt-1 text-sm text-slate-500">
              {establishments.length} estabelecimento{establishments.length === 1 ? "" : "s"} disponível{establishments.length === 1 ? "" : "s"} para você.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              to={`/estabelecimentos/${data.id}/cardapio`}
              className="flex items-center justify-center gap-2 rounded-lg bg-slate-950 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              <Package className="h-4 w-4" />
              Gerenciar cardápio
            </Link>
            <a
              className="flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-50"
              href={publicUrlFor(data.subdomain)}
              target="_blank"
              rel="noreferrer"
            >
              <ExternalLink className="h-4 w-4" />
              Abrir cardápio
            </a>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <SummaryStat icon={<Tag />} label="Categorias" value={String(data.categories.length)} />
          <SummaryStat icon={<Package />} label="Produtos ativos" value={`${activeProducts}/${totalProducts}`} />
          <SummaryStat icon={<Store />} label="WhatsApp" value={data.whatsappPhone} />
        </div>
      </Panel>

      <DashboardOverview
        analytics={analytics.data}
        loading={analytics.loading}
        fallback={{
          totalProducts,
          activeProducts,
          categories: data.categories.length
        }}
        refresh={analytics.reload}
      />
    </div>
  );
}
