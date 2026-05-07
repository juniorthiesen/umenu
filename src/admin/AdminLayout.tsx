import { LayoutDashboard, LogOut, Menu, Store } from "lucide-react";
import { useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useEstablishments } from "./hooks/useEstablishments";
import type { SessionUser } from "../types";

const NAV_ITEMS = [
  { to: "/", label: "Visão geral", icon: <LayoutDashboard className="h-4 w-4" />, end: true },
  { to: "/estabelecimentos", label: "Estabelecimentos", icon: <Store className="h-4 w-4" /> }
];

export function AdminLayout({
  user,
  onLogout
}: {
  user: SessionUser;
  onLogout: () => void;
}) {
  const { items, reload } = useEstablishments();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const isPlatformAdmin = user.role === "PLATFORM_ADMIN";
  const roleLabel = isPlatformAdmin ? "Admin da plataforma" : "Admin do estabelecimento";

  const selectedId = isPlatformAdmin
    ? items[0]?.id || ""
    : items.find((item) => user.establishmentIds.includes(item.id))?.id || items[0]?.id || "";

  const context = {
    establishments: items,
    reload,
    selectedId,
    isPlatformAdmin
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f4f3ec] text-slate-950">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-slate-800 bg-slate-950 p-4 text-white lg:flex">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500">
            <Store className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold leading-none">UMenu</p>
            <p className="mt-1 text-xs text-slate-400">{roleLabel}</p>
          </div>
        </Link>

        <nav className="mt-8 space-y-1 text-sm">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex w-full items-center gap-3 rounded-lg px-3 py-2 transition ${
                  isActive ? "bg-white text-slate-950" : "text-slate-400 hover:bg-white/10 hover:text-white"
                }`
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm font-medium">{user.name}</p>
          <p className="mt-1 text-xs text-slate-400">{user.email}</p>
          <p className="mt-2 inline-flex rounded-md bg-white/10 px-2 py-1 text-xs text-slate-300">{roleLabel}</p>
          <button
            className="mt-4 flex items-center gap-2 text-sm text-slate-300 hover:text-white"
            onClick={onLogout}
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>
      </aside>

      <section className="min-w-0 lg:ml-64">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-[#f4f3ec]/95 px-3 py-3 backdrop-blur sm:px-4 lg:px-6">
          <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-3">
            <div className="flex items-center gap-3 lg:hidden">
              <button
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 bg-white"
                onClick={() => setMenuOpen((open) => !open)}
                aria-label="Abrir menu"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500 text-white">
                  <Store className="h-4 w-4" />
                </div>
                <p className="font-semibold">UMenu</p>
              </div>
            </div>
            <div className="hidden lg:block">
              <p className="text-sm text-slate-500">{location.pathname}</p>
            </div>
            <button
              className="hidden items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium hover:bg-slate-50 lg:flex"
              onClick={onLogout}
            >
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </div>

          {menuOpen && (
            <nav className="mt-3 flex gap-2 overflow-x-auto pb-1 lg:hidden">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold ${
                      isActive
                        ? "border-slate-950 bg-slate-950 text-white"
                        : "border-slate-200 bg-white text-slate-600"
                    }`
                  }
                >
                  {item.icon}
                  {item.label}
                </NavLink>
              ))}
              <button
                onClick={onLogout}
                className="flex shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sair
              </button>
            </nav>
          )}
        </header>

        <div className="mx-auto max-w-[1500px] p-3 sm:p-4 lg:p-6 xl:p-8">
          <Outlet context={context} />
        </div>
      </section>
    </main>
  );
}
