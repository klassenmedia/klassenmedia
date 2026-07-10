// OAuth-Konfiguration je Plattform. Alles Code-seitige ist fertig — sobald die
// jeweilige Developer-App angelegt und freigegeben ist (siehe
// ../../API_MOEGLICHKEITEN.md), genügen die Credentials in der .env und der
// echte Login unter Accounts → "Mit … verbinden" wird aktiv.
//
// Redirect-URI je Plattform (in der Developer-App eintragen):
//   https://<deine-domain>/api/oauth/<platform>/callback

import type { Platform } from "../types";

export type OAuthPlatform = "instagram" | "facebook" | "tiktok" | "linkedin" | "youtube" | "pinterest";

export interface OAuthProvider {
  platform: OAuthPlatform;
  label: string;
  authorizeUrl: string;
  tokenUrl: string;
  scopes: string[];
  scopeSeparator: string;
  clientIdEnv: string;
  clientSecretEnv: string;
  /** Name des Client-ID-Parameters (TikTok nennt ihn client_key) */
  clientIdParam: "client_id" | "client_key";
  /** Token-Tausch: Meta erwartet GET, Pinterest Basic-Auth, Rest POST-Form */
  tokenMethod: "GET" | "POST" | "POST_BASIC";
  /** Zusätzliche Query-Parameter für den Authorize-Aufruf */
  extraAuthParams?: Record<string, string>;
}

const META_SCOPES = [
  "pages_show_list",
  "pages_read_engagement",
  "pages_manage_posts",
  "instagram_basic",
  "instagram_content_publish",
];

export const OAUTH_PROVIDERS: Record<OAuthPlatform, OAuthProvider> = {
  instagram: {
    platform: "instagram",
    label: "Instagram (über Meta)",
    authorizeUrl: "https://www.facebook.com/v23.0/dialog/oauth",
    tokenUrl: "https://graph.facebook.com/v23.0/oauth/access_token",
    scopes: META_SCOPES,
    scopeSeparator: ",",
    clientIdEnv: "META_APP_ID",
    clientSecretEnv: "META_APP_SECRET",
    clientIdParam: "client_id",
    tokenMethod: "GET",
  },
  facebook: {
    platform: "facebook",
    label: "Facebook (Meta)",
    authorizeUrl: "https://www.facebook.com/v23.0/dialog/oauth",
    tokenUrl: "https://graph.facebook.com/v23.0/oauth/access_token",
    scopes: META_SCOPES,
    scopeSeparator: ",",
    clientIdEnv: "META_APP_ID",
    clientSecretEnv: "META_APP_SECRET",
    clientIdParam: "client_id",
    tokenMethod: "GET",
  },
  tiktok: {
    platform: "tiktok",
    label: "TikTok",
    authorizeUrl: "https://www.tiktok.com/v2/auth/authorize/",
    tokenUrl: "https://open.tiktokapis.com/v2/oauth/token/",
    scopes: ["user.info.basic", "video.publish"],
    scopeSeparator: ",",
    clientIdEnv: "TIKTOK_CLIENT_KEY",
    clientSecretEnv: "TIKTOK_CLIENT_SECRET",
    clientIdParam: "client_key",
    tokenMethod: "POST",
  },
  linkedin: {
    platform: "linkedin",
    label: "LinkedIn",
    authorizeUrl: "https://www.linkedin.com/oauth/v2/authorization",
    tokenUrl: "https://www.linkedin.com/oauth/v2/accessToken",
    scopes: ["openid", "profile", "w_member_social"],
    scopeSeparator: " ",
    clientIdEnv: "LINKEDIN_CLIENT_ID",
    clientSecretEnv: "LINKEDIN_CLIENT_SECRET",
    clientIdParam: "client_id",
    tokenMethod: "POST",
  },
  youtube: {
    platform: "youtube",
    label: "YouTube (Google)",
    authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    scopes: [
      "https://www.googleapis.com/auth/youtube.upload",
      "https://www.googleapis.com/auth/youtube.readonly",
    ],
    scopeSeparator: " ",
    clientIdEnv: "GOOGLE_CLIENT_ID",
    clientSecretEnv: "GOOGLE_CLIENT_SECRET",
    clientIdParam: "client_id",
    // refresh_token gibt es nur mit access_type=offline + prompt=consent
    tokenMethod: "POST",
    extraAuthParams: { access_type: "offline", prompt: "consent" },
  },
  pinterest: {
    platform: "pinterest",
    label: "Pinterest",
    authorizeUrl: "https://www.pinterest.com/oauth/",
    tokenUrl: "https://api.pinterest.com/v5/oauth/token",
    scopes: ["boards:read", "pins:read", "pins:write", "user_accounts:read"],
    scopeSeparator: ",",
    clientIdEnv: "PINTEREST_APP_ID",
    clientSecretEnv: "PINTEREST_APP_SECRET",
    clientIdParam: "client_id",
    tokenMethod: "POST_BASIC",
  },
};

export function getProvider(platform: string): OAuthProvider | null {
  return (OAUTH_PROVIDERS as Record<string, OAuthProvider>)[platform] ?? null;
}

/** Sind die App-Credentials dieser Plattform in der .env hinterlegt? */
export function isConfigured(provider: OAuthProvider): boolean {
  return Boolean(process.env[provider.clientIdEnv] && process.env[provider.clientSecretEnv]);
}

/** Für die UI: welche Plattformen haben einen echten OAuth-Login? */
export function oauthReadyMap(): Record<Platform, boolean> {
  const map: Record<Platform, boolean> = {
    instagram: false,
    facebook: false,
    tiktok: false,
    linkedin: false,
    youtube: false,
    x: false, // bewusst nicht angeboten (teures Pay-per-use-Modell, s. API_MOEGLICHKEITEN.md)
    pinterest: false,
    wordpress: false, // eigener Verbindungsweg über Anwendungskennwort
  };
  for (const provider of Object.values(OAUTH_PROVIDERS)) {
    map[provider.platform] = isConfigured(provider);
  }
  return map;
}
