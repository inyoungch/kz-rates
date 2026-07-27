"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RatesTable } from "@/components/rates-table";
import { formatTime, getFreshness } from "@/lib/format";
import type { Freshness } from "@/lib/format";
import type { RateEntry, SortFocus, SortMode, SourceType } from "@/lib/types";
import { cn } from "@/lib/utils";

interface RatesSectionProps {
  banks: RateEntry[];
  exchangers: RateEntry[];
  activeTab: SourceType;
  onTabChange: (tab: SourceType) => void;
  bestBuy: number;
  bestSell: number;
  now: Date | null;
}

const DEFAULT_VISIBLE = 5;

export function RatesSection({
  banks,
  exchangers,
  activeTab,
  onTabChange,
  bestBuy,
  bestSell,
  now,
}: RatesSectionProps) {
  const [expanded, setExpanded] = useState(false);
  const [sortFocus, setSortFocus] = useState<SortFocus>("sell");
  const [sortMode, setSortMode] = useState<SortMode>("rate");
  useEffect(() => setExpanded(false), [activeTab]);

  const source = activeTab === "bank" ? banks : exchangers;

  // "rate" mode (default): group into freshness zones (fresh → semi → stale)
  // and sort by rate within each zone. "time" mode: pure updatedAt DESC.
  // Best sellRate (Продать) = bank pays you most = best for you (DESC).
  // Best buyRate (Купить) = you pay least = best for you (ASC).
  const entries = useMemo(() => {
    const rank = (a: RateEntry, b: RateEntry) =>
      sortFocus === "sell" ? b.sell - a.sell : a.buy - b.buy;

    if (sortMode === "time") {
      return [...source].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    }

    if (!now) return [...source].sort(rank);

    const zones: Record<Freshness, RateEntry[]> = { fresh: [], semi: [], stale: [] };
    for (const entry of source) {
      zones[getFreshness(new Date(entry.updatedAt), now)].push(entry);
    }
    return [
      ...zones.fresh.sort(rank),
      ...zones.semi.sort(rank),
      ...zones.stale.sort(rank),
    ];
  }, [source, sortFocus, now, sortMode]);

  const visibleEntries = expanded ? entries : entries.slice(0, DEFAULT_VISIBLE);
  const hiddenCount = entries.length - DEFAULT_VISIBLE;
  const noun = activeTab === "bank" ? "банков" : "обменников";

  const freshestLabel = useMemo(() => {
    if (!now || source.length === 0) return "--";
    const freshestMs = Math.max(...source.map((e) => new Date(e.updatedAt).getTime()));
    return formatTime(new Date(freshestMs));
  }, [source, now]);

  return (
    <Card>
      <CardHeader className="space-y-3 pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle>Банки и обменники</CardTitle>
          <span className="text-xs text-muted-foreground">Обновлено: {freshestLabel}</span>
        </div>
        <Tabs value={activeTab} onValueChange={(v) => onTabChange(v as SourceType)}>
          <TabsList>
            <TabsTrigger value="bank">Банки</TabsTrigger>
            <TabsTrigger value="exchanger">Обменники</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Не удалось загрузить данные. Попробуйте обновить позже.
          </p>
        ) : (
          <>
            <div className="mb-3 flex items-center justify-end">
              <Tabs value={sortMode} onValueChange={(v) => setSortMode(v as SortMode)}>
                <TabsList className="h-7">
                  <TabsTrigger value="rate" className="px-2.5 py-0.5 text-xs">
                    По курсу
                  </TabsTrigger>
                  <TabsTrigger value="time" className="px-2.5 py-0.5 text-xs">
                    По времени
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <RatesTable
              rows={visibleEntries}
              bestBuy={bestBuy}
              bestSell={bestSell}
              nameHeader="Банк/Обменник"
              now={now}
              sortFocus={sortFocus}
              onSortFocusChange={setSortFocus}
              showZones={sortMode === "rate"}
            />
          </>
        )}

        {hiddenCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 w-full"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? "Свернуть" : `Показать ещё (${hiddenCount} ${noun})`}
            <ChevronDown className={cn("h-4 w-4 transition-transform", expanded && "rotate-180")} />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
