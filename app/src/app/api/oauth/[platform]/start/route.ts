import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { requireCan } from "@/lib/auth";
import { getProvider, isConfigured } from "@/lib/oauth/providers";
import { NONCE_COOKIE, signState } from "@/lib/oauth/state";

// Startet den OAuth-Flow: Nutzer:in wird zum Consent-Screen der Plattform
// geschickt. Der signierte State + Nonce-Cookie verhindern CSRF — der Callback
// akzeptiert nur, was hier losgeschickt wurde.

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

  const provider = getProvider(platform);
  if (!provider) {
    return NextResponse.redirect(`${origin}/app/accounts?oauth_error=unknown_platform`);
  }

  let workspaceId: string;
  try {
    workspaceId = (await requireCan("accounts")).workspace.id;
  } catch {
    return NextResponse.redirect(`${origin}/login`);
  }

  if (!isConfigured(provider)) {
    return NextResponse.redirect(`${origin}/app/accounts?oauth_error=not_configured`);
  }

  const clientId = new URL(request.url).searchParams.get("clientId") || null;
  const nonce = randomBytes(16).toString("hex");
  const state = signState({ workspaceId, platform, clientId, nonce, ts: Date.now() });

  const authorize = new URL(provider.authorizeUrl);
  authorize.searchParams.set(provider.clientIdParam, process.env[provider.clientIdEnv]!);
  authorize.searchParams.set("redirect_uri", `${origin}/api/oauth/${platform}/callback`);
  authorize.searchParams.set("response_type", "code");
  authorize.searchParams.set("scope", provider.scopes.join(provider.scopeSeparator));
  authorize.searchParams.set("state", state);
  for (const [key, value] of Object.entries(provider.extraAuthParams ?? {})) {
    authorize.searchParams.set(key, value);
  }

  const res = NextResponse.redirect(authorize);
  res.cookies.set(NONCE_COOKIE, nonce, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/api/oauth",
    maxAge: 600, // wie die State-Gültigkeit: 10 Minuten
  });
  return res;
}
