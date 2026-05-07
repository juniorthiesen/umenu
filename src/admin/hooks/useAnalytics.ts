import { useCallback, useEffect, useState } from "react";
import { api } from "../../api";
import type { EstablishmentAnalytics } from "../../types";

export function useAnalytics(establishmentId: string | undefined) {
  const [data, setData] = useState<EstablishmentAnalytics | null>(null);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    if (!establishmentId) {
      setData(null);
      return;
    }

    setLoading(true);
    try {
      setData(await api.getAnalytics(establishmentId));
    } finally {
      setLoading(false);
    }
  }, [establishmentId]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, loading, reload };
}
