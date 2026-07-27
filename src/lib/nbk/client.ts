import { XMLParser } from "fast-xml-parser";

import type { Currency } from "@/lib/types";

const NBK_URL = "https://nationalbank.kz/rss/rates_all.xml";
const CURRENCIES: Currency[] = ["USD", "EUR", "RUB"];

interface NbkItem {
  title: string;
  description: string | number;
  quant?: string | number;
}

interface NbkFeed {
  rss?: {
    channel?: {
      item?: NbkItem | NbkItem[];
    };
  };
}

export async function fetchNbkRates(): Promise<Record<Currency, number>> {
  const res = await fetch(NBK_URL, { cache: "no-store" });
  const text = await res.text();
  console.log(`[nbk] rates_all.xml response (${res.status}): ${text.length} bytes`);

  if (!res.ok) {
    throw new Error(`NBK rates request failed: ${res.status}`);
  }

  const parser = new XMLParser();
  const parsed = parser.parse(text) as NbkFeed;
  const rawItems = parsed.rss?.channel?.item;
  const items = Array.isArray(rawItems) ? rawItems : rawItems ? [rawItems] : [];
  if (items.length === 0) {
    throw new Error("NBK rates response has no <item> entries (see logged body above)");
  }

  const byTitle = new Map(items.map((item) => [item.title, item]));
  const result = {} as Record<Currency, number>;

  for (const currency of CURRENCIES) {
    const item = byTitle.get(currency);
    const rate = Number(item?.description);
    const quant = Number(item?.quant ?? 1) || 1;
    if (!item || !Number.isFinite(rate)) {
      throw new Error(`NBK rates response missing entry for ${currency}`);
    }
    result[currency] = rate / quant;
    console.log(`[nbk] ${currency} = ${result[currency]} (quant ${quant})`);
  }

  return result;
}
