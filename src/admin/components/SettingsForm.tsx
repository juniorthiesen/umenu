import { CheckCircle2, Loader2, Save } from "lucide-react";
import React, { useEffect, useState } from "react";
import { api } from "../../api";
import { ImageUploadControl } from "../../shared/components/ImageUploadControl";
import { Input } from "../../shared/components/Input";
import { Panel } from "../../shared/components/Panel";
import type { EstablishmentDetail } from "../../types";

type Form = {
  name: string;
  whatsappPhone: string;
  address: string;
  logoUrl: string;
  bannerUrl: string;
  primaryColor: string;
  deliveryFee: string;
  minimumOrder: string;
};

const buildForm = (establishment: EstablishmentDetail): Form => ({
  name: establishment.name,
  whatsappPhone: establishment.whatsappPhone,
  address: establishment.address || "",
  logoUrl: establishment.logoUrl || "",
  bannerUrl: establishment.bannerUrl || "",
  primaryColor: establishment.primaryColor,
  deliveryFee: String(establishment.deliveryFee),
  minimumOrder: String(establishment.minimumOrder)
});

export function SettingsForm({
  establishment,
  reload
}: {
  establishment: EstablishmentDetail;
  reload: () => Promise<void> | void;
}) {
  const [form, setForm] = useState<Form>(() => buildForm(establishment));
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setForm(buildForm(establishment));
  }, [establishment]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setSaved(false);
    setError("");
    try {
      await api.updateEstablishment(establishment.id, {
        ...form,
        address: form.address || null,
        logoUrl: form.logoUrl || null,
        bannerUrl: form.bannerUrl || null,
        deliveryFee: Number(form.deliveryFee),
        minimumOrder: Number(form.minimumOrder)
      });
      await reload();
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2200);
    } catch {
      setError("Não foi possível salvar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Panel>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <h3 className="font-semibold">Dados do estabelecimento</h3>
          <p className="mt-1 text-sm text-slate-500">Identidade visual e parâmetros de pedido.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Nome" value={form.name} onChange={(value) => setForm({ ...form, name: value })} required />
          <Input label="WhatsApp" value={form.whatsappPhone} onChange={(value) => setForm({ ...form, whatsappPhone: value })} required />
          <div className="sm:col-span-2">
            <Input label="Endereço" value={form.address} onChange={(value) => setForm({ ...form, address: value })} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Input label="Logo URL" value={form.logoUrl} onChange={(value) => setForm({ ...form, logoUrl: value })} />
            <div className="mt-2">
              <ImageUploadControl
                label="Enviar logo"
                establishmentId={establishment.id}
                scope="logo"
                nameHint={`${establishment.name} logo`}
                onUploaded={(url) => setForm((current) => ({ ...current, logoUrl: url }))}
              />
            </div>
          </div>
          <div>
            <Input label="Banner URL" value={form.bannerUrl} onChange={(value) => setForm({ ...form, bannerUrl: value })} />
            <div className="mt-2">
              <ImageUploadControl
                label="Enviar banner"
                establishmentId={establishment.id}
                scope="banner"
                nameHint={`${establishment.name} banner`}
                onUploaded={(url) => setForm((current) => ({ ...current, bannerUrl: url }))}
              />
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Input
            label="Cor primária"
            value={form.primaryColor}
            onChange={(value) => setForm({ ...form, primaryColor: value })}
            placeholder="#f97316"
          />
          <Input
            label="Taxa de entrega"
            type="number"
            value={form.deliveryFee}
            onChange={(value) => setForm({ ...form, deliveryFee: value })}
          />
          <Input
            label="Pedido mínimo"
            type="number"
            value={form.minimumOrder}
            onChange={(value) => setForm({ ...form, minimumOrder: value })}
          />
        </div>

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <div className="flex justify-end">
          <button
            className="flex items-center gap-2 rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:bg-slate-400"
            disabled={saving}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {saved ? "Salvo" : "Salvar alterações"}
          </button>
        </div>
      </form>
    </Panel>
  );
}
