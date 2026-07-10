"use client";

import { useMemo, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { Button, FormatIcon, inputCls, Modal, PlatformChip, StatusBadge } from "@/components/ui";
import {
  FORMATS,
  isExternalLink,
  MediaItem,
  mediaBackground,
  PLATFORMS,
  Post,
  PostFormat,
  PostStatus,
  toDateKey,
} from "@/lib/types";

const WEEKDAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
const MONTHS = [
  "Januar", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember",
];

interface ComposerState {
  id?: string;
  title: string | null;
  body: string;
  clientId: string | null;
  date: string;
  time: string;
  accountIds: string[];
  status: PostStatus | "review";
  format: PostFormat;
  media: MediaItem[];
}

export default function PlannerPage() {
  const {
    posts,
    accounts,
    clients,
    selectedClientId,
    savePost,
    deletePost,
    generateCaption,
    aiMode,
    can,
  } = useStore();
  const canEdit = can("content");

  // Global gefilterte Sicht (Kunden-Filter aus der Sidebar)
  const visiblePosts = selectedClientId
    ? posts.filter((p) => p.clientId === selectedClientId)
    : posts;

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-basiert
  const [composer, setComposer] = useState<ComposerState | null>(null);
  const [aiHint, setAiHint] = useState<string | null>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  function addLink() {
    const url = linkUrl.trim();
    if (!/^https?:\/\//i.test(url)) {
      setAiHint("Bitte einen gültigen Link (https://…) einfügen.");
      return;
    }
    setComposer((c) => {
      if (!c || c.media.length >= FORMATS[c.format].maxMedia) return c;
      return { ...c, media: [...c.media, { id: null, url }] };
    });
    setLinkUrl("");
  }

  const todayKey = toDateKey(new Date());

  // Kalender-Grid: Wochen des Monats, Montag als Wochenstart
  const weeks = useMemo(() => {
    const first = new Date(year, month, 1);
    const start = new Date(first);
    start.setDate(first.getDate() - ((first.getDay() + 6) % 7));
    const result: Date[][] = [];
    const cursor = new Date(start);
    do {
      const week: Date[] = [];
      for (let i = 0; i < 7; i++) {
        week.push(new Date(cursor));
        cursor.setDate(cursor.getDate() + 1);
      }
      result.push(week);
    } while (cursor.getMonth() === month && cursor.getFullYear() === year);
    return result;
  }, [year, month]);

  const postsByDay = useMemo(() => {
    const map = new Map<string, Post[]>();
    for (const p of visiblePosts) {
      const list = map.get(p.date) ?? [];
      list.push(p);
      map.set(p.date, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.time.localeCompare(b.time));
    }
    return map;
  }, [visiblePosts]);

  function shiftMonth(delta: number) {
    const d = new Date(year, month + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  }

  // Blogartikel gehen nur an Website-Accounts, alle anderen Formate nur an
  // Social-Accounts — die beiden Welten lassen sich nicht im selben Post mischen.
  function accountsForContext(clientId: string | null, format: PostFormat) {
    const byClient = clientId ? accounts.filter((a) => a.clientId === clientId) : accounts;
    return byClient.filter((a) => (format === "article") === (a.platform === "wordpress"));
  }

  function openNew(dateKey: string) {
    if (!canEdit) return;
    setAiHint(null);
    // Wenn ein Kunde gefiltert ist, den Post gleich diesem Kunden zuordnen
    const clientId = selectedClientId;
    const preselect = accountsForContext(clientId, "image");
    setComposer({
      title: null,
      body: "",
      clientId,
      date: dateKey,
      time: "10:00",
      accountIds: preselect.slice(0, 1).map((a) => a.id),
      status: "scheduled",
      format: "image",
      media: [],
    });
  }

  function openEdit(post: Post) {
    setAiHint(null);
    setComposer({ ...post, clientId: post.clientId, media: [...post.media] });
  }

  // Auswählbare Accounts richten sich nach Kunde und Format (Blog vs. Social)
  const composerAccounts = composer ? accountsForContext(composer.clientId, composer.format) : [];

  function setComposerClient(clientId: string | null) {
    setComposer((c) => {
      if (!c) return c;
      // Account-Auswahl auf den neuen Kunden eingrenzen
      const allowedIds = new Set(accountsForContext(clientId, c.format).map((a) => a.id));
      return { ...c, clientId, accountIds: c.accountIds.filter((id) => allowedIds.has(id)) };
    });
  }

  function setFormat(format: PostFormat) {
    setComposer((c) => {
      if (!c) return c;
      // Account-Auswahl auf den neuen Format-Kontext (Blog vs. Social) eingrenzen
      const allowedIds = new Set(accountsForContext(c.clientId, format).map((a) => a.id));
      // Medien auf das Limit des neuen Formats kürzen
      return {
        ...c,
        format,
        accountIds: c.accountIds.filter((id) => allowedIds.has(id)),
        media: c.media.slice(0, FORMATS[format].maxMedia),
      };
    });
  }

  async function uploadFiles(files: FileList | null) {
    if (!files || !composer) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const form = new FormData();
        form.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: form });
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          setAiHint(body?.error ?? "Upload fehlgeschlagen");
          continue;
        }
        const asset: { id: string; url: string } = await res.json();
        setComposer((c) => {
          if (!c || c.media.length >= FORMATS[c.format].maxMedia) return c;
          return { ...c, media: [...c.media, { id: asset.id, url: asset.url }] };
        });
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function removeMedia(index: number) {
    setComposer((c) =>
      c ? { ...c, media: c.media.filter((_, i) => i !== index) } : c
    );
  }

  async function suggestCaption() {
    if (!composer) return;
    const topic = composer.body.trim();
    if (!topic) {
      setAiHint("Schreibe zuerst ein paar Stichworte — daraus macht die KI eine fertige Caption.");
      return;
    }
    const firstAcc = accounts.find((a) => a.id === composer.accountIds[0]);
    setAiBusy(true);
    setAiHint(null);
    const res = await generateCaption(topic, firstAcc?.platform);
    setAiBusy(false);
    if (!res) return; // Fehlermeldung erscheint im globalen Hinweis-Toast
    setComposer((c) => (c ? { ...c, body: res.text } : c));
    setAiHint(
      res.source === "demo"
        ? "Demo-Vorschlag eingefügt · echte KI aktiv, sobald ein API-Key im KI-Studio hinterlegt ist."
        : aiMode === "byo"
          ? "Mit deinem eigenen API-Key erzeugt · keine Credits verbraucht."
          : "1 Credit verbraucht · mit Claude erzeugt."
    );
  }

  async function submit() {
    if (!composer || !composer.body.trim() || composer.accountIds.length === 0) return;
    if (composer.format === "article" && !composer.title?.trim()) return;
    setSaving(true);
    const ok = await savePost({
      id: composer.id,
      title: composer.format === "article" ? composer.title?.trim() : null,
      body: composer.body.trim(),
      clientId: composer.clientId,
      date: composer.date,
      time: composer.time,
      accountIds: composer.accountIds,
      status:
        composer.status === "review"
          ? "review"
          : composer.status === "draft"
            ? "draft"
            : "scheduled",
      format: composer.format,
      media: composer.media,
    });
    setSaving(false);
    if (ok) setComposer(null);
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Planer</h1>
          <p className="mt-1 text-sm text-muted">
            Klicke auf einen Tag, um einen Post zu planen — beliebig weit im Voraus.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => shiftMonth(-1)} aria-label="Vorheriger Monat">
            ←
          </Button>
          <div className="w-44 text-center text-sm font-semibold">
            {MONTHS[month]} {year}
          </div>
          <Button variant="ghost" onClick={() => shiftMonth(1)} aria-label="Nächster Monat">
            →
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              const d = new Date();
              setYear(d.getFullYear());
              setMonth(d.getMonth());
            }}
          >
            Heute
          </Button>
          {canEdit && <Button onClick={() => openNew(todayKey)}>+ Neuer Post</Button>}
        </div>
      </div>

      {!canEdit && (
        <div className="mb-4 rounded-xl border border-line bg-surface-2 px-4 py-3 text-sm text-muted">
          Nur-Ansicht: In deiner Rolle (Betrachter:in) kannst du Beiträge sehen, aber nicht ändern.
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-line bg-surface">
        <div className="grid grid-cols-7 border-b border-line">
          {WEEKDAYS.map((d) => (
            <div key={d} className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted">
              {d}
            </div>
          ))}
        </div>
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 border-b border-line last:border-b-0">
            {week.map((day) => {
              const key = toDateKey(day);
              const inMonth = day.getMonth() === month;
              const isToday = key === todayKey;
              const dayPosts = postsByDay.get(key) ?? [];
              return (
                <div
                  key={key}
                  onClick={() => openNew(key)}
                  className={`group min-h-28 cursor-pointer border-r border-line p-1.5 transition last:border-r-0 hover:bg-surface-2 ${
                    inMonth ? "" : "opacity-35"
                  }`}
                >
                  <div className="mb-1 flex items-center justify-between px-1">
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                        isToday ? "bg-accent font-bold text-accent-contrast" : "text-muted"
                      }`}
                    >
                      {day.getDate()}
                    </span>
                    <span className="hidden text-xs text-accent-fg group-hover:inline">+</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    {dayPosts.slice(0, 3).map((post) => {
                      const firstAcc = accounts.find((a) => a.id === post.accountIds[0]);
                      const color = firstAcc ? PLATFORMS[firstAcc.platform].color : "#666";
                      return (
                        <button
                          key={post.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            openEdit(post);
                          }}
                          className={`flex w-full items-center gap-1.5 truncate rounded-lg px-1.5 py-1 text-left text-[11px] leading-tight transition hover:brightness-125 ${
                            post.status === "draft" ? "opacity-60" : ""
                          }`}
                          style={{ background: `${color}22`, color: "var(--foreground)" }}
                        >
                          <span
                            className="h-2 w-2 shrink-0 rounded-full"
                            style={{ background: color }}
                          />
                          <span className="shrink-0 font-mono text-[10px] text-muted">
                            {post.time}
                          </span>
                          <span className="text-muted">
                            <FormatIcon format={post.format} size={11} />
                          </span>
                          <span className="truncate">{post.title || post.body}</span>
                        </button>
                      );
                    })}
                    {dayPosts.length > 3 && (
                      <div className="px-1.5 text-[11px] text-muted">
                        +{dayPosts.length - 3} weitere
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted">
        <span className="font-medium">Plattformen:</span>
        {Object.entries(PLATFORMS).map(([key, p]) => (
          <span key={key} className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
            {p.label}
          </span>
        ))}
      </div>

      {composer && (
        <Modal
          title={composer.id ? "Post bearbeiten" : "Post planen"}
          onClose={() => setComposer(null)}
          wide
        >
          <div className="flex flex-col gap-4">
            {composer.id &&
              (() => {
                const original = posts.find((p) => p.id === composer.id);
                if (!original) return null;
                if (original.approval === "pending") {
                  return (
                    <div className="rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-warning">
                      Dieser Beitrag wartet auf Freigabe — Freigeben/Ablehnen im Menüpunkt
                      „Freigaben“ oder über den Kunden-Freigabelink.
                    </div>
                  );
                }
                if (original.approval === "changes_requested") {
                  return (
                    <div className="rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm">
                      <div className="font-medium text-danger">Änderungen erbeten</div>
                      {original.approvalNote && (
                        <p className="mt-1 text-danger/90">„{original.approvalNote}“</p>
                      )}
                      <p className="mt-1.5 text-xs text-muted">
                        Passe den Beitrag an und reiche ihn erneut zur Freigabe ein.
                      </p>
                    </div>
                  );
                }
                return null;
              })()}
            {composer.id &&
              (() => {
                const original = posts.find((p) => p.id === composer.id);
                if (!original || original.publishErrors.length === 0) return null;
                return (
                  <div className="rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm">
                    <div className="font-medium text-danger">
                      Veröffentlichung fehlgeschlagen:
                    </div>
                    <ul className="mt-1 list-inside list-disc text-danger/90">
                      {original.publishErrors.map((e) => (
                        <li key={e}>{e}</li>
                      ))}
                    </ul>
                    <p className="mt-1.5 text-xs text-muted">
                      Behebe das Problem (Text/Format/Accounts) und speichere mit Status
                      „Geplant“ — dann wird es automatisch erneut versucht.
                    </p>
                  </div>
                );
              })()}
            {clients.length > 0 && (
              <div>
                <label className="mb-1.5 block text-sm font-medium">Kunde</label>
                <select
                  value={composer.clientId ?? ""}
                  onChange={(e) => setComposerClient(e.target.value || null)}
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
            )}

            {composer.format === "article" && (
              <div>
                <label className="mb-1.5 block text-sm font-medium">Titel</label>
                <input
                  value={composer.title ?? ""}
                  onChange={(e) => setComposer({ ...composer, title: e.target.value })}
                  placeholder="Titel des Blogartikels"
                  className={inputCls}
                />
              </div>
            )}

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-sm font-medium">
                  {composer.format === "article" ? "Inhalt" : "Text"}
                </label>
                <button
                  onClick={suggestCaption}
                  disabled={aiBusy}
                  className="rounded-lg bg-accent-soft px-2.5 py-1 text-xs font-medium text-accent-fg transition hover:brightness-125 disabled:opacity-60"
                >
                  {aiBusy
                    ? "✨ Schreibt …"
                    : `✨ KI-Vorschlag ${aiMode === "credits" ? "(1 Credit)" : "(eigener Key)"}`}
                </button>
              </div>
              <textarea
                value={composer.body}
                onChange={(e) => setComposer({ ...composer, body: e.target.value })}
                rows={4}
                placeholder="Was möchtest du posten?"
                className={inputCls}
                autoFocus
              />
              {aiHint && <p className="mt-1.5 text-xs text-muted">{aiHint}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Veröffentlichen auf ({composer.accountIds.length} ausgewählt)
              </label>
              <div className="flex flex-wrap gap-2">
                {composerAccounts.map((acc) => {
                  const selected = composer.accountIds.includes(acc.id);
                  return (
                    <button
                      key={acc.id}
                      onClick={() =>
                        setComposer({
                          ...composer,
                          accountIds: selected
                            ? composer.accountIds.filter((id) => id !== acc.id)
                            : [...composer.accountIds, acc.id],
                        })
                      }
                      className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 text-sm transition ${
                        selected
                          ? "border-accent bg-accent-soft text-foreground"
                          : "border-line text-muted hover:border-accent/40"
                      }`}
                    >
                      <PlatformChip platform={acc.platform} size={18} />
                      {acc.handle}
                    </button>
                  );
                })}
              </div>
              {composerAccounts.length === 0 && (
                <p className="text-sm text-muted">
                  {composer.format === "article"
                    ? "Noch keine Website verbunden — zuerst unter „Accounts“ eine WordPress-Website hinzufügen."
                    : "Noch keine Accounts verbunden — zuerst unter „Accounts“ hinzufügen."}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Datum</label>
                <input
                  type="date"
                  value={composer.date}
                  onChange={(e) => setComposer({ ...composer, date: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Uhrzeit</label>
                <input
                  type="time"
                  value={composer.time}
                  onChange={(e) => setComposer({ ...composer, time: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Status</label>
                <select
                  value={composer.status === "review" ? "review" : composer.status}
                  onChange={(e) =>
                    setComposer({ ...composer, status: e.target.value as PostStatus | "review" })
                  }
                  className={inputCls}
                >
                  <option value="scheduled">Geplant</option>
                  <option value="draft">Entwurf</option>
                  <option value="review">Zur Freigabe einreichen</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Format</label>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(FORMATS) as PostFormat[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFormat(f)}
                    title={FORMATS[f].hint}
                    className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-sm transition ${
                      composer.format === f
                        ? "border-accent bg-accent-soft text-foreground"
                        : "border-line text-muted hover:border-accent/40"
                    }`}
                  >
                    <FormatIcon format={f} size={13} />
                    {FORMATS[f].label}
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-xs text-muted">{FORMATS[composer.format].hint}</p>
            </div>

            {FORMATS[composer.format].maxMedia > 0 && (
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  {composer.format === "article" ? "Beitragsbild" : "Medien"} ({composer.media.length}/
                  {FORMATS[composer.format].maxMedia})
                </label>
                <div className="flex flex-wrap gap-2">
                  {composer.media.map((item, i) => (
                    <div
                      key={item.id ?? `ph-${i}`}
                      className={`group/media relative overflow-hidden rounded-xl border border-line ${
                        composer.format === "story" ? "h-24 w-14" : "h-16 w-16"
                      }`}
                      style={{ background: mediaBackground(item.url) }}
                      title={isExternalLink(item.url) ? item.url : undefined}
                    >
                      {isExternalLink(item.url) ? (
                        <span className="absolute inset-0 flex items-center justify-center text-white/90">
                          🔗
                        </span>
                      ) : composer.format === "video" ? (
                        <span className="absolute inset-0 flex items-center justify-center text-white/90">
                          ▶
                        </span>
                      ) : null}
                      <button
                        onClick={() => removeMedia(i)}
                        aria-label="Medium entfernen"
                        className="absolute right-0.5 top-0.5 hidden h-5 w-5 items-center justify-center rounded-md bg-black/50 text-xs text-white group-hover/media:flex"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {composer.media.length < FORMATS[composer.format].maxMedia && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className={`flex flex-col items-center justify-center gap-0.5 rounded-xl border border-dashed border-line text-muted transition hover:border-accent hover:text-accent-fg disabled:opacity-50 ${
                        composer.format === "story" ? "h-24 w-14" : "h-16 w-16"
                      }`}
                    >
                      <span className="text-lg leading-none">{uploading ? "…" : "+"}</span>
                      <span className="text-[9px]">{uploading ? "lädt" : "Upload"}</span>
                    </button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    multiple={composer.format === "carousel"}
                    className="hidden"
                    onChange={(e) => uploadFiles(e.target.files)}
                  />
                </div>
                {composer.media.length < FORMATS[composer.format].maxMedia && (
                  <div className="mt-2 flex gap-2">
                    <input
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addLink())}
                      placeholder="Oder Video-/Datei-Link einfügen (Dropbox, Drive, …)"
                      className={inputCls}
                    />
                    <Button variant="ghost" onClick={addLink} disabled={!linkUrl.trim()} className="shrink-0">
                      + Link
                    </Button>
                  </div>
                )}
                <p className="mt-1.5 text-xs text-muted">
                  Bilder lokal (JPG/PNG/WebP/GIF, max. 8 MB) — oder große Videos per Link
                  (Dropbox/Drive), den dein Kunde in der Freigabe direkt öffnen kann.
                </p>
              </div>
            )}

            <div className="flex items-center justify-between border-t border-line pt-4">
              <div>
                {composer.id && (
                  <Button
                    variant="danger"
                    onClick={async () => {
                      await deletePost(composer.id!);
                      setComposer(null);
                    }}
                  >
                    Löschen
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-3">
                {composer.id && composer.status !== "review" && (
                  <StatusBadge status={composer.status} />
                )}
                <Button variant="ghost" onClick={() => setComposer(null)}>
                  Abbrechen
                </Button>
                <Button
                  onClick={submit}
                  disabled={
                    saving ||
                    !composer.body.trim() ||
                    composer.accountIds.length === 0 ||
                    (composer.format === "article" && !composer.title?.trim())
                  }
                >
                  {saving
                    ? "Speichert …"
                    : composer.status === "review"
                      ? "Einreichen"
                      : composer.id
                        ? "Speichern"
                        : "Planen"}
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
