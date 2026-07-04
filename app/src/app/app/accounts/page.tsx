"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { Button, inputCls, Modal, PlatformChip } from "@/components/ui";
import { Platform, PLATFORMS } from "@/lib/types";

export default function AccountsPage() {
  const { accounts, addAccount, removeAccount, posts } = useStore();
  const [adding, setAdding] = useState(false);
  const [platform, setPlatform] = useState<Platform>("instagram");
  const [displayName, setDisplayName] = useState("");
  const [handle, setHandle] = useState("");

  function submit() {
    if (!displayName.trim() || !handle.trim()) return;
    addAccount({ platform, displayName: displayName.trim(), handle: handle.trim() });
    setAdding(false);
    setDisplayName("");
    setHandle("");
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Accounts</h1>
          <p className="mt-1 text-sm text-muted">
            Verbinde beliebig viele Profile — <span className="text-accent">ohne Limit</span>, in jedem Tarif.
          </p>
        </div>
        <Button onClick={() => setAdding(true)}>+ Account verbinden</Button>
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
              <div className="mt-2 flex items-center gap-1.5 text-xs text-success">
                <span className="h-1.5 w-1.5 rounded-full bg-success" />
                Verbunden
              </div>
            </div>
          );
        })}

        <button
          onClick={() => setAdding(true)}
          className="flex min-h-44 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-line text-muted transition hover:border-accent hover:text-accent"
        >
          <span className="text-2xl">+</span>
          <span className="text-sm font-medium">Account verbinden</span>
        </button>
      </div>

      <div className="mt-8 rounded-2xl border border-line bg-surface p-5 text-sm text-muted">
        <strong className="text-foreground">Hinweis (Prototyp):</strong> Im fertigen Produkt
        läuft die Verbindung über die offiziellen OAuth-Flows der Plattformen (Meta, TikTok,
        LinkedIn, …). Die Zugangs-Tokens werden verschlüsselt gespeichert — Details in
        KONZEPT.md, Abschnitt 6.2.
      </div>

      {adding && (
        <Modal title="Account verbinden" onClose={() => setAdding(false)}>
          <div className="flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Plattform</label>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(PLATFORMS) as Platform[]).map((p) => (
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
            <p className="text-xs text-muted">
              Demo-Modus: Der echte OAuth-Login der Plattform öffnet sich hier später.
            </p>
            <div className="flex justify-end gap-3 border-t border-line pt-4">
              <Button variant="ghost" onClick={() => setAdding(false)}>
                Abbrechen
              </Button>
              <Button onClick={submit} disabled={!displayName.trim() || !handle.trim()}>
                Verbinden
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
