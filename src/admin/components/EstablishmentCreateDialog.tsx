import { Loader2, Plus, Save, X } from "lucide-react";
import React, { useState } from "react";
import { createPortal } from "react-dom";
import { api, ApiError } from "../../api";
import { Input } from "../../shared/components/Input";

type Form = {
  name: string;
  subdomain: string;
  whatsappPhone: string;
  address: string;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
};

const empty: Form = {
  name: "",
  subdomain: "",
  whatsappPhone: "",
  address: "",
  adminName: "",
  adminEmail: "",
  adminPassword: ""
};

export function EstablishmentCreateDialog({
  open,
  onClose,
  onCreated
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const [form, setForm] = useState<Form>(empty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const response = await api.createEstablishment({
        name: form.name,
        subdomain: form.subdomain,
        whatsappPhone: form.whatsappPhone,
        address: form.address || undefined,
        admin: {
          name: form.adminName,
          email: form.adminEmail,
          password: form.adminPassword
        }
      });
      setForm(empty);
      onCreated(response.establishment.id);
      onClose();
    } catch (err) {
      const message =
        err instanceof ApiError && err.message === "subdomain_unavailable"
          ? "URL/subdomínio indisponível."
          : "Não foi possível criar o estabelecimento.";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <form
        onSubmit={submit}
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-5 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-xl font-semibold">Novo estabelecimento</h2>
            <p className="mt-1 text-sm text-slate-500">
              Cria o tenant e o primeiro usuário admin.
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 hover:bg-slate-100" aria-label="Fechar">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Input label="Nome" value={form.name} onChange={(value) => setForm({ ...form, name: value })} required />
          <Input
            label="Subdomínio"
            value={form.subdomain}
            onChange={(value) => setForm({ ...form, subdomain: value })}
            required
            placeholder="meu-restaurante"
          />
          <Input
            label="WhatsApp"
            value={form.whatsappPhone}
            onChange={(value) => setForm({ ...form, whatsappPhone: value })}
            required
            placeholder="5511999999999"
          />
          <Input label="Endereço" value={form.address} onChange={(value) => setForm({ ...form, address: value })} />
        </div>

        <div className="mt-5 border-t border-slate-200 pt-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Admin do estabelecimento</h3>
          <div className="mt-3 grid gap-4 md:grid-cols-3">
            <Input
              label="Nome"
              value={form.adminName}
              onChange={(value) => setForm({ ...form, adminName: value })}
              required
            />
            <Input
              label="Email"
              type="email"
              value={form.adminEmail}
              onChange={(value) => setForm({ ...form, adminEmail: value })}
              required
            />
            <Input
              label="Senha"
              type="password"
              value={form.adminPassword}
              onChange={(value) => setForm({ ...form, adminPassword: value })}
              required
            />
          </div>
        </div>

        {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50"
            disabled={saving}
          >
            Cancelar
          </button>
          <button
            className="flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:bg-slate-400"
            disabled={saving}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            <Save className="h-4 w-4" />
            Criar estabelecimento
          </button>
        </div>
      </form>
    </div>,
    document.body
  );
}
