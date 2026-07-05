"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { Button, inputCls, PlatformChip } from "@/components/ui";

export default function InboxPage() {
  const { comments: allComments, selectedClientId, toggleCommentLike, replyComment, deleteComment } =
    useStore();
  const comments = selectedClientId
    ? allComments.filter((c) => c.clientId === selectedClientId)
    : allComments;
  const [replyFor, setReplyFor] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);

  async function sendReply(commentId: string) {
    if (!replyText.trim()) return;
    setSending(true);
    const ok = await replyComment(commentId, replyText.trim());
    setSending(false);
    if (ok) {
      setReplyFor(null);
      setReplyText("");
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Inbox</h1>
        <p className="mt-1 text-sm text-muted">
          Kommentare zu deinen Beiträgen — antworten, liken oder löschen, ohne die App zu
          verlassen.
        </p>
      </div>

      {comments.length === 0 && (
        <div className="rounded-2xl border border-line bg-surface p-10 text-center text-sm text-muted">
          Noch keine Kommentare. Sobald deine Accounts verbunden sind (Phase 2), laufen hier
          alle Kommentare deiner Beiträge zusammen.
        </div>
      )}

      <div className="flex flex-col gap-4">
        {comments.map((c) => (
          <div key={c.id} className="rounded-2xl border border-line bg-surface p-5">
            <div className="flex items-start gap-3">
              <PlatformChip platform={c.platform} size={28} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span className="text-sm font-semibold">{c.author}</span>
                  {c.authorHandle && (
                    <span className="text-xs text-muted">{c.authorHandle}</span>
                  )}
                  <span className="text-xs text-muted">· {c.when}</span>
                </div>
                <p className="mt-1 text-sm leading-relaxed">{c.text}</p>
                <p className="mt-2 truncate text-xs text-muted">
                  zu: „{c.postSnippet}…“ · {c.accountLabel}
                </p>

                {c.replies.map((r) => (
                  <div
                    key={r.id}
                    className="mt-3 rounded-xl border border-line bg-surface-2 px-3 py-2"
                  >
                    <div className="text-xs font-semibold text-accent-fg">
                      Deine Antwort <span className="font-normal text-muted">· {r.when}</span>
                    </div>
                    <p className="mt-0.5 text-sm">{r.text}</p>
                  </div>
                ))}

                {replyFor === c.id ? (
                  <div className="mt-3 flex gap-2">
                    <input
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && sendReply(c.id)}
                      placeholder={`Antwort an ${c.author} …`}
                      className={inputCls}
                      autoFocus
                    />
                    <Button
                      onClick={() => sendReply(c.id)}
                      disabled={sending || !replyText.trim()}
                      className="shrink-0"
                    >
                      {sending ? "…" : "Senden"}
                    </Button>
                  </div>
                ) : (
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      onClick={() => toggleCommentLike(c.id)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                        c.likedByUs
                          ? "bg-accent-soft text-accent-fg"
                          : "text-muted hover:bg-surface-2 hover:text-foreground"
                      }`}
                    >
                      {c.likedByUs ? "♥ Geliked" : "♡ Liken"}
                    </button>
                    <button
                      onClick={() => {
                        setReplyFor(c.id);
                        setReplyText("");
                      }}
                      className="rounded-lg px-2.5 py-1 text-xs font-medium text-muted transition hover:bg-surface-2 hover:text-foreground"
                    >
                      ↩ Antworten
                    </button>
                    <button
                      onClick={() => deleteComment(c.id)}
                      className="rounded-lg px-2.5 py-1 text-xs font-medium text-muted transition hover:bg-danger/15 hover:text-danger"
                    >
                      Löschen
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {comments.length > 0 && (
        <div className="mt-6 rounded-2xl border border-line bg-surface p-5 text-sm text-muted">
          <strong className="text-foreground">Hinweis:</strong> Das sind Beispiel-Kommentare.
          In Phase 2 werden echte Kommentare über die Plattform-APIs synchronisiert — Antworten,
          Likes und Löschungen wirken dann direkt auf Instagram, Facebook & Co. (X erlaubt kein
          Fremd-Löschen; dort wird „Verbergen“ angeboten, wo die API es zulässt.)
        </div>
      )}
    </div>
  );
}
