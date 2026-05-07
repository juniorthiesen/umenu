import { useCallback, useEffect, useState } from "react";
import { api } from "../../api";
import type { EstablishmentDetail } from "../../types";

export function useEstablishment(establishmentId: string | undefined) {
  const [data, setData] = useState<EstablishmentDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    if (!establishmentId) {
      setData(null);
      return;
    }

    setLoading(true);
    setError("");
    try {
      setData(await api.getEstablishment(establishmentId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar estabelecimento.");
    } finally {
      setLoading(false);
    }
  }, [establishmentId]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, loading, error, reload };
}
