import { ArrowUpRight, Lock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatRate } from "@/lib/format";
import type { RatePair } from "@/lib/types";
import { cn } from "@/lib/utils";

type Source = "live" | "stale" | "mock";

interface BccBlockProps {
  fxRate: RatePair;
  branchRate: RatePair;
  appRate: RatePair;
  fxOpen: boolean;
  fxSource: Source;
  branchSource: Source;
  appSource: Source;
}

export function BccBlock({
  fxRate,
  branchRate,
  appRate,
  fxOpen,
  fxSource,
  branchSource,
  appSource,
}: BccBlockProps) {
  return (
    <Card className="relative overflow-hidden border-primary/25 bg-gradient-to-b from-primary/[0.08] to-card shadow-xl shadow-black/30">
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-3 space-y-0 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold tracking-tight">Банк ЦентрКредит</span>
          <Badge>Ваш банк</Badge>
        </div>
        <Button variant="outline" size="sm" asChild>
          <a href="https://bcc.kz" target="_blank" rel="noopener noreferrer">
            Открыть в BCC.kz
            <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        <RateRow
          label="БЦК FX (биржа)"
          badge={fxOpen ? "Биржевой" : undefined}
          rate={fxRate}
          bidOffer
          disabled={!fxOpen}
          disabledNote="Закрыт до 10:30"
          isFallback={fxSource !== "live"}
        />
        <RateRow label="БЦК В отделении" rate={branchRate} isFallback={branchSource !== "live"} />
        <RateRow label="БЦК Приложение" rate={appRate} isFallback={appSource !== "live"} />
      </CardContent>
    </Card>
  );
}

function RateRow({
  label,
  badge,
  rate,
  bidOffer,
  disabled,
  disabledNote,
  isFallback,
}: {
  label: string;
  badge?: string;
  rate: RatePair;
  /**
   * FX quotes use the bid/offer convention (.buy = bid, .sell = ask), the
   * opposite of the retail rows. When set, Продать shows the bid (bank buys
   * from you) and Купить shows the ask (bank sells to you).
   */
  bidOffer?: boolean;
  disabled?: boolean;
  disabledNote?: string;
  isFallback?: boolean;
}) {
  const sellValue = bidOffer ? rate.buy : rate.sell;
  const buyValue = bidOffer ? rate.sell : rate.buy;
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border px-4 py-3",
        disabled ? "bg-muted/50 opacity-60" : "bg-background"
      )}
    >
      {/* min-w-0 lets this side shrink below its content size so the title
          truncates instead of pushing the price block off its fixed column. */}
      <div className="flex min-w-0 flex-1 items-center gap-1.5">
        <span className="truncate font-medium">{label}</span>
        {/* Redundant with the page-level FX-open banner, so it's dropped
            below sm to leave room for the title instead of truncating it
            down to nothing. */}
        {badge && (
          <Badge variant="secondary" className="hidden shrink-0 sm:inline-flex">
            {badge}
          </Badge>
        )}
        {disabled && (
          <span className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
            <Lock className="h-3 w-3 shrink-0" />
            <span className="hidden sm:inline">{disabledNote}</span>
          </span>
        )}
        {isFallback && (
          <span
            className="shrink-0 text-xs text-muted-foreground"
            title="Курс BCC недоступен, показаны резервные данные"
          >
            резерв
          </span>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-3 text-sm">
        <RateValue label="Продать" value={sellValue} />
        <RateValue label="Купить" value={buyValue} />
      </div>
    </div>
  );
}

function RateValue({ label, value }: { label: string; value: number }) {
  return (
    <div className="w-16 text-right">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-bold tabular-nums tracking-tight">{formatRate(value)}</div>
    </div>
  );
}
