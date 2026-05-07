import { BarChart3, Eye, RefreshCw, ShoppingCart, Tag } from "lucide-react";
import { Panel } from "../../shared/components/Panel";
import { SummaryStat } from "../../shared/components/SummaryStat";
import { currency } from "../../shared/utils/currency";
import type { EstablishmentAnalytics } from "../../types";

export function DashboardOverview({
  analytics,
  loading,
  fallback,
  refresh
}: {
  analytics: EstablishmentAnalytics | null;
  loading: boolean;
  fallback: { totalProducts: number; activeProducts: number; categories: number };
  refresh: () => void;
}) {
  const conversion = analytics ? `${Math.round(analytics.conversion7d * 100)}%` : "0%";

  return (
    <Panel>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Dashboard</h2>
          <p className="mt-1 text-sm text-slate-500">
            Acessos, pedidos via WhatsApp e funil dos últimos 7 dias.
          </p>
        </div>
        <button
          onClick={refresh}
          className="flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Atualizar métricas
        </button>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
        <SummaryStat icon={<Eye />} label="Acessos 7 dias" value={String(analytics?.visits7d ?? 0)} />
        <SummaryStat icon={<ShoppingCart />} label="Pedidos 7 dias" value={String(analytics?.orders7d ?? 0)} />
        <SummaryStat icon={<BarChart3 />} label="Conversão" value={conversion} />
        <SummaryStat icon={<Tag />} label="Faturamento 7 dias" value={currency.format(analytics?.revenue7d ?? 0)} />
      </div>

      <div className="mt-5 grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold">Funil de vendas</h3>
            <span className="text-xs text-slate-500">7 dias</span>
          </div>
          <FunnelRow label="Acessos ao cardápio" value={analytics?.visits7d ?? 0} max={Math.max(analytics?.visits7d ?? 1, 1)} />
          <FunnelRow label="Pedidos enviados" value={analytics?.orders7d ?? 0} max={Math.max(analytics?.visits7d ?? 1, 1)} />
          <FunnelRow label="Conversão (%)" value={Math.round((analytics?.conversion7d ?? 0) * 100)} max={100} />
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <h3 className="font-semibold">Operação</h3>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Categorias</span>
              <strong>{analytics?.categoryCount ?? fallback.categories}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Produtos ativos</span>
              <strong>{analytics?.activeProductCount ?? fallback.activeProducts}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Produtos totais</span>
              <strong>{analytics?.productCount ?? fallback.totalProducts}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Pedidos hoje</span>
              <strong>{analytics?.ordersToday ?? 0}</strong>
            </div>
          </div>
        </div>
      </div>
    </Panel>
  );
}

function FunnelRow({ label, value, max }: { label: string; value: number; max: number }) {
  const percent = Math.max(4, Math.min(100, Math.round((value / max) * 100)));

  return (
    <div className="mb-3">
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="text-slate-600">{label}</span>
        <strong>{value}</strong>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white">
        <div className="h-full rounded-full bg-orange-500" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
