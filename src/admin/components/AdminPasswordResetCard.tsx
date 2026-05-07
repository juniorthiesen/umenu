import { CheckCircle2, KeyRound, Loader2 } from "lucide-react";
import React, { useEffect, useState } from "react";
import { api } from "../../api";
import { Input } from "../../shared/components/Input";
import { Panel } from "../../shared/components/Panel";
import type { EstablishmentAdmin } from "../../types";

export function AdminPasswordResetCard({ establishmentId }: { establishmentId: string }) {
  const [admins, setAdmins] = useState<EstablishmentAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .listEstablishmentAdmins(establishmentId)
      .then((list) => {
        if (cancelled) return;
        setAdmins(list);
        const tenantAdmin = list.find((admin) => admin.role === "ESTABLISHMENT_ADMIN");
        if (tenantAdmin) setUserId(tenantAdmin.id);
        else if (list[0]) setUserId(list[0].id);
      })
      .catch(() => {
        if (!cancelled) setError("Não foi possível carregar os admins.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [establishmentId]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccess(false);

    if (password.length < 8) {
      setError("A senha precisa ter ao menos 8 caracteres.");
      return;
    }
    if (password !== confirmation) {
      setError("As senhas não conferem.");
      return;
    }

    setSaving(true);
    try {
      await api.resetEstablishmentAdminPassword(establishmentId, userId, password);
      setPassword("");
      setConfirmation("");
      setSuccess(true);
      window.setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError("Não foi possível atualizar a senha.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Panel>
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
          <KeyRound className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-semibold">Resetar senha do admin</h3>
          <p className="text-sm text-slate-500">Troca a senha de um usuário vinculado a este estabelecimento.</p>
        </div>
      </div>

      <form onSubmit={submit} className="mt-4 space-y-3">
        <label className="block text-sm font-medium text-slate-700">
          Usuário
          <select
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
            value={userId}
            onChange={(event) => setUserId(event.target.value)}
            disabled={loading || admins.length === 0}
          >
            {admins.length === 0 && <option value="">Nenhum admin vinculado</option>}
            {admins.map((admin) => (
              <option key={admin.id} value={admin.id}>
                {admin.name} — {admin.email} {admin.role === "PLATFORM_ADMIN" ? "(plataforma)" : ""}
              </option>
            ))}
          </select>
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Nova senha" type="password" value={password} onChange={setPassword} />
          <Input label="Confirmar senha" type="password" value={confirmation} onChange={setConfirmation} />
        </div>

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        {success && (
          <p className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
            <CheckCircle2 className="h-4 w-4" />
            Senha atualizada.
          </p>
        )}

        <button
          className="flex items-center gap-2 rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:bg-slate-400"
          disabled={saving || !userId}
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
          Atualizar senha
        </button>
      </form>
    </Panel>
  );
}
