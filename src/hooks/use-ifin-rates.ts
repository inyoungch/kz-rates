"use client";

import { useCallback, useEffect, useState } from "react";

import type { City, IfinSource } from "@/lib/types";

type Source = "live" | "stale" | "error";

interface IfinData {
  sources: IfinSource[];
  source: Source;
  /** When this city's data was last actually fetched from ifin.kz — shared
   *  by both the banks and exchangers tabs, since one request returns both. */
  fetchedAt: Date | null;
}

interface IfinApiResponse {
  entries: IfinSource[];
  meta: { source: Source; fetchedAt: string };
}

const INITIAL: IfinData = { sources: [], source: "error", fetchedAt: null };

// One scrape covers every currency for a city, so this hook is keyed by city
// only — currency selection happens client-side (dashboard table + calculator).
export function useIfinRates(city: City) {
  const [data, setData] = useState<IfinData>(INITIAL);
  const [loading, setLoading] = useState(true);

  const fetchRates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/ifin?city=${city}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`/api/ifin returned ${res.status}`);
      const json = (await res.json()) as IfinApiResponse;
      setData({
        sources: json.entries,
        source: json.meta.source,
        fetchedAt: new Date(json.meta.fetchedAt),
      });
    } catch (err) {
      // Keep whatever sources we already have rather than blanking the
      // section on a transient network error — same as the BCC/NBK hooks.
      console.error("Failed to fetch /api/ifin, keeping previous sources:", err);
    } finally {
      setLoading(false);
    }
  }, [city]);

  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  return { ...data, loading, refetch: fetchRates };
}
