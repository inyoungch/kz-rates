import type { City, Currency, RatePair } from "@/lib/types";

export const CURRENCIES: Currency[] = ["USD", "EUR", "RUB"];

export const CITIES: { id: City; label: string }[] = [
  { id: "almaty", label: "Алматы" },
  { id: "astana", label: "Астана" },
  { id: "karaganda", label: "Караганда" },
];

export const BCC_FX: Record<Currency, RatePair> = {
  USD: { buy: 487.2, sell: 491.8 },
  EUR: { buy: 543.5, sell: 549.2 },
  RUB: { buy: 5.72, sell: 5.95 },
};

// "Купить"/"Продать" here follow bcc.kz's own convention for these two
// retail products, where buy (Купить) > sell (Продать) — the customer's buy
// price is higher than the price they'd get selling to the bank. This is the
// opposite of BCC_FX above, which uses the standard bid<offer convention.
export const BCC_BRANCH: Record<Currency, RatePair> = {
  USD: { buy: 470.0, sell: 465.0 },
  EUR: { buy: 536.0, sell: 530.0 },
  RUB: { buy: 6.0, sell: 5.55 },
};

export const BCC_APP: Record<Currency, RatePair> = {
  USD: { buy: 471.6, sell: 465.5 },
  EUR: { buy: 536.5, sell: 530.0 },
  RUB: { buy: 6.2, sell: 5.6 },
};

export const NATIONAL_BANK: Record<Currency, number> = {
  USD: 488.5,
  EUR: 545.0,
  RUB: 5.8,
};

