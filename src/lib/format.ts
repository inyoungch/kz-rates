export function formatRate(value: number): string {
  return value.toFixed(2);
}

export function formatTenge(value: number): string {
  return `${Math.round(value).toLocaleString("ru-RU")} ₸`;
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

const SEMI_STALE_MS = 30 * 60 * 1000;
const STALE_MS = 2 * 60 * 60 * 1000;

/** Three freshness zones used to group, style and rank rate rows. */
export type Freshness = "fresh" | "semi" | "stale";

/**
 * fresh: updated < 30 min ago.
 * semi:  30 min – 2 hours ago (amber, slightly dimmed).
 * stale: > 2 hours ago, or on an earlier calendar day (grey, sinks to bottom).
 */
export function getFreshness(lastUpdated: Date, now: Date): Freshness {
  const sameDay = lastUpdated.toDateString() === now.toDateString();
  const diff = now.getTime() - lastUpdated.getTime();
  if (!sameDay || diff > STALE_MS) return "stale";
  if (diff > SEMI_STALE_MS) return "semi";
  return "fresh";
}

export function isStale(lastUpdated: Date, now: Date): boolean {
  return getFreshness(lastUpdated, now) === "stale";
}

export function formatWhen(lastUpdated: Date, now: Date): string {
  const sameDay = lastUpdated.toDateString() === now.toDateString();
  return sameDay ? formatTime(lastUpdated) : "вчера";
}
