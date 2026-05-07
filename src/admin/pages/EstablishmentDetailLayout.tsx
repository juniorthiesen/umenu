import { ArrowLeft, ExternalLink, Package, Settings as SettingsIcon } from "lucide-react";
import { Link, NavLink, Outlet, useParams } from "react-router-dom";
import { Panel } from "../../shared/components/Panel";
import { StatusPill } from "../../shared/components/StatusPill";
import { publicUrlFor } from "../../shared/utils/hostname";
import { useEstablishment } from "../hooks/useEstablishment";

type OutletContext = {
  establishment: ReturnType<typeof useEstablishment>["data"];
  reload: () => Promise<void>;
  isPlatformAdmin: boolean;
};

export function EstablishmentDetailLayout({ isPlatformAdmin }: { isPlatformAdmin: boolean }) {
  const params = useParams<{ establishmentId: string }>();
  const { data, loading, reload, error } = useEstablishment(params.establishmentId);

  if (!params.establishmentId) {
    return (
      <Panel>
        <p className="text-sm text-slate-500">Estabelecimento não informado.</p>
      </Panel>
    );
  }

  if (loading && !data) {
    return (
      <Panel>
        <p className="text-sm text-slate-500">Carregando…</p>
      </Panel>
    );
  }

  if (error || !data) {
    return (
      <Panel>
        <p className="text-sm text-red-700">{error || "Não foi possível carregar."}</p>
        <Link
          to="/estabelecimentos"
          className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-950"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>
      </Panel>
    );
  }

  const tabs = [
    { to: "cardapio", label: "Cardápio", icon: <Package className="h-4 w-4" /> },
    { to: "ajustes", label: "Ajustes", icon: <SettingsIcon className="h-4 w-4" /> }
  ];

  const context: OutletContext = {
    establishment: data,
    reload,
    isPlatformAdmin
  };

  return (
    <div className="space-y-5">
      <Panel>
        <Link
          to="/estabelecimentos"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-950"
        >
          <ArrowLeft className="h-4 w-4" />
          Estabelecimentos
        </Link>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="break-words text-xl font-semibold tracking-tight sm:text-2xl">{data.name}</h2>
              <StatusPill status={data.status} />
            </div>
            <p className="mt-2 break-all text-sm text-slate-500">{publicUrlFor(data.subdomain)}</p>
          </div>
          <a
            className="flex shrink-0 items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-50"
            href={publicUrlFor(data.subdomain)}
            target="_blank"
            rel="noreferrer"
          >
            <ExternalLink className="h-4 w-4" />
            Abrir cardápio
          </a>
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto border-b border-slate-200">
          {tabs.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                `flex shrink-0 items-center gap-2 border-b-2 px-3 pb-3 pt-2 text-sm font-medium transition ${
                  isActive ? "border-orange-500 text-orange-700" : "border-transparent text-slate-500 hover:text-slate-950"
                }`
              }
            >
              {tab.icon}
              {tab.label}
            </NavLink>
          ))}
        </div>
      </Panel>

      <Outlet context={context} />
    </div>
  );
}
