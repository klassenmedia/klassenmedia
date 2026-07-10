"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { Button, inputCls, PlatformChip } from "@/components/ui";
import { ACTIVITY_LABELS, FORMATS } from "@/lib/types";

export default function ApprovalsPage() {
  const {
    posts,
    accounts,
    reviewLinks,
    activity,
    approvePost,
    requestChanges,
    createReviewLink,
    revokeReviewLink,
  } = useStore();

  const pending = posts.filter((p) => p.approval === "pending");
  const [noteFor, setNoteFor] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [clientName, setClientName] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  async function sendChanges(id: string) {
    const ok = await requestChanges(id, note.trim());
    if (ok) {
      setNoteFor(null);
      setNote("");
    }
  }

  function copyLink(token: string) {
    const link = `${window.location.origin}/review/${token}`;
    navigator.clipboard?.writeText(link).catch(() => {});
    setCopied(token);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Freigaben</h1>
        <p className="mt-1 text-sm text-muted">
          Beiträge intern freigeben oder per Link vom Kunden freigeben lassen.
        </p>
      </div>

      {/* Wartet auf Freigabe */}
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">
        Wartet auf Freigabe ({pending.length})
      </h2>
      {pending.length === 0 ? (
        <div className="rounded-2xl border border-line bg-surface p-8 text-center text-sm text-muted">
          Nichts offen. Reiche im Planer einen Beitrag „Zur Freigabe“ ein, dann taucht er hier auf.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {pending.map((p) => {
            const [y, m, d] = p.date.split("-");
            return (
              <div key={p.id} className="rounded-2xl border border-line bg-surface p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {p.accountIds.map((id) => {
                      const acc = accounts.find((a) => a.id === id);
                      return acc ? <PlatformChip key={id} platform={acc.platform} size={22} /> : null;
                    })}
                    <span className="ml-1 text-xs text-muted">{FORMATS[p.format].label}</span>
                  </div>
                  <span className="text-xs text-muted">
                    {d}.{m}.{y} · {p.time} Uhr
                  </span>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">{p.body}</p>

                {noteFor === p.id ? (
                  <div className="mt-4">
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      rows={2}
                      placeholder="Was soll geändert werden? (optional)"
                      className={inputCls}
                      autoFocus
                    />
                    <div className="mt-2 flex justify-end gap-2">
                      <Button variant="ghost" onClick={() => setNoteFor(null)}>
                        Abbrechen
                      </Button>
                      <Button variant="danger" onClick={() => sendChanges(p.id)}>
                        Änderung senden
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 flex gap-2">
                    <Button onClick={() => approvePost(p.id)}>✓ Freigeben & einplanen</Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setNoteFor(p.id);
                        setNote("");
                      }}
                    >
                      Änderungen erbeten
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Kunden-Freigabelinks */}
      <div className="mt-10 rounded-2xl border border-line bg-surface p-6">
        <h2 className="font-semibold">Kunden-Freigabelink</h2>
        <p className="mt-1 text-sm text-muted">
          Erstelle einen Link, über den dein Kunde die eingereichten Beiträge selbst freigibt —
          ohne eigenes Konto.
        </p>
        <div className="mt-4 flex gap-2">
          <input
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="Name des Kunden (z. B. Bäckerei Berger)"
            className={inputCls}
          />
          <Button
            onClick={async () => {
              if (!clientName.trim()) return;
              await createReviewLink(clientName.trim());
              setClientName("");
            }}
            disabled={!clientName.trim()}
            className="shrink-0"
          >
            Link erstellen
          </Button>
        </div>

        {reviewLinks.length > 0 && (
          <div className="mt-4 flex flex-col gap-2">
            {reviewLinks.map((r) => (
              <div
                key={r.id}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-surface-2 px-3 py-2.5"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">{r.clientName}</div>
                  <div className="truncate font-mono text-xs text-muted">
                    /review/{r.token}
                  </div>
                </div>
                <Button variant="ghost" className="!px-3 !py-1.5 text-xs" onClick={() => copyLink(r.token)}>
                  {copied === r.token ? "✓ Kopiert" : "Link kopieren"}
                </Button>
                <button
                  onClick={() => revokeReviewLink(r.id)}
                  aria-label="Link zurückziehen"
                  className="rounded-lg px-2 py-1 text-sm text-muted transition hover:bg-danger/15 hover:text-danger"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Aktivitätsprotokoll */}
      <h2 className="mt-10 mb-3 text-sm font-semibold uppercase tracking-wider text-muted">
        Aktivitätsprotokoll
      </h2>
      <div className="overflow-hidden rounded-2xl border border-line bg-surface">
        {activity.length === 0 && (
          <div className="p-6 text-center text-sm text-muted">Noch keine Aktivität.</div>
        )}
        {activity.map((a, i) => (
          <div
            key={a.id}
            className={`flex items-start gap-3 p-3.5 text-sm ${i > 0 ? "border-t border-line" : ""}`}
          >
            <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
            <div className="min-w-0 flex-1">
              <span className="font-medium">{a.actor}</span>{" "}
              <span className="text-muted">{ACTIVITY_LABELS[a.action] ?? a.action}</span>
              {a.target && <span className="text-muted"> · „{a.target.slice(0, 60)}“</span>}
            </div>
            <span className="shrink-0 text-xs text-muted">{a.when}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
