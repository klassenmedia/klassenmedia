import "server-only";

// Callback-Logik des OAuth-Flows: Code gegen Token tauschen und daraus das
// konkrete Konto (IG-Business-Account, FB-Page, Channel, …) auflösen.
// Läuft erst, wenn echte App-Credentials in der .env stehen — bis dahin ist
// der Code "review-ready" und wartet nur auf die Plattform-Freigaben.

import type { OAuthProvider } from "./providers";

export class OAuthError extends Error {
  /** Kurzer Code für die Fehleranzeige unter /app/accounts?oauth_error=… */
  constructor(public code: string, message: string) {
    super(message);
  }
}

interface TokenSet {
  accessToken: string;
  refreshToken: string | null;
}

export interface ResolvedAccount {
  externalId: string;
  displayName: string;
  handle: string;
  accessToken: string;
  refreshToken: string | null;
}

async function readJson(res: Response, context: string): Promise<Record<string, unknown>> {
  const json = (await res.json().catch(() => null)) as Record<string, unknown> | null;
  if (!res.ok || !json) {
    // Fehlerdetails nur ins Server-Log — nie Richtung Browser (können IDs/Hints enthalten)
    console.error(`[oauth] ${context} fehlgeschlagen (${res.status}):`, json);
    throw new OAuthError("exchange_failed", `${context} fehlgeschlagen`);
  }
  return json;
}

/** Authorization Code gegen Access/Refresh Token tauschen. */
export async function exchangeCode(
  provider: OAuthProvider,
  code: string,
  redirectUri: string
): Promise<TokenSet> {
  const clientId = process.env[provider.clientIdEnv]!;
  const clientSecret = process.env[provider.clientSecretEnv]!;

  let res: Response;
  if (provider.tokenMethod === "GET") {
    const url = new URL(provider.tokenUrl);
    url.searchParams.set(provider.clientIdParam, clientId);
    url.searchParams.set("client_secret", clientSecret);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("code", code);
    res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
  } else {
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    });
    const headers: Record<string, string> = {
      "Content-Type": "application/x-www-form-urlencoded",
    };
    if (provider.tokenMethod === "POST_BASIC") {
      headers.Authorization = `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`;
    } else {
      body.set(provider.clientIdParam, clientId);
      body.set("client_secret", clientSecret);
    }
    res = await fetch(provider.tokenUrl, {
      method: "POST",
      headers,
      body,
      signal: AbortSignal.timeout(15_000),
    });
  }

  const json = await readJson(res, "Token-Tausch");
  // TikTok packt die Nutzdaten in ein data-Objekt
  const data = (json.data as Record<string, unknown> | undefined) ?? json;
  const accessToken = data.access_token as string | undefined;
  if (!accessToken) throw new OAuthError("exchange_failed", "Kein Access Token erhalten");
  return { accessToken, refreshToken: (data.refresh_token as string | undefined) ?? null };
}

const GRAPH = "https://graph.facebook.com/v23.0";

/** Meta: kurzlebiges Nutzer-Token gegen langlebiges tauschen (~60 Tage). */
async function metaLongLivedToken(shortToken: string): Promise<string> {
  const url = new URL(`${GRAPH}/oauth/access_token`);
  url.searchParams.set("grant_type", "fb_exchange_token");
  url.searchParams.set("client_id", process.env.META_APP_ID!);
  url.searchParams.set("client_secret", process.env.META_APP_SECRET!);
  url.searchParams.set("fb_exchange_token", shortToken);
  const json = await readJson(await fetch(url, { signal: AbortSignal.timeout(15_000) }), "Meta Long-lived Token");
  return json.access_token as string;
}

interface MetaPage {
  id: string;
  name: string;
  access_token: string;
  instagram_business_account?: { id: string; username?: string };
}

async function metaPages(userToken: string): Promise<MetaPage[]> {
  const url = new URL(`${GRAPH}/me/accounts`);
  url.searchParams.set("fields", "id,name,access_token,instagram_business_account{id,username}");
  url.searchParams.set("access_token", userToken);
  const json = await readJson(await fetch(url, { signal: AbortSignal.timeout(15_000) }), "Meta Seitenliste");
  return (json.data as MetaPage[] | undefined) ?? [];
}

/**
 * Aus dem Token das konkrete Konto machen. Meta: erste Seite (bzw. erste Seite
 * mit IG-Business-Account). Für Nutzer mit vielen Seiten folgt später ein
 * Auswahl-Schritt — fürs Review und den Start reicht die häufigste Konstellation.
 */
export async function resolveAccount(
  provider: OAuthProvider,
  tokens: TokenSet
): Promise<ResolvedAccount> {
  switch (provider.platform) {
    case "instagram": {
      const longLived = await metaLongLivedToken(tokens.accessToken);
      const pages = await metaPages(longLived);
      const page = pages.find((p) => p.instagram_business_account);
      if (!page || !page.instagram_business_account) {
        throw new OAuthError(
          "ig_no_business_account",
          "Keine Facebook-Seite mit verknüpftem Instagram-Business-Account gefunden"
        );
      }
      const ig = page.instagram_business_account;
      return {
        externalId: ig.id,
        displayName: page.name,
        handle: ig.username ? `@${ig.username}` : page.name,
        accessToken: page.access_token, // Page-Token — läuft mit Long-lived-User-Token nicht ab
        refreshToken: null,
      };
    }
    case "facebook": {
      const longLived = await metaLongLivedToken(tokens.accessToken);
      const pages = await metaPages(longLived);
      const page = pages[0];
      if (!page) throw new OAuthError("fb_no_pages", "Keine Facebook-Seite mit Zugriff gefunden");
      return {
        externalId: page.id,
        displayName: page.name,
        handle: page.name,
        accessToken: page.access_token,
        refreshToken: null,
      };
    }
    case "linkedin": {
      const json = await readJson(
        await fetch("https://api.linkedin.com/v2/userinfo", {
          headers: { Authorization: `Bearer ${tokens.accessToken}` },
          signal: AbortSignal.timeout(15_000),
        }),
        "LinkedIn Profil"
      );
      const name = (json.name as string | undefined) ?? "LinkedIn-Profil";
      return {
        externalId: (json.sub as string | undefined) ?? "",
        displayName: name,
        handle: name,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };
    }
    case "youtube": {
      const json = await readJson(
        await fetch("https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true", {
          headers: { Authorization: `Bearer ${tokens.accessToken}` },
          signal: AbortSignal.timeout(15_000),
        }),
        "YouTube Kanalliste"
      );
      const items = (json.items as { id: string; snippet?: { title?: string } }[] | undefined) ?? [];
      const channel = items[0];
      if (!channel) throw new OAuthError("yt_no_channel", "Kein YouTube-Kanal gefunden");
      return {
        externalId: channel.id,
        displayName: channel.snippet?.title ?? "YouTube-Kanal",
        handle: channel.snippet?.title ?? channel.id,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };
    }
    case "tiktok": {
      const json = await readJson(
        await fetch("https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name", {
          headers: { Authorization: `Bearer ${tokens.accessToken}` },
          signal: AbortSignal.timeout(15_000),
        }),
        "TikTok Profil"
      );
      const data = (json.data as { user?: { open_id?: string; display_name?: string } } | undefined)?.user;
      return {
        externalId: data?.open_id ?? "",
        displayName: data?.display_name ?? "TikTok-Profil",
        handle: data?.display_name ? `@${data.display_name}` : "TikTok",
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };
    }
    case "pinterest": {
      const json = await readJson(
        await fetch("https://api.pinterest.com/v5/user_account", {
          headers: { Authorization: `Bearer ${tokens.accessToken}` },
          signal: AbortSignal.timeout(15_000),
        }),
        "Pinterest Profil"
      );
      const username = (json.username as string | undefined) ?? "pinterest";
      return {
        externalId: (json.id as string | undefined) ?? username,
        displayName: username,
        handle: `@${username}`,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };
    }
  }
}
