"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { Button, inputCls } from "@/components/ui";

export function IntegrationsClient({ mcpUrl, isLocal }: { mcpUrl: string; isLocal: boolean }) {
  const { apiTokens, can, createApiToken, revokeApiToken } = useStore();
  const manage = can("accounts");

  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [freshToken, setFreshToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function create() {
    if (!name.trim()) return;
    setCreating(true);
    const raw = await createApiToken(name.trim());
    setCreating(false);
    if (raw) {
      setFreshToken(raw);
      setName("");
      setCopied(false);
    }
  }

  function copy(text: string) {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const configSnippet = freshToken
    ? JSON.stringify(
        {
          mcpServers: {
            planbar: {
              command: "npx",
              args: ["-y", "mcp-remote", mcpUrl, "--header", `Authorization: Bearer ${freshToken}`],
            },
          },
        },
        null,
        2
      )
    : null;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Integrationen</h1>
        <p className="mt-1 text-sm text-muted">
          Verbinde Claude direkt mit diesem Workspace (MCP) — Kunden &amp; Accounts ansehen,
          Entwürfe und geplante Beiträge anlegen, ohne die App zu öffnen.
        </p>
      </div>

      <div className="rounded-2xl border border-line bg-surface p-6">
        <h2 className="font-semibold">Remote-MCP-Server</h2>
        <p className="mt-1.5 text-sm text-muted">
          Endpunkt: <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-xs">{mcpUrl}</code>
        </p>
        {isLocal && (
          <p className="mt-2 rounded-xl border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-warning">
            Läuft gerade lokal — dieser Endpunkt ist nur auf diesem Rechner erreichbar. Für Claude
            Desktop auf demselben Rechner reicht das zum Testen; damit ein Kunde oder ein anderes
            Gerät zugreifen kann, muss die App deployed sein (siehe DEPLOY.md).
          </p>
        )}

        {manage && (
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !creating && create()}
              placeholder="Name, z. B. „Claude Desktop“"
              className={`${inputCls} min-w-56 flex-1`}
            />
            <Button onClick={create} disabled={!name.trim() || creating} className="shrink-0">
              {creating ? "Erstellt …" : "+ Token erstellen"}
            </Button>
          </div>
        )}

        {freshToken && (
          <div className="mt-4 rounded-xl border border-accent/40 bg-accent-soft p-4">
            <p className="text-sm font-medium text-accent-fg">
              Token erstellt — wird aus Sicherheitsgründen nur jetzt einmal angezeigt.
            </p>
            <div className="mt-2 flex items-center gap-2">
              <code className="min-w-0 flex-1 truncate rounded-lg bg-surface px-2.5 py-1.5 font-mono text-xs">
                {freshToken}
              </code>
              <Button variant="ghost" className="!px-3 !py-1.5 shrink-0 text-xs" onClick={() => copy(freshToken)}>
                {copied ? "✓ Kopiert" : "Kopieren"}
              </Button>
            </div>
            {configSnippet && (
              <>
                <p className="mt-3 text-xs text-muted">
                  Konfiguration für Claude Desktop/Code (in{" "}
                  <code className="rounded bg-surface px-1 py-0.5">claude_desktop_config.json</code>{" "}
                  bzw. per <code className="rounded bg-surface px-1 py-0.5">claude mcp add</code>):
                </p>
                <pre className="mt-1.5 overflow-x-auto rounded-lg bg-surface p-3 text-xs">{configSnippet}</pre>
              </>
            )}
            <Button variant="ghost" className="mt-3 !px-3 !py-1.5 text-xs" onClick={() => setFreshToken(null)}>
              Fertig
            </Button>
          </div>
        )}
      </div>

      <div className="mt-6 rounded-2xl border border-line bg-surface p-6">
        <h2 className="font-semibold">Aktive Tokens ({apiTokens.length})</h2>
        {apiTokens.length === 0 ? (
          <p className="mt-2 text-sm text-muted">
            Noch keine Tokens — erstelle oben eines, um Claude anzubinden.
          </p>
        ) : (
          <div className="mt-3 overflow-hidden rounded-xl border border-line">
            {apiTokens.map((t, i) => (
              <div
                key={t.id}
                className={`flex flex-wrap items-center gap-3 p-3.5 ${i > 0 ? "border-t border-line" : ""}`}
              >
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">{t.name}</div>
                  <div className="text-xs text-muted">
                    Erstellt von {t.createdBy} am {t.createdAt}
                    {t.lastUsedAt ? ` · zuletzt genutzt ${t.lastUsedAt}` : " · noch nie genutzt"}
                  </div>
                </div>
                {manage && (
                  <button
                    onClick={() => {
                      if (confirm(`Token „${t.name}“ widerrufen? Claude kann sich damit nicht mehr verbinden.`))
                        revokeApiToken(t.id);
                    }}
                    className="shrink-0 rounded-lg px-2.5 py-1 text-xs text-muted transition hover:bg-danger/15 hover:text-danger"
                  >
                    Widerrufen
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 rounded-2xl border border-line bg-surface p-6 text-sm text-muted">
        <strong className="text-foreground">Was Claude damit tun kann:</strong> Kunden auflisten,
        verbundene Accounts sehen, geplante Beiträge einsehen (Doppelungen vermeiden) und neue
        Entwürfe oder geplante Beiträge anlegen. Medien-Upload, Veröffentlichen und alles andere
        läuft weiterhin nur über die App. Ein Token gilt für den ganzen Workspace — widerrufe es,
        sobald du es nicht mehr brauchst.
      </div>
    </div>
  );
}
