"use client";

import { useCallback, useMemo, useState } from "react";

import { Header } from "@/components/header";
import { BccBlock } from "@/components/bcc-block";
import { FxClosedBanner } from "@/components/fx-closed-banner";
import { BestRateBanner } from "@/components/best-rate-banner";
import { RatesSection } from "@/components/rates-section";
import { Calculator } from "@/components/calculator";
import { useNow } from "@/hooks/use-now";
import { useAutoRefresh } from "@/hooks/use-auto-refresh";
import { useBccRates } from "@/hooks/use-bcc-rates";
import { useNbkRate } from "@/hooks/use-nbk-rate";
import { useIfinRates } from "@/hooks/use-ifin-rates";
import { getFxStatus } from "@/lib/fx-status";
import { getFreshness } from "@/lib/format";
import type { City, Currency, IfinSource, RateEntry, SourceType } from "@/lib/types";

const REFRESH_INTERVAL_MS = 15 * 60 * 1000;
const CLOCK_INTERVAL_MS = 30 * 1000;

// The "best rate" highlight (and top banner) should only ever crown a rate
// from the fresh zone (< 30 min old) — anything older isn't trustworthy enough
// to declare the winner. Fall back to everything only if nothing is fresh.
function freshCandidates(entries: RateEntry[], now: Date | null): RateEntry[] {
  if (!now) return entries;
  const fresh = entries.filter((e) => getFreshness(new Date(e.updatedAt), now) === "fresh");
  return fresh.length > 0 ? fresh : entries;
}

// Slice the multi-currency iFin sources down to a single currency's buy/sell
// pair for the dashboard table and best-rate banners. Sources that don't quote
// the requested currency are dropped.
function projectIfin(sources: IfinSource[], currency: Currency): RateEntry[] {
  const entries: RateEntry[] = [];
  for (const s of sources) {
    const rate = s.rates[currency];
    if (!rate) continue;
    entries.push({
      name: s.name,
      type: s.type,
      buy: rate.buy,
      sell: rate.sell,
      updatedAt: s.updatedAt,
    });
  }
  return entries;
}

// RateEntry uses the customer-facing convention: .buy = what you pay when
// buying (higher), .sell = what you receive when selling (lower).
// Best to sell your currency = highest payout (max "sell").
function bestToSell(entries: RateEntry[], now: Date | null): RateEntry | null {
  const candidates = freshCandidates(entries, now);
  if (candidates.length === 0) return null;
  return candidates.reduce((best, e) => (e.sell > best.sell ? e : best));
}
// Best to buy currency = lowest cost (min "buy").
function bestToBuy(entries: RateEntry[], now: Date | null): RateEntry | null {
  const candidates = freshCandidates(entries, now);
  if (candidates.length === 0) return null;
  return candidates.reduce((best, e) => (e.buy < best.buy ? e : best));
}

export function Dashboard() {
  const [city, setCity] = useState<City>("almaty");
  const [currency, setCurrency] = useState<Currency>("USD");
  const [activeTab, setActiveTab] = useState<SourceType>("bank");

  const now = useNow(CLOCK_INTERVAL_MS);
  const fxStatus = now ? getFxStatus(now) : null;
  const fxOpen = fxStatus?.isOpen ?? false;

  const bcc = useBccRates();
  const nbk = useNbkRate();
  const ifin = useIfinRates(city);
  const { refetch: refetchBcc } = bcc;
  const { refetch: refetchNbk } = nbk;
  const { refetch: refetchIfin } = ifin;
  const refetchAll = useCallback(() => {
    refetchBcc();
    refetchNbk();
    refetchIfin();
  }, [refetchBcc, refetchNbk, refetchIfin]);
  const { lastUpdated, refresh } = useAutoRefresh(REFRESH_INTERVAL_MS, refetchAll);

  const ifinEntries = useMemo(
    () => projectIfin(ifin.sources, currency),
    [ifin.sources, currency]
  );
  const banks = useMemo(() => ifinEntries.filter((e) => e.type === "bank"), [ifinEntries]);
  const exchangers = useMemo(
    () => ifinEntries.filter((e) => e.type === "exchanger"),
    [ifinEntries]
  );

  const bestBank = useMemo(
    () => ({ toSellEntry: bestToSell(banks, now), toBuyEntry: bestToBuy(banks, now) }),
    [banks, now]
  );
  const bestExchanger = useMemo(
    () => ({ toSellEntry: bestToSell(exchangers, now), toBuyEntry: bestToBuy(exchangers, now) }),
    [exchangers, now]
  );

  // Top banner reflects whichever tab (banks or exchangers) is active.
  const activeBest = activeTab === "bank" ? bestBank : bestExchanger;


  return (
    <div className="min-h-screen">
      {/* Sticky, full-bleed so it reads as page chrome rather than a card
          belonging to whatever section happens to sit right below it. */}
      <div className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto max-w-3xl px-4 py-3 sm:py-4">
          <Header
            city={city}
            onCityChange={setCity}
            currency={currency}
            onCurrencyChange={setCurrency}
            fxStatus={fxStatus}
            lastUpdated={lastUpdated}
            nbRate={nbk.rates[currency]}
            nbRateFallback={nbk.source === "mock"}
            onRefresh={refresh}
          />
        </div>
      </div>

      <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 sm:py-10">
        {fxStatus !== null && !fxStatus.isOpen && <FxClosedBanner />}

        <BccBlock
          fxRate={bcc.fx[currency]}
          branchRate={bcc.branch[currency]}
          appRate={bcc.app[currency]}
          fxOpen={fxOpen}
          fxSource={bcc.fxSource}
          branchSource={bcc.branchSource}
          appSource={bcc.appSource}
        />

        <BestRateBanner
          bestBuy={
            activeBest.toBuyEntry
              ? { name: activeBest.toBuyEntry.name, rate: activeBest.toBuyEntry.buy }
              : null
          }
          bestSell={
            activeBest.toSellEntry
              ? { name: activeBest.toSellEntry.name, rate: activeBest.toSellEntry.sell }
              : null
          }
        />

        <RatesSection
          banks={banks}
          exchangers={exchangers}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          bestBuy={activeBest.toBuyEntry?.buy ?? NaN}
          bestSell={activeBest.toSellEntry?.sell ?? NaN}
          now={now}
          fetchedAt={ifin.fetchedAt}
          onRefresh={refetchIfin}
        />

        <Calculator
          defaultCurrency={currency}
          bccFx={bcc.fx}
          fxOpen={fxOpen}
          sources={ifin.sources}
        />
      </div>
    </div>
  );
}
