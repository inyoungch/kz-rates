import { Clock } from "lucide-react";

export function FxClosedBanner() {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-sm text-amber-700 dark:text-amber-400">
      <Clock className="h-4 w-4 shrink-0" />
      <span>FX откроется в 10:30</span>
    </div>
  );
}
