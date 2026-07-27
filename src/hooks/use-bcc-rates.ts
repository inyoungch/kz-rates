"use client";

import { useCallback, useEffect, useState } from "react";

import { BCC_FX, BCC_BRANCH, BCC_APP } from "@/lib/data/mock";
import type { Currency, RatePair } from "@/lib/types";

type Source = "live" | "stale" | "mock";

interface BccData {
  fx: Record<Currency, RatePair>;
  branch: Record<Currency, RatePair>;
  app: Record<Currency, RatePair>;
  fxSource: Source;
  branchSource: Source;
  appSource: Source;
}

interface BccApiResponse {
  fx: Record<Currency, RatePair>;
  branch: Record<Currency, RatePair>;
  app: Record<Currency, RatePair>;
  meta: {
    fxSource: Source;
    branchSource: Source;
    appSource: Source;
    fetchedAt: string;
  };
}

const INITIAL: BccData = {
  fx: BCC_FX,
  branch: BCC_BRANCH,
  app: BCC_APP,
  fxSource: "mock",
  branchSource: "mock",
  appSource: "mock",
};

export function useBccRates() {
  const [data, setData] = useState<BccData>(INITIAL);
  const [loading, setLoading] = useState(true);

  const fetchRates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/bcc", { cache: "no-store" });
      if (!res.ok) throw new Error(`/api/bcc returned ${res.status}`);
      const json = (await res.json()) as BccApiResponse;
      setData({
        fx: json.fx,
        branch: json.branch,
        app: json.app,
        fxSource: json.meta.fxSource,
        branchSource: json.meta.branchSource,
        appSource: json.meta.appSource,
      });
    } catch (err) {
      // Keep whatever data we already have (mock or last good fetch)
      // rather than blanking the dashboard on a transient network error.
      console.error("Failed to fetch /api/bcc, keeping previous rates:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  return { ...data, loading, refetch: fetchRates };
}
