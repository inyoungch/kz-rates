"use client";

import { useCallback, useEffect, useState } from "react";

import { NATIONAL_BANK } from "@/lib/data/mock";
import type { Currency } from "@/lib/types";

type Source = "live" | "mock";

interface NbkData {
  rates: Record<Currency, number>;
  source: Source;
}

interface NbkApiResponse {
  rates: Record<Currency, number>;
  meta: { source: Source; fetchedAt: string };
}

const INITIAL: NbkData = { rates: NATIONAL_BANK, source: "mock" };

export function useNbkRate() {
  const [data, setData] = useState<NbkData>(INITIAL);
  const [loading, setLoading] = useState(true);

  const fetchRates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/nbk", { cache: "no-store" });
      if (!res.ok) throw new Error(`/api/nbk returned ${res.status}`);
      const json = (await res.json()) as NbkApiResponse;
      setData({ rates: json.rates, source: json.meta.source });
    } catch (err) {
      console.error("Failed to fetch /api/nbk, keeping previous rates:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  return { ...data, loading, refetch: fetchRates };
}
