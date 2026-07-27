import type { Currency, RatePair } from "@/lib/types";
import { getAccessToken } from "@/lib/bcc/token";

// FX rates — Informational API 1.0.0. The 2.0.0 FX endpoint
// (v1/public/rates/fx/individual) returns 503, so this one is used instead.
// It also silently only honors the LAST `instruments` param when the query
// is repeated, and 500s on a comma-joined list — so we fetch one instrument
// per request instead of trying to batch them.
const FX_URL = "https://api.bcc.kz/bcc/production/v1/rates/fx/fl";

const INSTRUMENTS: Record<Currency, string> = {
  USD: "USD/KZT",
  EUR: "EUR/KZT",
  RUB: "RUB/KZT",
};
const CURRENCIES: Currency[] = ["USD", "EUR", "RUB"];

interface BccFxQuote {
  instrument: string;
  bids: { quoteGross: string }[];
  offers: { quoteGross: string }[];
}

interface BccFxResponse {
  payload: { currencies: BccFxQuote[] } | null;
}

export async function fetchLiveFxRates(): Promise<Record<Currency, RatePair>> {
  const token = await getAccessToken();
  const entries = await Promise.all(
    CURRENCIES.map(async (currency) => [currency, await fetchOneFxRate(currency, token)] as const)
  );
  return Object.fromEntries(entries) as Record<Currency, RatePair>;
}

async function fetchOneFxRate(currency: Currency, token: string): Promise<RatePair> {
  const instrument = INSTRUMENTS[currency];
  const url = new URL(FX_URL);
  url.searchParams.set("instruments", instrument);

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  const body = await readBody(res, `FX rate ${instrument}`);
  if (!res.ok) {
    throw new Error(`BCC FX request for ${instrument} failed: ${res.status}`);
  }

  const quote = (body as BccFxResponse | null)?.payload?.currencies?.find(
    (c) => c.instrument === instrument
  );
  const bid = quote?.bids?.[0]?.quoteGross;
  const offer = quote?.offers?.[0]?.quoteGross;
  if (!bid || !offer) {
    throw new Error(`BCC FX response missing bid/offer for ${instrument} (see logged body above)`);
  }

  return { buy: parseFloat(bid), sell: parseFloat(offer) };
}

/** Reads the raw response text, logs it, and returns it parsed as JSON (or null if not valid JSON). */
async function readBody(res: Response, label: string): Promise<unknown> {
  const text = await safeText(res);
  console.log(`[bcc] ${label} response (${res.status}):`, text);

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function safeText(res: Response): Promise<string> {
  try {
    return await res.text();
  } catch {
    return "";
  }
}
