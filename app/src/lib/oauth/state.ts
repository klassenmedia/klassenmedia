// Signierter OAuth-State (CSRF-Schutz): trägt Workspace/Kunde/Nonce durch den
// Redirect zur Plattform und zurück. HMAC-SHA256 mit APP_SECRET — manipulierte
// oder abgelaufene States werden im Callback verworfen. Bewusst ohne
// "server-only"-Import, damit sich Signatur/Verifikation unit-testen lassen
// (die Routen selbst laufen ohnehin nur serverseitig).

import { createHmac } from "crypto";

/** Name des httpOnly-Nonce-Cookies, das Start- und Callback-Route verbindet. */
export const NONCE_COOKIE = "planbar_oauth_nonce";

export interface OAuthState {
  workspaceId: string;
  platform: string;
  clientId: string | null;
  nonce: string;
  ts: number;
}

const MAX_AGE_MS = 10 * 60 * 1000; // 10 Minuten fürs Durchklicken des Consent-Screens

function secret(): string {
  const s = process.env.APP_SECRET;
  if (!s || s.length < 32) throw new Error("APP_SECRET fehlt oder ist zu kurz");
  return s;
}

function sig(payload: string, key: string): string {
  return createHmac("sha256", key).update(payload).digest("base64url");
}

export function signState(state: OAuthState, key = secret()): string {
  const payload = Buffer.from(JSON.stringify(state)).toString("base64url");
  return `${payload}.${sig(payload, key)}`;
}

/** null = ungültig (manipuliert, kaputt oder abgelaufen). */
export function verifyState(
  raw: string,
  now: number = Date.now(),
  key = secret()
): OAuthState | null {
  const [payload, signature] = raw.split(".");
  if (!payload || !signature) return null;
  if (sig(payload, key) !== signature) return null;
  try {
    const state = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as OAuthState;
    if (typeof state.ts !== "number" || now - state.ts > MAX_AGE_MS || state.ts > now + 60_000) {
      return null;
    }
    if (!state.workspaceId || !state.platform || !state.nonce) return null;
    return state;
  } catch {
    return null;
  }
}
