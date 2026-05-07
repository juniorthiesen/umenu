import { ArrowRight, Eye, EyeOff, Loader2, Store } from "lucide-react";
import React, { useState } from "react";
import { api, ApiError } from "../api";
import type { SessionUser } from "../types";

export function LoginScreen({ onLogin }: { onLogin: (token: string, user: SessionUser) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.login(email, password);
      onLogin(response.token, response.user);
    } catch (err) {
      setError(err instanceof ApiError ? "Credenciais inválidas." : "Não foi possível entrar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="grid min-h-screen bg-[#f7f7f2] text-slate-950 lg:grid-cols-[1fr_480px]">
      <section className="hidden flex-col justify-between border-r border-slate-200 bg-slate-950 p-10 text-white lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-orange-500 text-white">
            <Store className="h-6 w-6" />
          </div>
          <span className="text-xl font-semibold">UMenu</span>
        </div>

        <div className="max-w-2xl">
          <h1 className="text-5xl font-semibold leading-tight tracking-tight">
            Painel operacional para cardápios digitais.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-slate-300">
            Controle estabelecimentos, produtos, preços e fotos em uma interface direta para operação diária.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 text-sm text-slate-300">
          <Metric label="URLs" value="Wildcard" />
          <Metric label="Pedidos" value="WhatsApp" />
          <Metric label="Banco" value="Postgres" />
        </div>
      </section>

      <section className="flex items-center justify-center px-6 py-10">
        <form onSubmit={submit} className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg bg-orange-500 text-white">
              <Store className="h-6 w-6" />
            </div>
            <h1 className="text-3xl font-semibold tracking-tight">UMenu Admin</h1>
          </div>

          <h2 className="text-2xl font-semibold tracking-tight">Entrar no painel</h2>
          <p className="mt-2 text-sm text-slate-600">
            Use suas credenciais da plataforma ou do estabelecimento.
          </p>

          <label className="mt-8 block text-sm font-medium text-slate-700">
            Email
            <input
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              autoComplete="email"
              required
            />
          </label>

          <label className="mt-4 block text-sm font-medium text-slate-700">
            Senha
            <div className="mt-2 flex rounded-lg border border-slate-300 bg-white focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-200">
              <input
                className="min-w-0 flex-1 rounded-lg px-3 py-3 text-sm outline-none"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="px-3 text-slate-500 hover:text-slate-900"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </label>

          {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

          <button
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            Entrar
          </button>
        </form>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-4">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 font-semibold text-white">{value}</p>
    </div>
  );
}
