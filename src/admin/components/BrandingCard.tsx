import { CheckCircle2, Loader2, Palette, RotateCcw, Save } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { api } from "../../api";
import { Panel } from "../../shared/components/Panel";
import { TEMPLATE_LIST, TEMPLATES, resolveTheme } from "../../shared/templates/registry";
import type { EstablishmentDetail, Template } from "../../types";

type Form = {
  template: Template;
  primaryColor: string;
  accentColor: string;
  surfaceColor: string;
};

const buildForm = (establishment: EstablishmentDetail): Form => {
  const theme = resolveTheme({
    template: establishment.template,
    primaryColor: establishment.primaryColor,
    accentColor: establishment.accentColor,
    surfaceColor: establishment.surfaceColor
  });
  return {
    template: establishment.template,
    primaryColor: theme.primary,
    accentColor: theme.accent,
    surfaceColor: theme.surface
  };
};

export function BrandingCard({
  establishment,
  reload
}: {
  establishment: EstablishmentDetail;
  reload: () => Promise<void> | void;
}) {
  const [form, setForm] = useState<Form>(() => buildForm(establishment));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setForm(buildForm(establishment));
  }, [establishment]);

  const templateDef = TEMPLATES[form.template];
  const defaultsMatch = useMemo(
    () =>
      form.primaryColor.toLowerCase() === templateDef.defaults.primaryColor.toLowerCase() &&
      form.accentColor.toLowerCase() === templateDef.defaults.accentColor.toLowerCase() &&
      form.surfaceColor.toLowerCase() === templateDef.defaults.surfaceColor.toLowerCase(),
    [form, templateDef]
  );

  const handleTemplate = (template: Template) => {
    const def = TEMPLATES[template];
    setForm({
      template,
      primaryColor: def.defaults.primaryColor,
      accentColor: def.defaults.accentColor,
      surfaceColor: def.defaults.surfaceColor
    });
  };

  const resetToTemplate = () => {
    handleTemplate(form.template);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setSaved(false);
    setError("");
    try {
      await api.updateEstablishment(establishment.id, {
        template: form.template,
        primaryColor: form.primaryColor,
        accentColor: form.accentColor,
        surfaceColor: form.surfaceColor
      });
      await reload();
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2200);
    } catch {
      setError("Não foi possível salvar a identidade visual.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Panel>
      <form onSubmit={submit} className="space-y-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
            <Palette className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold">Identidade visual</h3>
            <p className="text-sm text-slate-500">
              Template define o ponto de partida. Você pode customizar as cores em cima do template.
            </p>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Template</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {TEMPLATE_LIST.map((tpl) => {
              const active = tpl.id === form.template;
              return (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => handleTemplate(tpl.id)}
                  className={`flex items-start gap-3 rounded-xl border-2 p-3 text-left transition ${
                    active ? "border-slate-950 bg-slate-50" : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <span
                    className="mt-0.5 h-8 w-8 shrink-0 rounded-lg border border-slate-200"
                    style={{ background: tpl.defaults.primaryColor }}
                  />
                  <div>
                    <p className="text-sm font-semibold text-slate-950">{tpl.label}</p>
                    <p className="mt-1 text-xs text-slate-500">{tpl.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Cores</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <ColorField
              label="Cor primária"
              value={form.primaryColor}
              onChange={(value) => setForm((current) => ({ ...current, primaryColor: value }))}
            />
            <ColorField
              label="Acento"
              value={form.accentColor}
              onChange={(value) => setForm((current) => ({ ...current, accentColor: value }))}
            />
            <ColorField
              label="Fundo"
              value={form.surfaceColor}
              onChange={(value) => setForm((current) => ({ ...current, surfaceColor: value }))}
            />
          </div>
        </div>

        <ThemePreview form={form} />

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <div className="flex flex-wrap items-center gap-3">
          <button
            className="flex items-center gap-2 rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:bg-slate-400"
            disabled={saving}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {saved ? "Salvo" : "Salvar identidade"}
          </button>
          {!defaultsMatch && (
            <button
              type="button"
              onClick={resetToTemplate}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <RotateCcw className="h-4 w-4" />
              Voltar ao tema do template
            </button>
          )}
        </div>
      </form>
    </Panel>
  );
}

function ColorField({
  label,
  value,
  onChange
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      <div className="mt-1 flex items-center gap-2 rounded-lg border border-slate-300 bg-white p-1.5">
        <input
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-9 w-12 cursor-pointer rounded border-0 bg-transparent p-0"
        />
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="flex-1 min-w-0 bg-transparent px-2 text-sm outline-none"
          maxLength={20}
        />
      </div>
    </label>
  );
}

function ThemePreview({ form }: { form: Form }) {
  return (
    <div
      className="rounded-2xl border border-slate-200 p-4"
      style={{
        background: form.surfaceColor,
        ['--preview-primary' as never]: form.primaryColor,
        ['--preview-accent' as never]: form.accentColor
      }}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Preview</p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <span
          className="rounded-lg px-4 py-2 text-sm font-bold text-white shadow"
          style={{ background: form.primaryColor }}
        >
          Botão principal
        </span>
        <span
          className="rounded-lg border-2 px-4 py-2 text-sm font-bold"
          style={{ borderColor: form.primaryColor, color: form.primaryColor }}
        >
          Variante secundária
        </span>
        <span
          className="rounded-md px-2 py-1 text-xs font-bold text-white"
          style={{ background: form.accentColor }}
        >
          Acento
        </span>
      </div>
    </div>
  );
}
