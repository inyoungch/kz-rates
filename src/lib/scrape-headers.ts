// bcc.kz and ifin.kz block traffic that doesn't look like a browser request
// from Kazakhstan/Russia — this matters on Vercel since its functions run
// from US regions. A browser-like User-Agent, ru-RU Accept-Language, and a
// same-site Referer are enough to pass.
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

export function scrapeHeaders(referer: string): Record<string, string> {
  return {
    "User-Agent": USER_AGENT,
    "Accept-Language": "ru-RU,ru;q=0.9",
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    Referer: referer,
  };
}
