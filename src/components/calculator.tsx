"use client";

import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatTenge } from "@/lib/format";
import type { Currency, IfinSource, RatePair } from "@/lib/types";
import { cn } from "@/lib/utils";

interface CalculatorProps {
  /** Currency the calculator opens on; afterwards it tracks its own selector. */
  defaultCurrency: Currency;
  bccFx: Record<Currency, RatePair>;
  fxOpen: boolean;
  sources: IfinSource[];
}

interface Source {
  name: string;
  /** KZT received per unit of the selected currency sold to this source. */
  sellRate: number;
}

const CURRENCY_OPTIONS: Currency[] = ["USD", "EUR", "RUB"];
const DEFAULT_VISIBLE = 5;

export function Calculator({ defaultCurrency, bccFx, fxOpen, sources: rateSources }: CalculatorProps) {
  // Independent of the header tab — changing this shows a different currency's
  // rates in the calculator without switching the whole dashboard view.
  const [currency, setCurrency] = useState<Currency>(defaultCurrency);
  const [amount, setAmount] = useState("1000");
  const [expanded, setExpanded] = useState(false);
  const numericAmount = Number(amount.replace(",", "."));
  const validAmount = Number.isFinite(numericAmount) && numericAmount > 0 ? numericAmount : 0;

  const sources: Source[] = useMemo(() => {
    const list: Source[] = [];
    // БЦК FX uses the bid/offer convention: .buy = the bid = payout when selling.
    if (fxOpen) list.push({ name: "БЦК FX", sellRate: bccFx[currency].buy });
    // Banks/exchangers use the customer-facing convention: .sell = payout when
    // selling — both lists end up comparable as "KZT received".
    for (const entry of rateSources) {
      const rate = entry.rates[currency];
      if (rate) list.push({ name: entry.name, sellRate: rate.sell });
    }
    return list.sort((a, b) => b.sellRate - a.sellRate);
  }, [fxOpen, bccFx, currency, rateSources]);

  const bestAmount = validAmount * (sources[0]?.sellRate ?? 0);
  const visibleSources = expanded ? sources : sources.slice(0, DEFAULT_VISIBLE);
  const hiddenCount = sources.length - DEFAULT_VISIBLE;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Калькулятор обмена</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">У меня есть</span>
          <Input
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-32"
          />
          <div className="relative">
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as Currency)}
              aria-label="Валюта для расчёта"
              className="h-10 appearance-none rounded-md border border-input bg-background pl-3 pr-8 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {CURRENCY_OPTIONS.map((cur) => (
                <option key={cur} value={cur}>
                  {cur}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>

        {sources.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Нет курсов для {currency}. Попробуйте обновить позже.
          </p>
        ) : (
          <>
            <div className="space-y-1.5">
              {visibleSources.map((source, i) => {
                const result = validAmount * source.sellRate;
                const diff = bestAmount - result;
                const isBest = i === 0;
                return (
                  <div
                    key={source.name}
                    className={cn(
                      "flex flex-col gap-0.5 rounded-md px-3 py-2 text-sm sm:flex-row sm:items-center sm:justify-between",
                      isBest && "bg-success/10 font-semibold text-success"
                    )}
                  >
                    <span className="flex flex-wrap items-center gap-1.5">
                      {source.name}
                      {isBest && (
                        <span className="rounded bg-success/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-success">
                          Выгоднее всего
                        </span>
                      )}
                    </span>
                    <span className="flex flex-wrap items-center gap-2 tabular-nums">
                      {formatTenge(result)}
                      {!isBest && diff > 0 && (
                        <span className="text-xs font-normal text-muted-foreground">
                          меньше на {formatTenge(diff)}
                        </span>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>

            {hiddenCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => setExpanded((v) => !v)}
              >
                {expanded ? "Свернуть" : `Показать ещё (${hiddenCount})`}
                <ChevronDown className={cn("h-4 w-4 transition-transform", expanded && "rotate-180")} />
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
