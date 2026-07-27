# KZ Rates — Currency Dashboard Kazakhstan

## Product
Dashboard showing currency rates from multiple sources in one place.
User opens one page and immediately sees where to buy/sell currency profitably.

## Data Sources
- BCC FX API: GET https://api.bcc.kz/bcc/production/v1/rates/fx/fl
  Auth: OAuth2, token: POST https://api.bcc.kz/bcc/production/v2/oauth/token
  Env vars: BCC_CLIENT_ID, BCC_CLIENT_SECRET
  Available: weekdays only, 10:30–18:00 Astana time (UTC+5)
  One instrument per request — the API 500s on a comma-joined list and only
  honors the last value if the query param is repeated.

- BCC В отделении / БЦК Приложение: scraped from the bcc.kz homepage
  (not a documented API — the old `/v1/rates` endpoint 404s). Requires
  replicating the site's own AJAX language switch (session cookie → POST
  `onChangeLang` → re-fetch) to get the Russian-language markup.

- iFin.kz: scrape ifin.kz/exchange/{city}
  Cities: almaty, astana, karaganda
  One page per city returns banks + exchangers for all of USD/EUR/RUB at
  once. Row type (bank vs exchanger) comes from the profile link prefix
  (`/bank/...` vs `/exchanger/...`). Column order per currency is
  Покупка (bank buys from you → your sellRate) then Продажа (bank sells
  to you → your buyRate).

- National Bank of Kazakhstan: GET https://nationalbank.kz/rss/rates_all.xml
  Official reference rate, updates once per business day.

## Stack
Next.js 14 App Router, TypeScript, Tailwind CSS, shadcn/ui, Vercel

## Rules
- BCC block ALWAYS first, pinned at top, never moves
- Best buy rate = green highlight
- Best sell rate = green highlight
- FX active only weekdays 10:30–18:00 Astana (UTC+5)
- When FX closed: show regular BCC rate + banner "FX откроется в 10:30"
- Auto-refresh every 15 minutes
- Mobile responsive

## Current Status
Working end-to-end on real data:
- ✅ BCC FX API (real data via v1/rates/fx/fl)
- ✅ BCC В отделении (scraped from bcc.kz homepage)
- ✅ BCC Приложение (scraped from bcc.kz homepage)
- ✅ iFin banks + exchangers (scraped per city)
- ✅ NBK official rate
- ✅ Freshness zones (< 30min fresh, 30min–2h amber, >2h stale)
- ✅ Sort toggle (по курсу / по времени)
- ✅ Calculator with USD/EUR/RUB
- ✅ City switcher (Алматы/Астана/Караганда)

## Next task
Deploy to Vercel production.
