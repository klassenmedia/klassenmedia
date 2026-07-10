"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { Button, inputCls, Modal, PlatformChip } from "@/components/ui";
import { Platform, PLATFORMS } from "@/lib/types";

type ConnectMode = "choose" | "self" | "invite" | "invite-done" | "wordpress";

export default function AccountsPage() {
  const {
    accounts: allAccounts,
    posts,
    invites: allInvites,
    clients,
    selectedClientId,
    addAccount,
    connectWordPress,
    removeAccount,
    assignAccount,
    createInvite,
    revokeInvite,
    acceptInvite,
  } = useStore();

  // An den aktiven Kunden-Kontext gebunden
  const accounts = selectedClientId
    ? allAccounts.filter((a) => a.clientId === selectedClientId)
    : allAccounts;
  const invites = selectedClientId
    ? allInvites.filter((i) => i.status === "pending" && i.clientId === selectedClientId)
    : allInvites;
  const activeClient = clients.find((c) => c.id === selectedClientId) ?? null;

  const [mode, setMode] = useState<ConnectMode | null>(null);
  const [platform, setPlatform] = useState<Platform>("instagram");
  const [displayName, setDisplayName] = useState("");
  const [handle, setHandle] = useState("");
  const [clientName, setClientName] = useState("");
  const [dialogClientId, setDialogClientId] = useState<string>("");
  const [copied, setCopied] = useState<string | null>(null);
  const [wpDisplayName, setWpDisplayName] = useState("");
  const [wpSiteUrl, setWpSiteUrl] = useState("");
  const [wpUsername, setWpUsername] = useState("");
  const [wpAppPassword, setWpAppPassword] = useState("");
  const [wpConnecting, setWpConnecting] = useState(false);

  const clientPicker =
    clients.length > 0 ? (
      <div>
        <label className="mb-1.5 block text-sm font-medium">Kunde (optional)</label>
        <select
          value={dialogClientId}
          onChange={(e) => setDialogClientId(e.target.value)}
          className={inputCls}
        >
          <option value="">— Kein Kunde —</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
    ) : null;

  const pending = invites.filter((i) => i.status === "pending");

  function openDialog() {
    setPlatform("instagram");
    setDisplayName("");
    setHandle("");
    setClientName(activeClient?.name ?? "");
    setDialogClientId(selectedClientId ?? "");
    setWpDisplayName(activeClient?.name ? `Blog ${activeClient.name}` : "");
    setWpSiteUrl("");
    setWpUsername("");
    setWpAppPassword("");
    setMode("choose");
  }

  async function submitSelf() {
    if (!displayName.trim() || !handle.trim()) return;
    await addAccount({
      platform,
      displayName: displayName.trim(),
      handle: handle.trim(),
      clientId: dialogClientId || null,
    });
    setMode(null);
  }

  async function submitWordPress() {
    if (!wpDisplayName.trim() || !wpSiteUrl.trim() || !wpUsername.trim() || !wpAppPassword.trim()) return;
    setWpConnecting(true);
    const success = await connectWordPress({
      displayName: wpDisplayName.trim(),
      siteUrl: wpSiteUrl.trim(),
      username: wpUsername.trim(),
      appPassword: wpAppPassword.trim(),
      clientId: dialogClientId || null,
    });
    setWpConnecting(false);
    if (success) setMode(null);
  }

  async function submitInvite() {
    if (!clientName.trim()) return;
    await createInvite(platform, clientName.trim(), dialogClientId || null);
    setMode("invite-done");
  }

  function copyLink(token: string) {
    const link = `${window.location.origin}/connect/${token}`;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(link).catch(() => {});
    }
    setCopied(token);
    setTimeout(() => setCopied(null), 2000);
  }

  const platformPicker = (
    <div>
      <label className="mb-1.5 block text-sm font-medium">Plattform</label>
      <div className="flex flex-wrap gap-2">
        {(Object.keys(PLATFORMS) as Platform[])
          .filter((p) => p !== "wordpress")
          .map((p) => (
          <button
            key={p}
            onClick={() => setPlatform(p)}
            className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 text-sm transition ${
              platform === p
                ? "border-accent bg-accent-soft"
                : "border-line text-muted hover:border-accent/40"
            }`}
          >
            <PlatformChip platform={p} size={18} />
            {PLATFORMS[p].label}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Accounts</h1>
          <p className="mt-1 text-sm text-muted">
            {activeClient ? (
              <>
                Accounts von <span className="font-medium text-foreground">{activeClient.name}</span> —{" "}
                <span className="text-accent-fg">ohne Limit</span>.
              </>
            ) : (
              <>
                Verbinde beliebig viele Profile — <span className="text-accent-fg">ohne Limit</span>, alles inklusive.
              </>
            )}
          </p>
        </div>
        <Button onClick={openDialog}>+ Account verbinden</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {accounts.map((acc) => {
          const postCount = posts.filter((p) => p.accountIds.includes(acc.id)).length;
          return (
            <div
              key={acc.id}
              className="group rounded-2xl border border-line bg-surface p-5 transition hover:border-accent/40"
            >
              <div className="flex items-start justify-between">
                <PlatformChip platform={acc.platform} size={36} />
                <button
                  onClick={() => removeAccount(acc.id)}
                  className="rounded-lg px-2 py-1 text-xs text-muted opacity-0 transition group-hover:opacity-100 hover:bg-danger/15 hover:text-danger"
                >
                  Trennen
                </button>
              </div>
              <div className="mt-3 font-semibold">{acc.displayName}</div>
              <div className="text-sm text-muted">{acc.handle}</div>
              <div className="mt-3 flex items-center justify-between text-xs text-muted">
                <span>{PLATFORMS[acc.platform].label}</span>
                <span>{postCount} Posts</span>
              </div>
              {clients.length > 0 && (
                <div className="mt-3">
                  <select
                    value={acc.clientId ?? ""}
                    onChange={(e) => assignAccount(acc.id, e.target.value || null)}
                    aria-label="Kunde zuordnen"
                    className="w-full rounded-lg border border-line bg-surface-2 px-2 py-1.5 text-xs"
                  >
                    <option value="">— Kein Kunde —</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="mt-2 flex items-center gap-1.5 text-xs text-success">
                <span className="h-1.5 w-1.5 rounded-full bg-success" />
                Verbunden
              </div>
            </div>
          );
        })}

        <button
          onClick={openDialog}
          className="flex min-h-44 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-line text-muted transition hover:border-accent hover:text-accent-fg"
        >
          <span className="text-2xl">+</span>
          <span className="text-sm font-medium">Account verbinden</span>
        </button>
      </div>

      {pending.length > 0 && (
        <>
          <h2 className="mt-10 mb-3 text-sm font-semibold uppercase tracking-wider text-muted">
            Ausstehende Verbindungslinks
          </h2>
          <div className="overflow-hidden rounded-2xl border border-line bg-surface">
            {pending.map((inv, i) => (
              <div
                key={inv.id}
                className={`flex flex-wrap items-center gap-3 p-4 ${i > 0 ? "border-t border-line" : ""}`}
              >
                <PlatformChip platform={inv.platform} size={28} />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">{inv.clientName}</div>
                  <div className="truncate font-mono text-xs text-muted">
                    /connect/{inv.token} · erstellt {inv.createdAt}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Button variant="ghost" className="!px-3 !py-1.5 text-xs" onClick={() => copyLink(inv.token)}>
                    {copied === inv.token ? "✓ Kopiert" : "Link kopieren"}
                  </Button>
                  <Button variant="ghost" className="!px-3 !py-1.5 text-xs" onClick={() => acceptInvite(inv.id)}>
                    Demo: Kunde bestätigt
                  </Button>
                  <button
                    onClick={() => revokeInvite(inv.id)}
                    aria-label="Einladung zurückziehen"
                    className="rounded-lg px-2 py-1 text-sm text-muted transition hover:bg-danger/15 hover:text-danger"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="mt-8 rounded-2xl border border-line bg-surface p-5 text-sm text-muted">
        <strong className="text-foreground">Hinweis (Prototyp):</strong> Im fertigen Produkt läuft
        „Selbst einloggen“ über die offiziellen OAuth-Flows der Plattformen; der Verbindungslink
        führt den Kunden auf eine Freigabe-Seite mit demselben OAuth-Login — Passwörter werden nie
        geteilt. Details in KONZEPT.md, Abschnitt 3.1 und 6.2.
      </div>

      {mode === "choose" && (
        <Modal title="Account verbinden" onClose={() => setMode(null)} wide>
          <div className="grid gap-4 md:grid-cols-3">
            <button
              onClick={() => setMode("self")}
              className="rounded-2xl border border-line bg-surface-2 p-5 text-left transition hover:border-accent"
            >
              <div className="text-2xl">🔑</div>
              <h3 className="mt-3 font-semibold">Selbst einloggen</h3>
              <p className="mt-1.5 text-sm text-muted">
                Du hast Zugriff auf das Profil (eigenes Konto oder Partner-Zugriff, z. B. via Meta
                Business Manager)? Dann melde dich direkt an.
              </p>
            </button>
            <button
              onClick={() => setMode("invite")}
              className="rounded-2xl border border-line bg-surface-2 p-5 text-left transition hover:border-accent"
            >
              <div className="text-2xl">🔗</div>
              <h3 className="mt-3 font-semibold">Link an Kunden senden</h3>
              <p className="mt-1.5 text-sm text-muted">
                Dein Kunde gibt den Account selbst frei — er öffnet den Link, loggt sich bei der
                Plattform ein, fertig. Kein Passwort-Austausch.
              </p>
            </button>
            <button
              onClick={() => setMode("wordpress")}
              className="rounded-2xl border border-line bg-surface-2 p-5 text-left transition hover:border-accent"
            >
              <div className="text-2xl">🌐</div>
              <h3 className="mt-3 font-semibold">Website verbinden</h3>
              <p className="mt-1.5 text-sm text-muted">
                WordPress per Anwendungskennwort — kein Review nötig, sofort live. Ideal für
                Blogartikel auf der Kunden-Website.
              </p>
            </button>
          </div>
        </Modal>
      )}

      {mode === "self" && (
        <Modal title="Selbst einloggen" onClose={() => setMode(null)}>
          <div className="flex flex-col gap-4">
            {platformPicker}
            <div>
              <label className="mb-1.5 block text-sm font-medium">Anzeigename</label>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="z. B. Klassen Media"
                className={inputCls}
                autoFocus
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Handle / Profilname</label>
              <input
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                placeholder="z. B. @klassenmedia"
                className={inputCls}
              />
            </div>
            {clientPicker}
            <p className="text-xs text-muted">
              Demo-Modus: Hier öffnet sich später der echte OAuth-Login der Plattform, danach
              wählst du aus deinen verwalteten Seiten/Profilen aus.
            </p>
            <div className="flex justify-end gap-3 border-t border-line pt-4">
              <Button variant="ghost" onClick={() => setMode("choose")}>
                Zurück
              </Button>
              <Button onClick={submitSelf} disabled={!displayName.trim() || !handle.trim()}>
                Verbinden
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {mode === "invite" && (
        <Modal title="Link an Kunden senden" onClose={() => setMode(null)}>
          <div className="flex flex-col gap-4">
            {platformPicker}
            <div>
              <label className="mb-1.5 block text-sm font-medium">Name des Kunden</label>
              <input
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="z. B. Bäckerei Berger"
                className={inputCls}
                autoFocus
              />
            </div>
            {clientPicker}
            <p className="text-xs text-muted">
              Der Link ist 7 Tage gültig und kann nur einmal verwendet werden. Dein Kunde loggt
              sich damit beim offiziellen Login der Plattform ein und bestätigt den Zugriff.
            </p>
            <div className="flex justify-end gap-3 border-t border-line pt-4">
              <Button variant="ghost" onClick={() => setMode("choose")}>
                Zurück
              </Button>
              <Button onClick={submitInvite} disabled={!clientName.trim()}>
                Link erstellen
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {mode === "wordpress" && (
        <Modal title="Website verbinden" onClose={() => setMode(null)}>
          <div className="flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Anzeigename</label>
              <input
                value={wpDisplayName}
                onChange={(e) => setWpDisplayName(e.target.value)}
                placeholder="z. B. Blog Bäckerei Berger"
                className={inputCls}
                autoFocus
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Website-URL</label>
              <input
                value={wpSiteUrl}
                onChange={(e) => setWpSiteUrl(e.target.value)}
                placeholder="https://kunde-website.de"
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">WordPress-Benutzername</label>
              <input
                value={wpUsername}
                onChange={(e) => setWpUsername(e.target.value)}
                placeholder="z. B. redaktion"
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Anwendungskennwort</label>
              <input
                value={wpAppPassword}
                onChange={(e) => setWpAppPassword(e.target.value)}
                type="password"
                placeholder="xxxx xxxx xxxx xxxx xxxx xxxx"
                className={inputCls}
              />
              <p className="mt-1.5 text-xs text-muted">
                Im WordPress-Adminbereich unter Benutzer → Profil → „Anwendungspasswörter“ erzeugen
                — kein normales Login-Passwort, jederzeit widerrufbar.
              </p>
            </div>
            {clientPicker}
            <p className="text-xs text-muted">
              Wir prüfen die Zugangsdaten direkt mit einem Testaufruf, bevor sie verschlüsselt
              gespeichert werden.
            </p>
            <div className="flex justify-end gap-3 border-t border-line pt-4">
              <Button variant="ghost" onClick={() => setMode("choose")}>
                Zurück
              </Button>
              <Button
                onClick={submitWordPress}
                disabled={
                  wpConnecting ||
                  !wpDisplayName.trim() ||
                  !wpSiteUrl.trim() ||
                  !wpUsername.trim() ||
                  !wpAppPassword.trim()
                }
              >
                {wpConnecting ? "Prüft Verbindung …" : "Verbinden"}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {mode === "invite-done" && (
        <Modal title="Verbindungslink erstellt ✓" onClose={() => setMode(null)}>
          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted">
              Schick diesen Link an <strong className="text-foreground">{invites[0]?.clientName}</strong> —
              per E-Mail, WhatsApp oder wie ihr sonst kommuniziert:
            </p>
            <div className="flex items-center gap-2 rounded-xl border border-line bg-surface-2 px-3 py-2.5">
              <span className="min-w-0 flex-1 truncate font-mono text-sm">
                /connect/{invites[0]?.token}
              </span>
              <Button
                variant="ghost"
                className="!px-3 !py-1.5 shrink-0 text-xs"
                onClick={() => invites[0] && copyLink(invites[0].token)}
              >
                {copied === invites[0]?.token ? "✓ Kopiert" : "Kopieren"}
              </Button>
            </div>
            <p className="text-xs text-muted">
              Du findest den Link jederzeit unter „Ausstehende Verbindungslinks“ — dort kannst du
              ihn auch zurückziehen. Sobald dein Kunde bestätigt hat, erscheint der Account
              automatisch in der Liste.
            </p>
            <div className="flex justify-end border-t border-line pt-4">
              <Button onClick={() => setMode(null)}>Fertig</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
