"use client";

import { RefreshCw } from "lucide-react";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CITIES, CURRENCIES } from "@/lib/data/mock";
import type { City, Currency } from "@/lib/types";
import type { FxStatus } from "@/lib/fx-status";
import { formatRate, formatTime } from "@/lib/format";

interface HeaderProps {
  city: City;
  onCityChange: (city: City) => void;
  currency: Currency;
  onCurrencyChange: (currency: Currency) => void;
  fxStatus: FxStatus | null;
  lastUpdated: Date | null;
  nbRate: number;
  nbRateFallback?: boolean;
  onRefresh: () => void;
}

export function Header({
  city,
  onCityChange,
  currency,
  onCurrencyChange,
  fxStatus,
  lastUpdated,
  nbRate,
  nbRateFallback,
  onRefresh,
}: HeaderProps) {
  return (
    <div className="space-y-3">
      <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Курсы валют</h1>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs value={city} onValueChange={(v) => onCityChange(v as City)}>
          <TabsList>
            {CITIES.map((c) => (
              <TabsTrigger key={c.id} value={c.id}>
                {c.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <Tabs value={currency} onValueChange={(v) => onCurrencyChange(v as Currency)}>
          <TabsList>
            {CURRENCIES.map((cur) => (
              <TabsTrigger key={cur} value={cur}>
                {cur}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/40 px-4 py-2.5 text-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span
              className={`h-2 w-2 rounded-full ${
                fxStatus?.isOpen ? "bg-success" : "bg-amber-500"
              }`}
            />
            <span className="text-muted-foreground">
              {fxStatus === null
                ? "Загрузка статуса…"
                : fxStatus.isOpen
                  ? "FX биржа открыта"
                  : "FX биржа закрыта"}
            </span>
          </div>
          <span className="text-muted-foreground">
            Обновлено: {lastUpdated ? formatTime(lastUpdated) : "—"}
          </span>
          <button
            onClick={onRefresh}
            className="inline-flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Обновить курсы"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
        <span className="text-muted-foreground">
          Курс НБ РК: {formatRate(nbRate)} ₸
          {nbRateFallback && (
            <span
              className="ml-1.5 text-xs"
              title="Курс НБ РК недоступен, показаны резервные данные"
            >
              резерв
            </span>
          )}
        </span>
      </div>
    </div>
  );
}
