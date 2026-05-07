import { useCallback, useEffect, useState } from "react";
import { api } from "../../api";
import type { EstablishmentSummary } from "../../types";

export function useEstablishments() {
  const [items, setItems] = useState<EstablishmentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const list = await api.listEstablishments();
      setItems(list);
    } catch {
      setError("Não foi possível carregar os estabelecimentos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { items, loading, error, reload };
}
