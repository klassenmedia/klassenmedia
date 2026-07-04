"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { Button, FormatIcon, inputCls, Modal, PlatformChip, StatusBadge } from "@/components/ui";
import { FORMATS, PLATFORMS, Post, PostFormat, PostStatus, toDateKey } from "@/lib/types";
import { AI_CAPTION_IDEAS } from "@/lib/demo-data";

const WEEKDAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
const MONTHS = [
  "Januar", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember",
];

interface ComposerState {
  id?: string;
  body: string;
  date: string;
  time: string;
  accountIds: string[];
  status: PostStatus;
  format: PostFormat;
  media: number[];
}

export default function PlannerPage() {
  const { posts, accounts, savePost, deletePost, spendCredits, aiMode } = useStore();

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-basiert
  const [composer, setComposer] = useState<ComposerState | null>(null);
  const [aiHint, setAiHint] = useState<string | null>(null);

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
    for (const p of posts) {
      const list = map.get(p.date) ?? [];
      list.push(p);
      map.set(p.date, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.time.localeCompare(b.time));
    }
    return map;
  }, [posts]);

  function shiftMonth(delta: number) {
    const d = new Date(year, month + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  }

  function openNew(dateKey: string) {
    setAiHint(null);
    setComposer({
      body: "",
      date: dateKey,
      time: "10:00",
      accountIds: accounts.slice(0, 1).map((a) => a.id),
      status: "scheduled",
      format: "image",
      media: [],
    });
  }

  function openEdit(post: Post) {
    setAiHint(null);
    setComposer({ ...post, media: [...post.media] });
  }

  function setFormat(format: PostFormat) {
    setComposer((c) => {
      if (!c) return c;
      // Medien auf das Limit des neuen Formats kürzen
      return { ...c, format, media: c.media.slice(0, FORMATS[format].maxMedia) };
    });
  }

  function addMedia() {
    setComposer((c) => {
      if (!c || c.media.length >= FORMATS[c.format].maxMedia) return c;
      return { ...c, media: [...c.media, (c.media.length * 73 + c.body.length * 31 + 40) % 360] };
    });
  }

  function removeMedia(index: number) {
    setComposer((c) =>
      c ? { ...c, media: c.media.filter((_, i) => i !== index) } : c
    );
  }

  function suggestCaption() {
    if (!composer) return;
    if (aiMode === "credits") {
      const ok = spendCredits(1, "Caption-Vorschlag (Planer)");
      if (!ok) {
        setAiHint("Nicht genug Credits — Kontingent im KI-Studio aufladen oder eigenen API-Key hinterlegen.");
        return;
      }
      setAiHint("1 Credit verbraucht · Vorschlag eingefügt (Demo)");
    } else {
      setAiHint("Über deinen eigenen API-Key generiert (Demo) · keine Credits verbraucht");
    }
    const idea = AI_CAPTION_IDEAS[Math.floor(Math.random() * AI_CAPTION_IDEAS.length)];
    setComposer((c) => (c ? { ...c, body: idea } : c));
  }

  function submit() {
    if (!composer || !composer.body.trim() || composer.accountIds.length === 0) return;
    savePost({
      id: composer.id,
      body: composer.body.trim(),
      date: composer.date,
      time: composer.time,
      accountIds: composer.accountIds,
      status: composer.status,
      format: composer.format,
      media: composer.media,
    });
    setComposer(null);
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
          <Button onClick={() => openNew(todayKey)}>+ Neuer Post</Button>
        </div>
      </div>

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
                    <span className="hidden text-xs text-accent group-hover:inline">+</span>
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
                          <span className="truncate">{post.body}</span>
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
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-sm font-medium">Text</label>
                <button
                  onClick={suggestCaption}
                  className="rounded-lg bg-accent-soft px-2.5 py-1 text-xs font-medium text-accent transition hover:brightness-125"
                >
                  ✨ KI-Vorschlag {aiMode === "credits" ? "(1 Credit)" : "(eigener Key)"}
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
                {accounts.map((acc) => {
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
              {accounts.length === 0 && (
                <p className="text-sm text-muted">
                  Noch keine Accounts verbunden — zuerst unter „Accounts“ hinzufügen.
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
                  value={composer.status}
                  onChange={(e) =>
                    setComposer({ ...composer, status: e.target.value as PostStatus })
                  }
                  className={inputCls}
                >
                  <option value="scheduled">Geplant</option>
                  <option value="draft">Entwurf</option>
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
                  Medien ({composer.media.length}/{FORMATS[composer.format].maxMedia})
                </label>
                <div className="flex flex-wrap gap-2">
                  {composer.media.map((hue, i) => (
                    <div
                      key={i}
                      className={`group/media relative overflow-hidden rounded-xl border border-line ${
                        composer.format === "story" ? "h-24 w-14" : "h-16 w-16"
                      }`}
                      style={{
                        background: `linear-gradient(135deg, hsl(${hue} 55% 55%), hsl(${(hue + 60) % 360} 55% 35%))`,
                      }}
                    >
                      {composer.format === "video" && (
                        <span className="absolute inset-0 flex items-center justify-center text-white/90">
                          ▶
                        </span>
                      )}
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
                      onClick={addMedia}
                      className={`flex items-center justify-center rounded-xl border border-dashed border-line text-lg text-muted transition hover:border-accent hover:text-accent ${
                        composer.format === "story" ? "h-24 w-14" : "h-16 w-16"
                      }`}
                    >
                      +
                    </button>
                  )}
                </div>
                <p className="mt-1.5 text-xs text-muted">
                  Demo-Platzhalter — Upload &amp; Medienbibliothek folgen in Phase 1, KI-Bilder
                  kommen aus dem KI-Studio.
                </p>
              </div>
            )}

            <div className="flex items-center justify-between border-t border-line pt-4">
              <div>
                {composer.id && (
                  <Button
                    variant="danger"
                    onClick={() => {
                      deletePost(composer.id!);
                      setComposer(null);
                    }}
                  >
                    Löschen
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-3">
                {composer.id && <StatusBadge status={composer.status} />}
                <Button variant="ghost" onClick={() => setComposer(null)}>
                  Abbrechen
                </Button>
                <Button
                  onClick={submit}
                  disabled={!composer.body.trim() || composer.accountIds.length === 0}
                >
                  {composer.id ? "Speichern" : "Planen"}
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
