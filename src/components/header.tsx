"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CITIES, CURRENCIES } from "@/lib/data/mock";
import type { City, Currency } from "@/lib/types";

interface HeaderProps {
  city: City;
  onCityChange: (city: City) => void;
  currency: Currency;
  onCurrencyChange: (currency: Currency) => void;
}

export function Header({ city, onCityChange, currency, onCurrencyChange }: HeaderProps) {
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
    </div>
  );
}
