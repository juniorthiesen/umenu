import { useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { api } from "../api";
import { LoginScreen } from "../auth/LoginScreen";
import { FullScreenLoading } from "../shared/components/FullScreenLoading";
import type { SessionUser } from "../types";
import { AdminLayout } from "./AdminLayout";
import { EstablishmentCatalogPage } from "./pages/EstablishmentCatalogPage";
import { EstablishmentDetailLayout } from "./pages/EstablishmentDetailLayout";
import { EstablishmentSettingsPage } from "./pages/EstablishmentSettingsPage";
import { EstablishmentsPage } from "./pages/EstablishmentsPage";
import { OverviewPage } from "./pages/OverviewPage";

export function AdminApp() {
  const [token, setToken] = useState(() => window.localStorage.getItem("umenu_token"));
  const [user, setUser] = useState<SessionUser | null>(null);
  const [authLoading, setAuthLoading] = useState(Boolean(token));

  useEffect(() => {
    if (!token) {
      setAuthLoading(false);
      setUser(null);
      return;
    }

    api
      .me()
      .then((response) => setUser(response.user))
      .catch(() => {
        window.localStorage.removeItem("umenu_token");
        setToken(null);
      })
      .finally(() => setAuthLoading(false));
  }, [token]);

  const handleLogin = (nextToken: string, nextUser: SessionUser) => {
    window.localStorage.setItem("umenu_token", nextToken);
    setToken(nextToken);
    setUser(nextUser);
  };

  const handleLogout = () => {
    window.localStorage.removeItem("umenu_token");
    setToken(null);
    setUser(null);
  };

  if (authLoading) {
    return <FullScreenLoading label="Verificando sessão" />;
  }

  if (!token || !user) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  const isPlatformAdmin = user.role === "PLATFORM_ADMIN";

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AdminLayout user={user} onLogout={handleLogout} />}>
          <Route index element={<OverviewPage />} />
          <Route path="estabelecimentos" element={<EstablishmentsPage />} />
          <Route
            path="estabelecimentos/:establishmentId"
            element={<EstablishmentDetailLayout isPlatformAdmin={isPlatformAdmin} />}
          >
            <Route index element={<Navigate to="cardapio" replace />} />
            <Route path="cardapio" element={<EstablishmentCatalogPage />} />
            <Route path="ajustes" element={<EstablishmentSettingsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
