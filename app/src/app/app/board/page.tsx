"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { Button, FormatIcon, inputCls, Modal, PlatformChip } from "@/components/ui";
import { FORMATS, isExternalLink, mediaBackground, Post } from "@/lib/types";

type ColKey = "draft" | "review" | "scheduled" | "published";

const COLUMNS: { key: ColKey; label: string; accent: string; droppable: boolean; hint: string }[] = [
  { key: "draft", label: "Entwurf", accent: "#94a3b8", droppable: true, hint: "Ideen & Rohfassungen" },
  { key: "review", label: "In Freigabe", accent: "#f59e0b", droppable: true, hint: "Wartet auf Freigabe" },
  { key: "scheduled", label: "Geplant", accent: "#2563eb", droppable: true, hint: "Freigegeben & terminiert" },
  { key: "published", label: "Veröffentlicht", accent: "#16a34a", droppable: false, hint: "Erledigt" },
];

function columnOf(p: Post): ColKey {
  if (p.status === "published") return "published";
  if (p.approval === "pending") return "review";
  if (p.status === "scheduled" || p.status === "publishing" || p.status === "failed") return "scheduled";
  return "draft";
}

export default function BoardPage() {
  const { posts, accounts, selectedClientId, movePost, approvePost, requestChanges, deletePost, savePost, can } =
    useStore();
  const canEdit = can("content");
  const canApprove = can("approve");
  const visiblePosts = selectedClientId
    ? posts.filter((p) => p.clientId === selectedClientId)
    : posts;

  const [dragId, setDragId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<ColKey | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [noteOpen, setNoteOpen] = useState(false);
  const [editBody, setEditBody] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const grouped = useMemo(() => {
    const map: Record<ColKey, Post[]> = { draft: [], review: [], scheduled: [], published: [] };
    for (const p of visiblePosts) map[columnOf(p)].push(p);
    for (const key of Object.keys(map) as ColKey[]) {
      map[key].sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
    }
    return map;
  }, [visiblePosts]);

  const detail = detailId ? posts.find((p) => p.id === detailId) ?? null : null;

  function draggable(p: Post): boolean {
    if (p.status === "published") return false;
    return canEdit || (p.approval === "pending" && canApprove);
  }

  async function drop(col: ColKey, e: React.DragEvent) {
    setOverCol(null);
    const id = e.dataTransfer.getData("text/plain") || dragId;
    setDragId(null);
    if (!id) return;
    const post = posts.find((p) => p.id === id);
    if (!post || !COLUMNS.find((c) => c.key === col)?.droppable) return;
    if (columnOf(post) === col) return;
    await movePost(id, col as "draft" | "review" | "scheduled");
  }

  function openDetail(p: Post) {
    setDetailId(p.id);
    setNote("");
    setNoteOpen(false);
    setEditBody(p.body);
    setEditDate(p.date);
    setEditTime(p.time);
  }

  async function saveEdit() {
    if (!detail) return;
    setSavingEdit(true);
    const ok = await savePost({
      id: detail.id,
      body: editBody.trim(),
      clientId: detail.clientId,
      date: editDate,
      time: editTime,
      accountIds: detail.accountIds,
      status: detail.status === "scheduled" ? "scheduled" : "draft",
      format: detail.format,
      media: detail.media,
    });
    setSavingEdit(false);
    if (ok) setDetailId(null);
  }

  return (
    <div className="mx-auto max-w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Board</h1>
        <p className="mt-1 text-sm text-muted">
          Deine Content-Pipeline als Kanban — {canEdit ? "zieh Karten zwischen den Spalten" : "Nur-Ansicht in deiner Rolle"}.
          Freigeben, planen und veröffentlichen an einem Ort.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {COLUMNS.map((col) => {
          const list = grouped[col.key];
          const isOver = overCol === col.key && col.droppable;
          return (
            <div
              key={col.key}
              onDragOver={(e) => {
                if (!col.droppable || !dragId) return;
                e.preventDefault();
                setOverCol(col.key);
              }}
              onDragLeave={() => setOverCol((c) => (c === col.key ? null : c))}
              onDrop={(e) => drop(col.key, e)}
              data-col={col.key}
              className={`flex min-h-[60vh] flex-col rounded-2xl border bg-surface-2/40 p-2.5 transition ${
                isOver ? "border-accent bg-accent-soft/40" : "border-line"
              }`}
            >
              <div className="mb-2 flex items-center justify-between px-1.5 py-1">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: col.accent }} />
                  <span className="text-sm font-semibold">{col.label}</span>
                  <span className="rounded-full bg-surface-2 px-1.5 text-xs text-muted">{list.length}</span>
                </div>
              </div>

              <div className="flex flex-1 flex-col gap-2">
                {list.length === 0 && (
                  <div className="rounded-xl border border-dashed border-line px-3 py-6 text-center text-xs text-muted">
                    {col.hint}
                  </div>
                )}
                {list.map((p) => {
                  const canDrag = draggable(p);
                  return (
                    <button
                      key={p.id}
                      data-postid={p.id}
                      draggable={canDrag}
                      onDragStart={(e) => {
                        setDragId(p.id);
                        e.dataTransfer.effectAllowed = "move";
                        e.dataTransfer.setData("text/plain", p.id);
                      }}
                      onDragEnd={() => {
                        setDragId(null);
                        setOverCol(null);
                      }}
                      onClick={() => openDetail(p)}
                      className={`w-full rounded-xl border border-line bg-surface p-3 text-left shadow-sm transition hover:border-accent/40 ${
                        canDrag ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"
                      } ${dragId === p.id ? "opacity-50" : ""}`}
                    >
                      <div className="flex items-center gap-1.5">
                        {p.accountIds.slice(0, 4).map((id) => {
                          const acc = accounts.find((a) => a.id === id);
                          return acc ? <PlatformChip key={id} platform={acc.platform} size={18} /> : null;
                        })}
                        <span className="ml-auto text-muted">
                          <FormatIcon format={p.format} size={12} />
                        </span>
                      </div>
                      {p.title && <p className="mt-2 text-sm font-semibold leading-snug">{p.title}</p>}
                      <p className={`${p.title ? "mt-1" : "mt-2"} line-clamp-3 text-sm leading-snug`}>
                        {p.body}
                      </p>
                      <div className="mt-2 flex items-center gap-2 text-[11px] text-muted">
                        <span className="font-mono">
                          {p.date.split("-").reverse().join(".")} · {p.time}
                        </span>
                        {p.status === "failed" && (
                          <span className="rounded bg-danger/15 px-1.5 py-0.5 font-medium text-danger">Fehler</span>
                        )}
                        {p.approval === "changes_requested" && (
                          <span className="rounded bg-danger/15 px-1.5 py-0.5 font-medium text-danger">Änderung erbeten</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {detail && (
        <Modal title="Beitrag" onClose={() => setDetailId(null)}>
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
              {detail.accountIds.map((id) => {
                const acc = accounts.find((a) => a.id === id);
                return acc ? (
                  <span key={id} className="flex items-center gap-1.5 rounded-lg border border-line px-2 py-1 text-xs">
                    <PlatformChip platform={acc.platform} size={16} /> {acc.handle}
                  </span>
                ) : null;
              })}
              <span className="ml-auto text-xs text-muted">{FORMATS[detail.format].label}</span>
            </div>

            {detail.media.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {detail.media.map((m, i) =>
                  isExternalLink(m.url) ? (
                    <a
                      key={m.id ?? i}
                      href={m.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={m.url}
                      className="flex h-16 w-16 items-center justify-center rounded-lg border border-line text-lg transition hover:brightness-110"
                      style={{ background: mediaBackground(m.url) }}
                    >
                      🔗
                    </a>
                  ) : (
                    <div
                      key={m.id ?? i}
                      className="h-16 w-16 overflow-hidden rounded-lg border border-line"
                      style={{ background: mediaBackground(m.url) }}
                    />
                  )
                )}
              </div>
            )}

            {detail.title && <h3 className="text-base font-semibold">{detail.title}</h3>}

            {/* Wartet auf Freigabe → Freigabe-Aktionen (nur mit Recht) */}
            {detail.approval === "pending" ? (
              <div className="rounded-xl border border-warning/40 bg-warning/10 p-4">
                <div className="text-sm font-medium text-warning">Wartet auf Freigabe</div>
                <p className="mt-2 whitespace-pre-wrap text-sm">{detail.body}</p>
                {canApprove ? (
                  noteOpen ? (
                    <div className="mt-3">
                      <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        rows={2}
                        placeholder="Was soll geändert werden? (optional)"
                        className={inputCls}
                        autoFocus
                      />
                      <div className="mt-2 flex justify-end gap-2">
                        <Button variant="ghost" onClick={() => setNoteOpen(false)}>Abbrechen</Button>
                        <Button
                          variant="danger"
                          onClick={async () => {
                            const ok = await requestChanges(detail.id, note.trim());
                            if (ok) setDetailId(null);
                          }}
                        >
                          Änderung senden
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 flex gap-2">
                      <Button
                        onClick={async () => {
                          await approvePost(detail.id);
                          setDetailId(null);
                        }}
                      >
                        ✓ Freigeben & einplanen
                      </Button>
                      <Button variant="ghost" onClick={() => setNoteOpen(true)}>Änderungen erbeten</Button>
                    </div>
                  )
                ) : (
                  <p className="mt-2 text-xs text-muted">
                    Freigeben kann nur Admin/Inhaber oder der Kunde über den Freigabelink.
                  </p>
                )}
              </div>
            ) : detail.status === "published" ? (
              <p className="whitespace-pre-wrap rounded-xl border border-line bg-surface-2 p-4 text-sm">
                {detail.body}
              </p>
            ) : canEdit ? (
              <div className="flex flex-col gap-3">
                <textarea
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                  rows={4}
                  className={inputCls}
                />
                <div className="grid grid-cols-2 gap-3">
                  <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} className={inputCls} />
                  <input type="time" value={editTime} onChange={(e) => setEditTime(e.target.value)} className={inputCls} />
                </div>
                {detail.publishErrors.length > 0 && (
                  <div className="rounded-xl border border-danger/40 bg-danger/10 px-3 py-2 text-xs text-danger">
                    {detail.publishErrors.join(" · ")}
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <Button
                    variant="danger"
                    onClick={async () => {
                      await deletePost(detail.id);
                      setDetailId(null);
                    }}
                  >
                    Löschen
                  </Button>
                  <Button onClick={saveEdit} disabled={savingEdit || !editBody.trim()}>
                    {savingEdit ? "Speichert …" : "Speichern"}
                  </Button>
                </div>
              </div>
            ) : (
              <p className="whitespace-pre-wrap rounded-xl border border-line bg-surface-2 p-4 text-sm">
                {detail.body}
              </p>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
