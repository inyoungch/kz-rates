import { NextResponse } from "next/server";

import { fetchNbkRates } from "@/lib/nbk/client";
import { NATIONAL_BANK as MOCK_NATIONAL_BANK } from "@/lib/data/mock";
import type { Currency } from "@/lib/types";

export const dynamic = "force-dynamic";

type Source = "live" | "mock";

interface NbkApiResponse {
  rates: Record<Currency, number>;
  meta: {
    source: Source;
    fetchedAt: string;
  };
}

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
let cache: { data: Record<Currency, number>; expiresAt: number } | null = null;

async function getCachedNbkRates(): Promise<Record<Currency, number>> {
  if (cache && cache.expiresAt > Date.now()) {
    return cache.data;
  }
  const data = await fetchNbkRates();
  cache = { data, expiresAt: Date.now() + CACHE_TTL_MS };
  return data;
}

export async function GET() {
  let rates: Record<Currency, number>;
  let source: Source;
  try {
    rates = await getCachedNbkRates();
    source = "live";
  } catch (err) {
    console.error("[nbk] rates fetch failed, falling back to mock:", err);
    rates = MOCK_NATIONAL_BANK;
    source = "mock";
  }

  const body: NbkApiResponse = {
    rates,
    meta: { source, fetchedAt: new Date().toISOString() },
  };

  return NextResponse.json(body);
}
