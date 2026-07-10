import { NextResponse } from "next/server";
import { requireCan } from "@/lib/auth";
import { db } from "@/lib/db";
import { encrypt } from "@/lib/crypto";
import { getProvider, isConfigured } from "@/lib/oauth/providers";
import { NONCE_COOKIE, verifyState } from "@/lib/oauth/state";
import { exchangeCode, resolveAccount, OAuthError } from "@/lib/oauth/connect";

// Rückweg des OAuth-Flows: Plattform schickt ?code=…&state=… hierher.
// Erst State + Nonce prüfen (CSRF), dann Code → Token → Konto auflösen und
// verschlüsselt speichern. Jeder Fehler landet als kurzer Code in
// /app/accounts?oauth_error=… — Details nur im Server-Log.

function requestOrigin(request: Request): string {
  const url = new URL(request.url);
  const proto = request.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? url.host;
  return `${proto}://${host}`;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ platform: string }> }
) {
  const { platform } = await params;
  const origin = requestOrigin(request);
  const accountsUrl = `${origin}/app/accounts`;
  const fail = (code: string) => {
    const res = NextResponse.redirect(`${accountsUrl}?oauth_error=${code}`);
    // Pfad muss zum Set-Aufruf der Start-Route passen, sonst greift das Löschen nicht
    res.cookies.delete({ name: NONCE_COOKIE, path: "/api/oauth" });
    return res;
  };

  const provider = getProvider(platform);
  if (!provider || !isConfigured(provider)) return fail("not_configured");

  const search = new URL(request.url).searchParams;
  // Nutzer:in hat auf dem Consent-Screen abgebrochen (oder die Plattform lehnt ab)
  if (search.get("error")) return fail("denied");

  const code = search.get("code");
  const rawState = search.get("state");
  if (!code || !rawState) return fail("invalid_state");

  const state = verifyState(rawState);
  if (!state || state.platform !== platform) return fail("invalid_state");

  const nonceCookie = request.headers
    .get("cookie")
    ?.match(new RegExp(`${NONCE_COOKIE}=([^;]+)`))?.[1];
  if (!nonceCookie || nonceCookie !== state.nonce) return fail("invalid_state");

  let workspaceId: string;
  try {
    workspaceId = (await requireCan("accounts")).workspace.id;
  } catch {
    return NextResponse.redirect(`${origin}/login`);
  }
  // State muss aus GENAU dieser Workspace-Sitzung stammen
  if (workspaceId !== state.workspaceId) return fail("invalid_state");

  try {
    const tokens = await exchangeCode(provider, code, `${origin}/api/oauth/${platform}/callback`);
    const account = await resolveAccount(provider, tokens);

    // Kunden-Zuordnung aus dem Start-Link — nur, wenn der Kunde wirklich zu uns gehört
    let clientId: string | null = null;
    if (state.clientId) {
      const client = await db.client.findFirst({
        where: { id: state.clientId, workspaceId },
        select: { id: true },
      });
      clientId = client?.id ?? null;
    }

    await db.socialAccount.create({
      data: {
        workspaceId,
        clientId,
        platform,
        displayName: account.displayName,
        handle: account.handle,
        externalId: account.externalId,
        accessTokenEnc: encrypt(account.accessToken),
        refreshTokenEnc: account.refreshToken ? encrypt(account.refreshToken) : null,
      },
    });

    const res = NextResponse.redirect(`${accountsUrl}?connected=${platform}`);
    res.cookies.delete({ name: NONCE_COOKIE, path: "/api/oauth" });
    return res;
  } catch (err) {
    if (err instanceof OAuthError) return fail(err.code);
    console.error(`[oauth] ${platform} Callback fehlgeschlagen:`, err);
    return fail("unexpected");
  }
}
