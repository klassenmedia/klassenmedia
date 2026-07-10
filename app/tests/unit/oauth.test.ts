import { describe, expect, it } from "vitest";
import { signState, verifyState, type OAuthState } from "@/lib/oauth/state";
import { OAUTH_PROVIDERS, getProvider } from "@/lib/oauth/providers";
import { toPublicUrl } from "@/lib/publishing/public-url";

const KEY = "test-secret-mit-mindestens-32-zeichen-laenge";

function makeState(overrides: Partial<OAuthState> = {}): OAuthState {
  return {
    workspaceId: "ws_1",
    platform: "instagram",
    clientId: "client_1",
    nonce: "abc123",
    ts: 1_700_000_000_000,
    ...overrides,
  };
}

describe("OAuth-State (CSRF-Schutz)", () => {
  it("signiert und verifiziert einen State (Roundtrip)", () => {
    const state = makeState();
    const raw = signState(state, KEY);
    expect(verifyState(raw, state.ts + 1000, KEY)).toEqual(state);
  });

  it("erhält clientId=null im Roundtrip", () => {
    const state = makeState({ clientId: null });
    const raw = signState(state, KEY);
    expect(verifyState(raw, state.ts, KEY)?.clientId).toBeNull();
  });

  it("verwirft manipulierte Payloads", () => {
    const raw = signState(makeState(), KEY);
    const [payload, sig] = raw.split(".");
    const tampered = Buffer.from(
      JSON.stringify({ ...makeState(), workspaceId: "ws_fremd" })
    ).toString("base64url");
    expect(verifyState(`${tampered}.${sig}`, makeState().ts, KEY)).toBeNull();
    expect(verifyState(`${payload}.falsche-signatur`, makeState().ts, KEY)).toBeNull();
  });

  it("verwirft States mit falschem Schlüssel", () => {
    const raw = signState(makeState(), KEY);
    expect(verifyState(raw, makeState().ts, KEY + "-anders")).toBeNull();
  });

  it("verwirft abgelaufene States (> 10 Minuten)", () => {
    const state = makeState();
    const raw = signState(state, KEY);
    expect(verifyState(raw, state.ts + 9 * 60 * 1000, KEY)).not.toBeNull();
    expect(verifyState(raw, state.ts + 11 * 60 * 1000, KEY)).toBeNull();
  });

  it("verwirft States aus der Zukunft (mehr als Uhren-Toleranz)", () => {
    const state = makeState();
    const raw = signState(state, KEY);
    expect(verifyState(raw, state.ts - 2 * 60 * 1000, KEY)).toBeNull();
  });

  it("verwirft kaputte Eingaben", () => {
    expect(verifyState("", Date.now(), KEY)).toBeNull();
    expect(verifyState("nur-ein-teil", Date.now(), KEY)).toBeNull();
    expect(verifyState("a.b.c", Date.now(), KEY)).toBeNull();
  });
});

describe("OAuth-Provider-Konfiguration", () => {
  it("kennt alle 6 OAuth-Plattformen", () => {
    expect(Object.keys(OAUTH_PROVIDERS).sort()).toEqual(
      ["facebook", "instagram", "linkedin", "pinterest", "tiktok", "youtube"].sort()
    );
  });

  it("liefert null für unbekannte Plattformen", () => {
    expect(getProvider("myspace")).toBeNull();
    expect(getProvider("x")).toBeNull(); // bewusst nicht angeboten
    expect(getProvider("wordpress")).toBeNull(); // eigener Weg (Anwendungskennwort)
  });

  it("jeder Provider hat vollständige HTTPS-Endpunkte und Scopes", () => {
    for (const p of Object.values(OAUTH_PROVIDERS)) {
      expect(p.authorizeUrl).toMatch(/^https:\/\//);
      expect(p.tokenUrl).toMatch(/^https:\/\//);
      expect(p.scopes.length).toBeGreaterThan(0);
      expect(p.clientIdEnv).toBeTruthy();
      expect(p.clientSecretEnv).toBeTruthy();
    }
  });

  it("Instagram + Facebook teilen sich die Meta-App", () => {
    expect(OAUTH_PROVIDERS.instagram.clientIdEnv).toBe("META_APP_ID");
    expect(OAUTH_PROVIDERS.facebook.clientIdEnv).toBe("META_APP_ID");
    // Meta erwartet den Token-Tausch als GET
    expect(OAUTH_PROVIDERS.instagram.tokenMethod).toBe("GET");
  });

  it("Instagram-Scopes enthalten das Publishing-Recht", () => {
    expect(OAUTH_PROVIDERS.instagram.scopes).toContain("instagram_content_publish");
  });

  it("TikTok nutzt client_key statt client_id", () => {
    expect(OAUTH_PROVIDERS.tiktok.clientIdParam).toBe("client_key");
  });

  it("YouTube fordert offline-Zugriff an (Refresh-Token)", () => {
    expect(OAUTH_PROVIDERS.youtube.extraAuthParams).toMatchObject({
      access_type: "offline",
      prompt: "consent",
    });
  });
});

describe("toPublicUrl (Medien fürs Live-Posten)", () => {
  const BASE = "https://planbar.example.de";

  it("lässt absolute URLs unverändert", () => {
    expect(toPublicUrl("https://cdn.example.de/bild.jpg", BASE)).toBe(
      "https://cdn.example.de/bild.jpg"
    );
  });

  it("präfixt lokale Upload-Pfade mit der App-Domain", () => {
    expect(toPublicUrl("/uploads/abc.jpg", BASE)).toBe(`${BASE}/uploads/abc.jpg`);
    expect(toPublicUrl("/uploads/abc.jpg", `${BASE}/`)).toBe(`${BASE}/uploads/abc.jpg`);
  });

  it("überspringt Demo-Platzhalter (null)", () => {
    expect(toPublicUrl("placeholder:200", BASE)).toBeNull();
  });

  it("wirft ohne PUBLIC_APP_URL bei lokalen Pfaden", () => {
    expect(() => toPublicUrl("/uploads/abc.jpg", undefined)).toThrow(/PUBLIC_APP_URL/);
  });
});
