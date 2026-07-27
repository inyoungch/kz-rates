import type { ReactNode } from "react";
import { CheckCircle2 } from "lucide-react";

import { formatRate } from "@/lib/format";

interface BestRateBannerProps {
  bestBuy: { name: string; rate: number } | null;
  bestSell: { name: string; rate: number } | null;
}

export function BestRateBanner({ bestBuy, bestSell }: BestRateBannerProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <BannerRow
        text={
          bestSell ? (
            <>
              Выгоднее продать: <span className="font-semibold">{bestSell.name}</span> —{" "}
              {formatRate(bestSell.rate)} ₸
            </>
          ) : (
            "Загрузка курсов…"
          )
        }
      />
      <BannerRow
        text={
          bestBuy ? (
            <>
              Выгоднее купить: <span className="font-semibold">{bestBuy.name}</span> —{" "}
              {formatRate(bestBuy.rate)} ₸
            </>
          ) : (
            "Загрузка курсов…"
          )
        }
      />
    </div>
  );
}

function BannerRow({ text }: { text: ReactNode }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 px-4 py-3 text-sm">
      <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
      <span>{text}</span>
    </div>
  );
}
