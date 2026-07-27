import { Fragment } from "react";
import { AlertTriangle, ChevronDown } from "lucide-react";

import { formatRate, formatWhen, getFreshness } from "@/lib/format";
import type { Freshness } from "@/lib/format";
import type { RateEntry, SortFocus } from "@/lib/types";
import { cn } from "@/lib/utils";

interface RatesTableProps {
  rows: RateEntry[];
  bestBuy: number;
  bestSell: number;
  nameHeader?: string;
  now: Date | null;
  sortFocus: SortFocus;
  onSortFocusChange: (focus: SortFocus) => void;
  /** When true (rate mode), draw the "Обновлено давно" divider before stale rows. */
  showZones: boolean;
}

export function RatesTable({
  rows,
  bestBuy,
  bestSell,
  nameHeader = "Банк",
  now,
  sortFocus,
  onSortFocusChange,
  showZones,
}: RatesTableProps) {
  const freshnessOf = (row: RateEntry): Freshness =>
    now ? getFreshness(new Date(row.updatedAt), now) : "fresh";

  // Rows are pre-grouped fresh → semi → stale, so the first stale row marks the
  // start of the "updated long ago" section. Only divide in rate (zone) mode.
  const firstStaleIndex = showZones ? rows.findIndex((r) => freshnessOf(r) === "stale") : -1;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="pb-2 font-medium">{nameHeader}</th>
            <SortableHeader focus="sell" active={sortFocus === "sell"} onClick={onSortFocusChange}>
              Продать
            </SortableHeader>
            <SortableHeader focus="buy" active={sortFocus === "buy"} onClick={onSortFocusChange}>
              Купить
            </SortableHeader>
            <th className="pb-2 text-right font-medium">Когда</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const lastUpdated = new Date(row.updatedAt);
            const freshness = freshnessOf(row);
            // Best-rate highlight only ever crowns a fresh row.
            const isFresh = freshness === "fresh";
            const bestSellHit = isFresh && row.sell === bestSell;
            const bestBuyHit = isFresh && row.buy === bestBuy;

            return (
              <Fragment key={row.name}>
                {i === firstStaleIndex && (
                  <tr>
                    <td colSpan={4} className="pt-4 pb-1.5">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="h-px flex-1 bg-border" />
                        Обновлено давно
                        <span className="h-px flex-1 bg-border" />
                      </div>
                    </td>
                  </tr>
                )}
                <tr
                  className={cn(
                    "border-b last:border-0",
                    freshness === "semi" && "opacity-70",
                    freshness === "stale" && "text-muted-foreground"
                  )}
                >
                  <td className="py-2.5">{row.name}</td>
                  <td
                    className={cn(
                      "py-2.5 text-right tabular-nums",
                      bestSellHit && "rounded bg-success/15 font-semibold text-success"
                    )}
                  >
                    {formatRate(row.sell)}
                  </td>
                  <td
                    className={cn(
                      "py-2.5 text-right tabular-nums",
                      bestBuyHit && "rounded bg-success/15 font-semibold text-success"
                    )}
                  >
                    {formatRate(row.buy)}
                  </td>
                  <td
                    className={cn(
                      "py-2.5 text-right tabular-nums text-xs",
                      freshness === "semi" && "text-amber-600 dark:text-amber-500",
                      freshness !== "semi" && "text-muted-foreground"
                    )}
                  >
                    <span className="inline-flex items-center justify-end gap-1">
                      {freshness === "semi" && <AlertTriangle className="h-3 w-3" />}
                      {now ? formatWhen(lastUpdated, now) : "—"}
                    </span>
                  </td>
                </tr>
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function SortableHeader({
  focus,
  active,
  onClick,
  children,
}: {
  focus: SortFocus;
  active: boolean;
  onClick: (focus: SortFocus) => void;
  children: string;
}) {
  return (
    <th className="pb-2 text-right font-medium">
      <button
        type="button"
        onClick={() => onClick(focus)}
        className={cn(
          "inline-flex items-center gap-0.5 transition-colors hover:text-foreground",
          active && "text-foreground"
        )}
      >
        {children}
        <ChevronDown className={cn("h-3 w-3 transition-opacity", active ? "opacity-100" : "opacity-0")} />
      </button>
    </th>
  );
}
