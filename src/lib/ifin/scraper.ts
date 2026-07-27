import * as cheerio from "cheerio";
import type { CheerioAPI, Cheerio } from "cheerio";
import type { Element } from "domhandler";

import type { City, Currency, RatePair, SourceType } from "@/lib/types";

const CITY_URLS: Record<City, string> = {
  almaty: "https://ifin.kz/exchange/almaty",
  astana: "https://ifin.kz/exchange/astana",
  karaganda: "https://ifin.kz/exchange/karaganda",
};

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

const CURRENCIES: Currency[] = ["USD", "EUR", "RUB"];

// ifin.kz's exchange pages show three Покупка/Продажа column pairs in a
// fixed order (verified against the page's own currencyId[0..2] inputs):
// USD, EUR, RUB. Each pair is two consecutive `.rate-value span` cells.
const CURRENCY_COLUMN_INDEX: Record<Currency, number> = { USD: 0, EUR: 1, RUB: 2 };

export interface ScrapedIfinEntry {
  name: string;
  type: SourceType;
  updatedAt: string; // ISO
  rates: Partial<Record<Currency, RatePair>>;
}

export async function scrapeIfinCity(city: City): Promise<ScrapedIfinEntry[]> {
  const url = CITY_URLS[city];
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
    cache: "no-store",
  });
  const text = await res.text();
  console.log(`[ifin] ${city} response (${res.status}): ${text.length} bytes`);

  if (!res.ok) {
    throw new Error(`ifin.kz ${city} request failed: ${res.status}`);
  }

  const $ = cheerio.load(text);
  const rows = $(".tbl-row.company-row");
  if (rows.length === 0) {
    throw new Error(`ifin.kz ${city}: no rows found (markup may have changed)`);
  }

  const entries: ScrapedIfinEntry[] = [];
  rows.each((_, el) => {
    const entry = parseRow($, $(el));
    if (entry) entries.push(entry);
  });

  if (entries.length === 0) {
    throw new Error(`ifin.kz ${city}: found ${rows.length} rows but parsed 0 entries`);
  }

  console.log(`[ifin] ${city}: parsed ${entries.length}/${rows.length} rows`);
  return entries;
}

function parseRow($: CheerioAPI, row: Cheerio<Element>): ScrapedIfinEntry | null {
  const link = row.find("a.table-row-title").first();
  const href = link.attr("href") ?? "";
  const type: SourceType | null = href.startsWith("/bank/")
    ? "bank"
    : href.startsWith("/exchanger/")
      ? "exchanger"
      : null;
  if (!type) return null;

  // The name link can contain a nested ".table-row-info" span (an aka/legal
  // name) — strip it so it doesn't leak into the display name.
  const nameEl = link.clone();
  nameEl.find(".table-row-info").remove();
  const name = nameEl.text().trim().replace(/\s+/g, " ");
  if (!name) return null;

  let updatedAtText: string | null = null;
  row.find(".table-row-info").each((_, infoEl) => {
    const match = $(infoEl)
      .text()
      .trim()
      .match(/Обновлен:\s*(\d{2}\.\d{2}\.\d{4}\s+\d{2}:\d{2})/);
    if (match) updatedAtText = match[1];
  });
  if (!updatedAtText) return null;

  const rateTexts = row
    .find(".rate-value span")
    .map((_, s) => $(s).text().trim())
    .get();
  if (rateTexts.length < CURRENCIES.length * 2) return null;

  const rates: Partial<Record<Currency, RatePair>> = {};
  for (const currency of CURRENCIES) {
    const idx = CURRENCY_COLUMN_INDEX[currency] * 2;
    // Column order on the page is Покупка (bank buys from you — your
    // sellRate) then Продажа (bank sells to you — your buyRate).
    const pokupka = parseFloat(rateTexts[idx]);
    const prodazha = parseFloat(rateTexts[idx + 1]);
    if (Number.isFinite(pokupka) && Number.isFinite(prodazha)) {
      rates[currency] = { buy: prodazha, sell: pokupka };
    }
  }
  if (Object.keys(rates).length === 0) return null;

  return { name, type, updatedAt: parseIfinTimestamp(updatedAtText), rates };
}

/** ifin.kz displays "DD.MM.YYYY HH:MM" in Astana local time (UTC+5). */
function parseIfinTimestamp(text: string): string {
  const match = text.match(/(\d{2})\.(\d{2})\.(\d{4})\s+(\d{2}):(\d{2})/);
  if (!match) throw new Error(`Unrecognized ifin.kz timestamp: "${text}"`);
  const [, dd, mm, yyyy, hh, min] = match;
  const utcMs = Date.UTC(Number(yyyy), Number(mm) - 1, Number(dd), Number(hh) - 5, Number(min));
  return new Date(utcMs).toISOString();
}
