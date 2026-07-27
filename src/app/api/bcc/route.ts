import { NextResponse } from "next/server";

import { fetchLiveFxRates } from "@/lib/bcc/client";
import { scrapeHomepageRates, type ScrapedRate } from "@/lib/bcc/scraper";
import { BCC_FX as MOCK_FX, BCC_BRANCH as MOCK_BRANCH, BCC_APP as MOCK_APP } from "@/lib/data/mock";
import type { Currency, RatePair } from "@/lib/types";

export const dynamic = "force-dynamic";

type Source = "live" | "mock";

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

interface HomepageRates {
  branch: Record<Currency, RatePair>;
  app: Record<Currency, RatePair>;
}

const HOMEPAGE_CACHE_TTL_MS = 15 * 60 * 1000;
let homepageCache: { data: HomepageRates; expiresAt: number } | null = null;

function toRatePairs(entries: ScrapedRate[]): Record<Currency, RatePair> {
  const result = {} as Record<Currency, RatePair>;
  for (const entry of entries) {
    result[entry.currency] = { buy: entry.buyRate, sell: entry.sellRate };
  }
  return result;
}

// Branch and app rates come from the same homepage request, so they share a
// single cache entry and a single success/failure outcome.
async function getCachedHomepageRates(): Promise<HomepageRates> {
  if (homepageCache && homepageCache.expiresAt > Date.now()) {
    return homepageCache.data;
  }
  const { branch, app } = await scrapeHomepageRates();
  const data: HomepageRates = { branch: toRatePairs(branch), app: toRatePairs(app) };
  homepageCache = { data, expiresAt: Date.now() + HOMEPAGE_CACHE_TTL_MS };
  return data;
}

export async function GET() {
  const [fxResult, homepageResult] = await Promise.allSettled([
    fetchLiveFxRates(),
    getCachedHomepageRates(),
  ]);

  let fx: Record<Currency, RatePair>;
  let fxSource: Source;
  if (fxResult.status === "fulfilled") {
    fx = fxResult.value;
    fxSource = "live";
  } else {
    console.error("[bcc] FX rates fetch failed, falling back to mock:", fxResult.reason);
    fx = MOCK_FX;
    fxSource = "mock";
  }

  let branch: Record<Currency, RatePair>;
  let app: Record<Currency, RatePair>;
  let branchSource: Source;
  let appSource: Source;
  if (homepageResult.status === "fulfilled") {
    branch = homepageResult.value.branch;
    app = homepageResult.value.app;
    branchSource = "live";
    appSource = "live";
  } else {
    console.error(
      "[bcc] Homepage rates scrape failed, falling back to mock:",
      homepageResult.reason
    );
    branch = MOCK_BRANCH;
    app = MOCK_APP;
    branchSource = "mock";
    appSource = "mock";
  }

  const body: BccApiResponse = {
    fx,
    branch,
    app,
    meta: {
      fxSource,
      branchSource,
      appSource,
      fetchedAt: new Date().toISOString(),
    },
  };

  return NextResponse.json(body);
}
