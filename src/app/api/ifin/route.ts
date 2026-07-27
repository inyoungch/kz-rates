import { NextResponse } from "next/server";

import { scrapeIfinCity, type ScrapedIfinEntry } from "@/lib/ifin/scraper";
import type { City, IfinSource } from "@/lib/types";

export const dynamic = "force-dynamic";

type Source = "live" | "stale" | "error";

const CITIES: City[] = ["almaty", "astana", "karaganda"];
const CACHE_TTL_MS = 15 * 60 * 1000;

interface CityCache {
  entries: ScrapedIfinEntry[];
  fetchedAt: number;
}

// One scrape covers all three currencies for a city (they're all on the same
// page), so the cache is keyed by city and sliced by currency when serving.
const cache = new Map<City, CityCache>();

async function getCityEntries(
  city: City
): Promise<{ entries: ScrapedIfinEntry[]; source: Source; fetchedAt: number }> {
  const cached = cache.get(city);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return { entries: cached.entries, source: "live", fetchedAt: cached.fetchedAt };
  }

  try {
    const entries = await scrapeIfinCity(city);
    const fetchedAt = Date.now();
    cache.set(city, { entries, fetchedAt });
    return { entries, source: "live", fetchedAt };
  } catch (err) {
    if (cached) {
      console.error(
        `[ifin] ${city} scrape failed, serving last good data from ${new Date(cached.fetchedAt).toISOString()}:`,
        err
      );
      return { entries: cached.entries, source: "stale", fetchedAt: cached.fetchedAt };
    }
    console.error(`[ifin] ${city} scrape failed, no cached data available:`, err);
    return { entries: [], source: "error", fetchedAt: 0 };
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get("city") as City | null;

  if (!city || !CITIES.includes(city)) {
    return NextResponse.json(
      { error: "query param 'city' is required and must be valid" },
      { status: 400 }
    );
  }

  const { entries, source, fetchedAt } = await getCityEntries(city);

  // Serve the full per-currency rate map so clients can slice per currency
  // (the dashboard table) or read every currency at once (the calculator).
  const sources: IfinSource[] = entries.map((e) => ({
    name: e.name,
    type: e.type,
    updatedAt: e.updatedAt,
    rates: e.rates,
  }));

  return NextResponse.json({
    entries: sources,
    meta: {
      source,
      fetchedAt: new Date(fetchedAt || Date.now()).toISOString(),
    },
  });
}
