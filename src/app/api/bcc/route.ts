import { NextResponse } from "next/server";

import { fetchLiveFxRates } from "@/lib/bcc/client";
import { scrapeHomepageRates, type ScrapedRate } from "@/lib/bcc/scraper";
import { BCC_FX as MOCK_FX, BCC_BRANCH as MOCK_BRANCH, BCC_APP as MOCK_APP } from "@/lib/data/mock";
import type { Currency, RatePair } from "@/lib/types";

export const dynamic = "force-dynamic";

type Source = "live" | "stale" | "mock";

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
let homepageCache: { data: HomepageRates; fetchedAt: number } | null = null;

function toRatePairs(entries: ScrapedRate[]): Record<Currency, RatePair> {
  const result = {} as Record<Currency, RatePair>;
  for (const entry of entries) {
    result[entry.currency] = { buy: entry.buyRate, sell: entry.sellRate };
  }
  return result;
}

// Branch and app rates come from the same homepage request, so they share a
// single cache entry and a single success/failure outcome. If a fresh scrape
// fails (e.g. bcc.kz blocking the request), fall back to the last successful
// scrape rather than the mock data — mock is only used if we've never
// scraped successfully at all.
async function getCachedHomepageRates(): Promise<{ data: HomepageRates; source: "live" | "stale" }> {
  const cached = homepageCache;
  if (cached && Date.now() - cached.fetchedAt < HOMEPAGE_CACHE_TTL_MS) {
    return { data: cached.data, source: "live" };
  }

  try {
    const { branch, app } = await scrapeHomepageRates();
    const data: HomepageRates = { branch: toRatePairs(branch), app: toRatePairs(app) };
    homepageCache = { data, fetchedAt: Date.now() };
    return { data, source: "live" };
  } catch (err) {
    if (cached) {
      console.error(
        `[bcc] Homepage scrape failed, serving stale data from ${new Date(cached.fetchedAt).toISOString()}:`,
        err
      );
      return { data: cached.data, source: "stale" };
    }
    throw err;
  }
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
    branch = homepageResult.value.data.branch;
    app = homepageResult.value.data.app;
    branchSource = homepageResult.value.source;
    appSource = homepageResult.value.source;
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
