const TOKEN_URL =
  process.env.BCC_TOKEN_URL ?? "https://api.bcc.kz/bcc/production/v2/oauth/token";
const SCOPE = "bcc.application.informational.api";

// Refresh a bit early so an in-flight request never hands out a token that
// expires mid-call.
const EXPIRY_BUFFER_MS = 30_000;

interface CachedToken {
  accessToken: string;
  expiresAt: number;
}

interface TokenResponse {
  access_token: string;
  expires_in: number;
}

let cached: CachedToken | null = null;
let inFlight: Promise<string> | null = null;

export async function getAccessToken(): Promise<string> {
  if (cached && cached.expiresAt > Date.now()) {
    return cached.accessToken;
  }
  if (inFlight) {
    return inFlight;
  }

  inFlight = fetchNewToken().finally(() => {
    inFlight = null;
  });
  return inFlight;
}

async function fetchNewToken(): Promise<string> {
  const clientId = process.env.BCC_CLIENT_ID;
  const clientSecret = process.env.BCC_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("BCC_CLIENT_ID / BCC_CLIENT_SECRET are not configured");
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      scope: SCOPE,
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`BCC token request failed: ${res.status} ${await safeText(res)}`);
  }

  const data = (await res.json()) as TokenResponse;
  if (!data.access_token) {
    throw new Error("BCC token response missing access_token");
  }

  cached = {
    accessToken: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000 - EXPIRY_BUFFER_MS,
  };
  return cached.accessToken;
}

async function safeText(res: Response): Promise<string> {
  try {
    return await res.text();
  } catch {
    return "";
  }
}
