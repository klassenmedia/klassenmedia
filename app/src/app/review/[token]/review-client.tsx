"use client";

import { useState } from "react";
import {
  clientApproveAction,
  clientRequestChangesAction,
  ReviewData,
} from "@/lib/review-actions";
import { PlatformChip } from "@/components/ui";
import { FORMATS, isExternalLink, mediaBackground } from "@/lib/types";

export function ReviewClient({ token, initial }: { token: string; initial: ReviewData }) {
  const [data, setData] = useState<ReviewData>(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [noteFor, setNoteFor] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function approve(postId: string) {
    setBusy(postId);
    setError(null);
    const res = await clientApproveAction(token, postId);
    setBusy(null);
    if (res.data) setData(res.data);
    if (!res.ok) setError(res.error ?? "Fehler");
  }

  async function requestChanges(postId: string) {
    setBusy(postId);
    setError(null);
    const res = await clientRequestChangesAction(token, postId, note.trim() || undefined);
    setBusy(null);
    if (res.data) setData(res.data);
    if (!res.ok) setError(res.error ?? "Fehler");
    else {
      setNoteFor(null);
      setNote("");
    }
  }

  return (
    <div>
      <div className="mb-6 text-center">
        <h1 className="text-xl font-semibold">Beiträge freigeben</h1>
        <p className="mt-1 text-sm text-muted">
          <strong className="text-foreground">{data.workspaceName}</strong> bittet um deine Freigabe
          für <strong className="text-foreground">{data.clientName}</strong>.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-xl bg-danger/10 px-4 py-2.5 text-sm text-danger">{error}</div>
      )}

      {data.posts.length === 0 ? (
        <div className="rounded-2xl border border-line bg-surface p-8 text-center text-sm text-muted">
          🎉 Alles erledigt — es gibt derzeit nichts mehr freizugeben. Du kannst dieses Fenster
          schließen.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {data.posts.map((p) => (
            <div key={p.id} className="rounded-2xl border border-line bg-surface p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {p.platforms.map((pl, i) => (
                    <PlatformChip key={`${pl}-${i}`} platform={pl} size={22} />
                  ))}
                  <span className="ml-1 text-xs text-muted">{FORMATS[p.format].label}</span>
                </div>
                <span className="text-xs text-muted">{p.when}</span>
              </div>

              {p.media.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {p.media.map((m, i) =>
                    isExternalLink(m) ? (
                      <a
                        key={i}
                        href={m}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center justify-center rounded-lg border border-line text-center text-[11px] font-medium text-white transition hover:brightness-110 ${
                          p.format === "story" ? "h-28 w-16" : "h-20 w-20"
                        }`}
                        style={{ background: mediaBackground(m) }}
                      >
                        🔗 Video ansehen
                      </a>
                    ) : (
                      <div
                        key={i}
                        className={`overflow-hidden rounded-lg border border-line ${
                          p.format === "story" ? "h-28 w-16" : "h-20 w-20"
                        }`}
                        style={{ background: mediaBackground(m) }}
                      />
                    )
                  )}
                </div>
              )}

              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">{p.body}</p>

              {noteFor === p.id ? (
                <div className="mt-4">
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={2}
                    placeholder="Was soll geändert werden? (optional)"
                    className="w-full rounded-xl border border-line bg-surface-2 px-3 py-2 text-sm outline-none focus:border-accent"
                    autoFocus
                  />
                  <div className="mt-2 flex justify-end gap-2">
                    <button
                      onClick={() => {
                        setNoteFor(null);
                        setNote("");
                      }}
                      className="rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-muted"
                    >
                      Abbrechen
                    </button>
                    <button
                      onClick={() => requestChanges(p.id)}
                      disabled={busy === p.id}
                      className="rounded-lg bg-danger/15 px-3 py-1.5 text-sm font-medium text-danger disabled:opacity-50"
                    >
                      Änderung senden
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => approve(p.id)}
                    disabled={busy === p.id}
                    className="flex-1 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-accent-contrast transition hover:brightness-110 disabled:opacity-50"
                  >
                    {busy === p.id ? "…" : "✓ Freigeben"}
                  </button>
                  <button
                    onClick={() => {
                      setNoteFor(p.id);
                      setNote("");
                    }}
                    className="rounded-xl border border-line px-4 py-2 text-sm font-medium text-muted transition hover:bg-surface-2 hover:text-foreground"
                  >
                    Änderungen erbeten
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <p className="mt-8 text-center text-xs text-muted">
        Freigaben landen direkt bei {data.workspaceName}. Kein Konto nötig.
      </p>
    </div>
  );
}
