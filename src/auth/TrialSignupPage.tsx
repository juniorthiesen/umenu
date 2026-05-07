import { ArrowRight, CheckCircle2, Loader2, Lock, Store } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api, ApiError } from "../api";
import { Input } from "../shared/components/Input";
import type { SessionUser } from "../types";

const slugify = (value: string) =>
  value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);

type SubdomainState =
  | { status: "idle" }
  | { status: "checking" }
  | { status: "available"; subdomain: string }
  | { status: "unavailable"; reason?: string };

export function TrialSignupPage({ onSignup }: { onSignup: (token: string, user: SessionUser) => void }) {
  const [name, setName] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [address, setAddress] = useState("");
  const [adminName, setAdminName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [subdomainState, setSubdomainState] = useState<SubdomainState>({ status: "idle" });

  const normalizedSubdomain = useMemo(() => slugify(subdomain), [subdomain]);

  // auto-fill subdomain from establishment name
  useEffect(() => {
    if (!subdomain && name) {
      setSubdomain(slugify(name));
    }
  }, [name]); // eslint-disable-line react-hooks/exhaustive-deps

  // debounced subdomain availability check
  useEffect(() => {
    if (normalizedSubdomain.length < 3) {
      setSubdomainState({ status: "idle" });
      return;
    }

    setSubdomainState({ status: "checking" });
    const timer = window.setTimeout(async () => {
      try {
        const result = await api.checkSubdomain(normalizedSubdomain);
        if (result.available) {
          setSubdomainState({ status: "available", subdomain: result.subdomain || normalizedSubdomain });
        } else {
          setSubdomainState({ status: "unavailable", reason: result.reason });
        }
      } catch {
        setSubdomainState({ status: "unavailable" });
      }
    }, 400);

    return () => window.clearTimeout(timer);
  }, [normalizedSubdomain]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (subdomainState.status !== "available") {
      setError("Escolha um subdomínio disponível antes de continuar.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.signup({
        establishment: {
          name,
          subdomain: normalizedSubdomain,
          whatsappPhone: whatsapp.replace(/\D/g, ""),
          address: address || undefined
        },
        admin: { name: adminName, email, password }
      });
      onSignup(response.token, response.user);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.message === "subdomain_unavailable") setError("Esse subdomínio acabou de ser pego. Tenta outro.");
        else if (err.message === "email_unavailable") setError("Já existe uma conta com esse email. Faça login.");
        else if (err.message === "invalid_subdomain") setError("Subdomínio inválido. Use letras, números e hífens.");
        else setError("Não foi possível criar a conta. Tenta de novo em instantes.");
      } else {
        setError("Erro inesperado. Tenta de novo.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f7f7f1] text-slate-950">
      <header className="border-b border-slate-200/80">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5 sm:px-8">
          <Link to="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-600 text-white">
              <Store className="h-5 w-5" />
            </span>
            <span className="text-lg font-bold tracking-tight">UMenu</span>
          </Link>
          <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-slate-950">
            Já tem conta? Entrar
          </Link>
        </div>
      </header>

      <section className="mx-auto grid max-w-5xl gap-10 px-5 py-10 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:py-16">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-orange-700">7 dias grátis · sem cartão</p>
          <h1 className="mt-3 text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl">
            Seu cardápio no ar em 5 minutos.
          </h1>
          <p className="mt-5 max-w-lg text-lg leading-7 text-slate-600">
            Cria a conta agora, configura o cardápio pelo painel e compartilha o link nos Stories ainda hoje.
            Você decide o plano só depois de testar.
          </p>

          <ul className="mt-8 space-y-3 text-sm text-slate-700">
            {[
              "Sem cartão de crédito pra começar",
              "Cardápio com URL própria (seunegocio.umenu.com.br)",
              "5 créditos Foto Pro com IA de boas-vindas",
              "Sem comissão por venda — pedido cai direto no seu WhatsApp"
            ].map((item) => (
              <li key={item} className="flex gap-2">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                {item}
              </li>
            ))}
          </ul>

          <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">O que acontece a seguir</p>
            <ol className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
              <li><strong>1.</strong> Conta criada e cardápio público no ar.</li>
              <li><strong>2.</strong> Você adiciona produtos pelo painel.</li>
              <li><strong>3.</strong> Compartilha o link e recebe os pedidos no WhatsApp.</li>
            </ol>
          </div>
        </div>

        <form
          onSubmit={submit}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl shadow-slate-300/40 sm:p-6"
        >
          <h2 className="text-xl font-bold tracking-tight">Comece grátis</h2>
          <p className="mt-1 text-sm text-slate-500">Leva 30 segundos.</p>

          <div className="mt-6 space-y-4">
            <Input label="Nome do estabelecimento" value={name} onChange={setName} placeholder="Salgaderia da Nilceia" required />

            <div>
              <label className="block text-sm font-medium text-slate-700">
                URL do seu cardápio
                <div className="mt-1 flex rounded-lg border border-slate-300 bg-white focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-200">
                  <input
                    className="min-w-0 flex-1 rounded-lg px-3 py-2.5 text-sm outline-none"
                    value={subdomain}
                    onChange={(event) => setSubdomain(event.target.value)}
                    placeholder="salgaderia-nilceia"
                    required
                  />
                  <span className="flex items-center pr-3 text-sm text-slate-500">.umenu.com.br</span>
                </div>
              </label>
              <SubdomainHint state={subdomainState} value={normalizedSubdomain} />
            </div>

            <Input
              label="WhatsApp (com DDD)"
              value={whatsapp}
              onChange={setWhatsapp}
              placeholder="55 11 99999-9999"
              required
            />

            <Input
              label="Endereço (opcional)"
              value={address}
              onChange={setAddress}
              placeholder="Bairro, cidade — pra aparecer no cardápio"
            />

            <div className="border-t border-slate-200 pt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Seu acesso</p>
              <div className="mt-3 grid gap-4">
                <Input label="Seu nome" value={adminName} onChange={setAdminName} required />
                <Input label="Email" type="email" value={email} onChange={setEmail} required />
                <Input
                  label="Senha (mín. 8 caracteres)"
                  type="password"
                  value={password}
                  onChange={setPassword}
                  required
                />
              </div>
            </div>
          </div>

          {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

          <button
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-3.5 text-sm font-bold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-slate-400"
            disabled={submitting}
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            Criar minha conta grátis
          </button>

          <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-slate-500">
            <Lock className="h-3.5 w-3.5" />
            Sem cartão. Cancela quando quiser.
          </p>
        </form>
      </section>
    </main>
  );
}

function SubdomainHint({ state, value }: { state: SubdomainState; value: string }) {
  if (state.status === "idle" || value.length < 3) {
    return <p className="mt-1 text-xs text-slate-500">Mínimo 3 caracteres. Só letras, números e hífens.</p>;
  }
  if (state.status === "checking") {
    return (
      <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
        <Loader2 className="h-3 w-3 animate-spin" />
        Verificando…
      </p>
    );
  }
  if (state.status === "available") {
    return (
      <p className="mt-1 flex items-center gap-1 text-xs font-medium text-green-700">
        <CheckCircle2 className="h-3.5 w-3.5" />
        {value}.umenu.com.br está disponível
      </p>
    );
  }
  return (
    <p className="mt-1 text-xs font-medium text-red-600">
      {state.reason === "invalid_subdomain" ? "Subdomínio inválido. Use letras, números e hífens." : "Esse subdomínio já está em uso. Tente outro."}
    </p>
  );
}
