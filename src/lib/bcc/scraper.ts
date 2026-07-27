import * as cheerio from "cheerio";
import type { CheerioAPI, Cheerio } from "cheerio";
import type { Element } from "domhandler";

import type { Currency } from "@/lib/types";

const HOME_URL = "https://www.bcc.kz/";
const BRANCH_HEADING = "Наличные валюты в отделении";
const APP_HEADING = "Курсы приложения bcc.kz";
const CURRENCIES: Currency[] = ["USD", "EUR", "RUB"];

// bcc.kz blocks requests without a browser-like User-Agent, and defaults to
// the Kazakh-language site (redirecting to /kz/) unless the October CMS
// session has an explicit language preference set via its AJAX framework.
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

export interface ScrapedRate {
  currency: Currency;
  buyRate: number;
  sellRate: number;
  source: "live";
}

export interface BccHomepageRates {
  branch: ScrapedRate[]; // "Наличные валюты в отделении" — "до 10 000" tier
  app: ScrapedRate[]; // "Курсы приложения bcc.kz"
}

export async function scrapeHomepageRates(): Promise<BccHomepageRates> {
  const html = await fetchRussianHomepage();
  console.log(`[bcc] scraper homepage response: ${html.length} bytes`);

  const $ = cheerio.load(html);

  const branch = parseBranchSection($);
  const app = parseAppSection($);

  return { branch, app };
}

// --- Locale handling -------------------------------------------------------

/**
 * bcc.kz picks a language per-session via an October CMS AJAX handler, not a
 * URL. A plain GET redirects to /kz/. We replicate the same request the
 * language switcher makes: establish a session, POST the language change,
 * then re-fetch with the resulting cookies to get the Russian-language page.
 */
async function fetchRussianHomepage(): Promise<string> {
  const jar = new Map<string, string>();

  const initial = await fetch(HOME_URL, { headers: { "User-Agent": USER_AGENT } });
  mergeCookies(jar, initial);

  const switchLang = await fetch(HOME_URL, {
    method: "POST",
    headers: {
      "User-Agent": USER_AGENT,
      "X-OCTOBER-REQUEST-HANDLER": "onChangeLang",
      "X-Requested-With": "XMLHttpRequest",
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: cookieHeader(jar),
    },
    body: "site=ru",
  });
  mergeCookies(jar, switchLang);

  const res = await fetch(HOME_URL, {
    headers: { "User-Agent": USER_AGENT, Cookie: cookieHeader(jar) },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`BCC homepage fetch failed: ${res.status}`);
  }
  return res.text();
}

function mergeCookies(jar: Map<string, string>, res: Response): void {
  const setCookies = res.headers.getSetCookie?.() ?? [];
  for (const raw of setCookies) {
    const pair = raw.split(";")[0];
    const eq = pair.indexOf("=");
    if (eq > 0) jar.set(pair.slice(0, eq).trim(), pair.slice(eq + 1).trim());
  }
}

function cookieHeader(jar: Map<string, string>): string {
  return Array.from(jar.entries())
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");
}

// --- Section parsing ---------------------------------------------------

function findCard($: CheerioAPI, headingText: string): Cheerio<Element> {
  const heading = $("div")
    .filter((_, el) => $(el).hasClass("font-semibold") && $(el).text().trim() === headingText)
    .first();
  if (heading.length === 0) {
    throw new Error(`BCC homepage: heading "${headingText}" not found (markup may have changed)`);
  }
  // heading -> its "mb-4" wrapper -> the card root
  return heading.parent().parent();
}

function findCurrencyRows($: CheerioAPI, card: Cheerio<Element>): Cheerio<Element> {
  return card.find("div").filter((_, el) => $(el).hasClass("last:mb-0"));
}

function currencyFromRowText(text: string): Currency | null {
  return CURRENCIES.find((c) => text.includes(c)) ?? null;
}

/** "Наличные валюты в отделении" — 4 cells: name, tiers, Продать (2 tiers), Купить (2 tiers). */
function parseBranchSection($: CheerioAPI): ScrapedRate[] {
  const card = findCard($, BRANCH_HEADING);
  const rows = findCurrencyRows($, card);

  const results: ScrapedRate[] = [];
  rows.each((_, el) => {
    const row = $(el);
    const nameText = row.children("div").first().children().eq(0).text().trim();
    const currency = currencyFromRowText(nameText);
    if (!currency) {
      console.warn(`[bcc] scraper: branch section row has unrecognized currency: "${nameText}"`);
      return;
    }

    const cells = row.children("div").first().children();
    // "до 10 000" is the first tier in both the Продать and Купить columns.
    const sellText = cells.eq(2).children().eq(0).text().trim();
    const buyText = cells.eq(3).children().eq(0).text().trim();
    const sellRate = parseFloat(sellText);
    const buyRate = parseFloat(buyText);

    if (!Number.isFinite(buyRate) || !Number.isFinite(sellRate)) {
      console.warn(
        `[bcc] scraper: branch section could not parse ${currency}: "${sellText}" / "${buyText}"`
      );
      return;
    }

    console.log(`[bcc] scraper: branch ${currency} Продать=${sellRate} Купить=${buyRate}`);
    results.push({ currency, buyRate, sellRate, source: "live" });
  });

  assertAllCurrenciesFound(results, "branch");
  return results;
}

/** "Курсы приложения bcc.kz" — 3 cells: name, Продать, Купить. */
function parseAppSection($: CheerioAPI): ScrapedRate[] {
  const card = findCard($, APP_HEADING);
  const rows = findCurrencyRows($, card);

  const results: ScrapedRate[] = [];
  rows.each((_, el) => {
    const row = $(el);
    const cells = row.children("div").first().children();
    const nameText = cells.eq(0).text().trim();
    const currency = currencyFromRowText(nameText);
    if (!currency) {
      console.warn(`[bcc] scraper: app section row has unrecognized currency: "${nameText}"`);
      return;
    }

    const sellText = cells.eq(1).text().trim();
    const buyText = cells.eq(2).text().trim();
    const sellRate = parseFloat(sellText);
    const buyRate = parseFloat(buyText);

    if (!Number.isFinite(buyRate) || !Number.isFinite(sellRate)) {
      console.warn(
        `[bcc] scraper: app section could not parse ${currency}: "${sellText}" / "${buyText}"`
      );
      return;
    }

    console.log(`[bcc] scraper: app ${currency} Продать=${sellRate} Купить=${buyRate}`);
    results.push({ currency, buyRate, sellRate, source: "live" });
  });

  assertAllCurrenciesFound(results, "app");
  return results;
}

function assertAllCurrenciesFound(results: ScrapedRate[], label: string): void {
  if (results.length !== CURRENCIES.length) {
    throw new Error(
      `BCC homepage: ${label} section expected ${CURRENCIES.length} currencies, got ${results.length} (see logs above)`
    );
  }
}
