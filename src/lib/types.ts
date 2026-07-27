export type Currency = "USD" | "EUR" | "RUB";
export type City = "almaty" | "astana" | "karaganda";

export interface RatePair {
  buy: number;
  sell: number;
}

export type SourceType = "bank" | "exchanger";

export interface RateEntry {
  name: string;
  buy: number;
  sell: number;
  type: SourceType;
  /** ISO timestamp of when this entry's rate was last confirmed at the source. */
  updatedAt: string;
}

/**
 * A bank/exchanger carrying rates for every currency it quotes (not just the
 * one currently selected on the dashboard). The calculator needs this so its
 * own currency selector can work independently of the header.
 */
export interface IfinSource {
  name: string;
  type: SourceType;
  /** ISO timestamp of when this source's rates were last confirmed. */
  updatedAt: string;
  rates: Partial<Record<Currency, RatePair>>;
}

/** Which column the "Банки и обменники" table is currently sorted by. */
export type SortFocus = "sell" | "buy";

/**
 * How the "Банки и обменники" table orders rows:
 * - "rate": freshness zones (fresh → semi → stale), sorted by rate within each.
 * - "time": purely by updatedAt (newest first), zones ignored.
 */
export type SortMode = "rate" | "time";
