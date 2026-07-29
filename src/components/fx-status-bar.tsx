"use client";

import { RefreshCw } from "lucide-react";

import type { FxStatus } from "@/lib/fx-status";
import { formatRate, formatTime } from "@/lib/format";

interface FxStatusBarProps {
  fxStatus: FxStatus | null;
  lastUpdated: Date | null;
  nbRate: number;
  nbRateFallback?: boolean;
  onRefresh: () => void;
}

export function FxStatusBar({
  fxStatus,
  lastUpdated,
  nbRate,
  nbRateFallback,
  onRefresh,
}: FxStatusBarProps) {
  return (
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
          <span className="ml-1.5 text-xs" title="Курс НБ РК недоступен, показаны резервные данные">
            резерв
          </span>
        )}
      </span>
    </div>
  );
}
