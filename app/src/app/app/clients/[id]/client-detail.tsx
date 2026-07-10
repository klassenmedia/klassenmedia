"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { Button, inputCls, PlatformChip } from "@/components/ui";
import {
  INTERACTION_LABELS,
  toDateKey,
  type ClientDetail,
  type InteractionKind,
} from "@/lib/types";
import {
  addContactAction,
  addInteractionAction,
  addTaskAction,
  deleteContactAction,
  deleteInteractionAction,
  deleteTaskAction,
  setFollowUpAction,
  toggleTaskAction,
  updateClientProfileAction,
  type CrmResult,
} from "@/lib/crm-actions";

export function ClientDetailView({
  initial,
  canEdit,
}: {
  initial: ClientDetail;
  canEdit: boolean;
}) {
  const router = useRouter();
  const { setSelectedClient } = useStore();
  const [detail, setDetail] = useState<ClientDetail>(initial);
  const [err, setErr] = useState<string | null>(null);

  // Stammdaten
  const [company, setCompany] = useState(initial.company ?? "");
  const [website, setWebsite] = useState(initial.website ?? "");
  const [notes, setNotes] = useState(initial.notes ?? "");
  const [savingProfile, setSavingProfile] = useState(false);

  // Marke & Strategie
  const [goals, setGoals] = useState(initial.goals ?? "");
  const [audience, setAudience] = useState(initial.audience ?? "");
  const [topics, setTopics] = useState(initial.topics ?? "");
  const [brandColors, setBrandColors] = useState(initial.brandColors ?? "");
  const [fonts, setFonts] = useState(initial.fonts ?? "");
  const [hashtags, setHashtags] = useState(initial.hashtags ?? "");
  const [savingBrand, setSavingBrand] = useState(false);

  // Ansprechpartner
  const [cName, setCName] = useState("");
  const [cRole, setCRole] = useState("");
  const [cEmail, setCEmail] = useState("");
  const [cPhone, setCPhone] = useState("");

  // Aufgaben
  const [tTitle, setTTitle] = useState("");
  const [tDue, setTDue] = useState("");

  // Kontakt-Historie
  const [iKind, setIKind] = useState<InteractionKind>("call");
  const [iText, setIText] = useState("");
  const [iDate, setIDate] = useState(toDateKey(new Date()));

  // Wiedervorlage
  const [fuDate, setFuDate] = useState(initial.followUpAt ?? "");
  const [fuNote, setFuNote] = useState(initial.followUpNote ?? "");
  const [savingFu, setSavingFu] = useState(false);

  function apply(res: CrmResult): boolean {
    if (res.detail) setDetail(res.detail);
    if (!res.ok) {
      setErr(res.error ?? "Fehler");
      return false;
    }
    setErr(null);
    return true;
  }

  // Ein Speichern für das ganze Profil (sonst würden fehlende Felder genullt)
  async function saveProfile(which: "profile" | "brand") {
    if (which === "brand") setSavingBrand(true);
    else setSavingProfile(true);
    apply(
      await updateClientProfileAction(detail.id, {
        company,
        website,
        notes,
        goals,
        audience,
        topics,
        brandColors,
        fonts,
        hashtags,
      })
    );
    setSavingProfile(false);
    setSavingBrand(false);
  }

  async function addContact() {
    if (!cName.trim()) return;
    const ok = apply(
      await addContactAction(detail.id, {
        name: cName.trim(),
        role: cRole.trim() || undefined,
        email: cEmail.trim() || undefined,
        phone: cPhone.trim() || undefined,
      })
    );
    if (ok) {
      setCName("");
      setCRole("");
      setCEmail("");
      setCPhone("");
    }
  }

  async function addTask() {
    if (!tTitle.trim()) return;
    const ok = apply(
      await addTaskAction(detail.id, { title: tTitle.trim(), dueDate: tDue || undefined })
    );
    if (ok) {
      setTTitle("");
      setTDue("");
    }
  }

  async function addInteraction() {
    if (!iText.trim()) return;
    const ok = apply(
      await addInteractionAction(detail.id, {
        kind: iKind,
        text: iText.trim(),
        happenedAt: iDate || undefined,
      })
    );
    if (ok) {
      setIText("");
      setIDate(toDateKey(new Date()));
    }
  }

  async function saveFollowUp(date: string | null) {
    setSavingFu(true);
    const ok = apply(
      await setFollowUpAction(detail.id, { date, note: date ? fuNote.trim() || undefined : undefined })
    );
    setSavingFu(false);
    if (ok && !date) {
      setFuDate("");
      setFuNote("");
    }
  }

  function openInContext() {
    setSelectedClient(detail.id);
    router.push("/app/planner");
  }

  const openTasks = detail.tasks.filter((t) => !t.done).length;

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/app/clients" className="text-sm text-muted transition hover:text-foreground">
        ← Alle Kunden
      </Link>

      <div className="mt-3 mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="h-9 w-9 rounded-xl" style={{ background: detail.color }} />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{detail.name}</h1>
            <p className="text-sm text-muted">
              {detail.accounts.length} Accounts · {detail.postCount} Posts · {openTasks} offene Aufgaben
            </p>
          </div>
        </div>
        <Button variant="ghost" onClick={openInContext}>
          Im Kontext öffnen →
        </Button>
      </div>

      {err && (
        <div className="mb-4 rounded-xl border border-danger/40 bg-danger/10 px-4 py-2.5 text-sm text-danger">
          {err}
        </div>
      )}

      {/* Wiedervorlage */}
      {(() => {
        const due = detail.followUpAt !== null && detail.followUpAt <= toDateKey(new Date());
        return (
          <section
            className={`mb-6 rounded-2xl border p-6 ${
              due ? "border-warning/50 bg-warning/10" : "border-line bg-surface"
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-semibold">🔔 Wiedervorlage</h2>
              {detail.followUpAt ? (
                <span className={`text-sm ${due ? "font-medium text-warning" : "text-muted"}`}>
                  {due ? "Fällig seit" : "Wieder melden am"}{" "}
                  {detail.followUpAt.split("-").reverse().join(".")}
                  {detail.followUpNote ? ` — ${detail.followUpNote}` : ""}
                </span>
              ) : (
                <span className="text-sm text-muted">Keine Wiedervorlage gesetzt.</span>
              )}
            </div>
            {canEdit && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <input
                  type="date"
                  value={fuDate}
                  onChange={(e) => setFuDate(e.target.value)}
                  aria-label="Wiedervorlage-Datum"
                  className="rounded-xl border border-line bg-surface px-3 py-2 text-sm"
                />
                <input
                  value={fuNote}
                  onChange={(e) => setFuNote(e.target.value)}
                  placeholder="Worum geht es? (z. B. Angebot nachfassen)"
                  className={`${inputCls} min-w-52 flex-1`}
                />
                <Button
                  onClick={() => saveFollowUp(fuDate)}
                  disabled={!fuDate || savingFu}
                  className="shrink-0"
                >
                  {savingFu ? "Speichert …" : "Setzen"}
                </Button>
                {detail.followUpAt && (
                  <Button variant="ghost" onClick={() => saveFollowUp(null)} disabled={savingFu} className="shrink-0">
                    ✓ Erledigt
                  </Button>
                )}
              </div>
            )}
            <p className="mt-2 text-xs text-muted">
              Am gesetzten Datum erinnert dich Planbar auf jeder Seite, dich bei diesem Kunden zu melden.
            </p>
          </section>
        );
      })()}

      {/* Stammdaten */}
      <section className="mb-6 rounded-2xl border border-line bg-surface p-6">
        <h2 className="font-semibold">Stammdaten</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Firma</label>
            <input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              disabled={!canEdit}
              placeholder="z. B. Bäckerei Berger GmbH"
              className={inputCls}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Website</label>
            <input
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              disabled={!canEdit}
              placeholder="https://…"
              className={inputCls}
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="mb-1.5 block text-sm font-medium">
            Notizen <span className="text-muted">· Briefing, Absprachen, Do&apos;s &amp; Don&apos;ts</span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={!canEdit}
            rows={4}
            placeholder="Wichtige Infos zum Kunden …"
            className={inputCls}
          />
        </div>
        {canEdit && (
          <div className="mt-4">
            <Button onClick={() => saveProfile("profile")} disabled={savingProfile}>
              {savingProfile ? "Speichert …" : "Stammdaten speichern"}
            </Button>
          </div>
        )}
      </section>

      {/* Marke & Strategie */}
      <section className="mb-6 rounded-2xl border border-line bg-surface p-6">
        <h2 className="font-semibold">Marke &amp; Strategie</h2>
        <p className="mt-1 text-sm text-muted">
          Das Wichtigste auf einen Blick — damit jeder im Team konsistent für diesen Kunden postet.
        </p>
        <div className="mt-4 grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Ziele</label>
              <textarea value={goals} onChange={(e) => setGoals(e.target.value)} disabled={!canEdit} rows={2} placeholder="Was soll erreicht werden?" className={inputCls} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Zielgruppe</label>
              <textarea value={audience} onChange={(e) => setAudience(e.target.value)} disabled={!canEdit} rows={2} placeholder="Wen sprechen wir an?" className={inputCls} />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Kernthemen</label>
            <textarea value={topics} onChange={(e) => setTopics(e.target.value)} disabled={!canEdit} rows={2} placeholder="Worum geht es inhaltlich?" className={inputCls} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Farben</label>
              <input value={brandColors} onChange={(e) => setBrandColors(e.target.value)} disabled={!canEdit} placeholder="z. B. #2563eb, Gold" className={inputCls} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Schriften</label>
              <input value={fonts} onChange={(e) => setFonts(e.target.value)} disabled={!canEdit} placeholder="z. B. Inter, Playfair" className={inputCls} />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Standard-Hashtags</label>
            <textarea value={hashtags} onChange={(e) => setHashtags(e.target.value)} disabled={!canEdit} rows={2} placeholder="#backstube #regional …" className={inputCls} />
          </div>
        </div>
        {canEdit && (
          <div className="mt-4">
            <Button onClick={() => saveProfile("brand")} disabled={savingBrand}>
              {savingBrand ? "Speichert …" : "Marke & Strategie speichern"}
            </Button>
          </div>
        )}
      </section>

      {/* Ansprechpartner */}
      <section className="mb-6 rounded-2xl border border-line bg-surface p-6">
        <h2 className="font-semibold">Ansprechpartner ({detail.contacts.length})</h2>
        <div className="mt-4 flex flex-col gap-2">
          {detail.contacts.length === 0 && (
            <p className="text-sm text-muted">Noch keine Ansprechpartner hinterlegt.</p>
          )}
          {detail.contacts.map((k) => (
            <div
              key={k.id}
              className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-surface-2 px-3 py-2.5"
            >
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium">
                  {k.name}
                  {k.role && <span className="ml-1.5 text-xs text-muted">· {k.role}</span>}
                </div>
                <div className="truncate text-xs text-muted">
                  {[k.email, k.phone].filter(Boolean).join(" · ") || "—"}
                </div>
              </div>
              {canEdit && (
                <button
                  onClick={async () => apply(await deleteContactAction(k.id))}
                  aria-label="Ansprechpartner entfernen"
                  className="rounded-lg px-2 py-1 text-sm text-muted transition hover:bg-danger/15 hover:text-danger"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
        {canEdit && (
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <input value={cName} onChange={(e) => setCName(e.target.value)} placeholder="Name*" className={inputCls} />
            <input value={cRole} onChange={(e) => setCRole(e.target.value)} placeholder="Rolle (z. B. Marketing)" className={inputCls} />
            <input value={cEmail} onChange={(e) => setCEmail(e.target.value)} placeholder="E-Mail" className={inputCls} />
            <input value={cPhone} onChange={(e) => setCPhone(e.target.value)} placeholder="Telefon" className={inputCls} />
            <div className="sm:col-span-2">
              <Button onClick={addContact} disabled={!cName.trim()}>
                + Ansprechpartner
              </Button>
            </div>
          </div>
        )}
      </section>

      {/* Kontakt-Historie */}
      <section className="mb-6 rounded-2xl border border-line bg-surface p-6">
        <h2 className="font-semibold">Kontakt-Historie ({detail.interactions.length})</h2>
        <p className="mt-1 text-sm text-muted">
          Telefonate, E-Mails und Meetings protokollieren — damit jeder im Team weiß, was zuletzt
          besprochen wurde.
        </p>

        {canEdit && (
          <div className="mt-4 rounded-xl border border-line bg-surface-2 p-3.5">
            <div className="flex flex-wrap items-center gap-2">
              {(Object.keys(INTERACTION_LABELS) as InteractionKind[]).map((k) => (
                <button
                  key={k}
                  onClick={() => setIKind(k)}
                  className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-sm transition ${
                    iKind === k
                      ? "border-accent bg-accent-soft text-foreground"
                      : "border-line text-muted hover:border-accent/40"
                  }`}
                >
                  {INTERACTION_LABELS[k].icon} {INTERACTION_LABELS[k].label}
                </button>
              ))}
              <input
                type="date"
                value={iDate}
                onChange={(e) => setIDate(e.target.value)}
                aria-label="Datum des Kontakts"
                className="ml-auto rounded-xl border border-line bg-surface px-3 py-1.5 text-sm"
              />
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <textarea
                value={iText}
                onChange={(e) => setIText(e.target.value)}
                rows={2}
                placeholder={
                  iKind === "call"
                    ? "Worüber habt ihr telefoniert? Ergebnis, nächste Schritte …"
                    : "Was wurde besprochen / vereinbart?"
                }
                className={`${inputCls} flex-1`}
              />
              <Button onClick={addInteraction} disabled={!iText.trim()} className="shrink-0 self-end">
                + Eintrag
              </Button>
            </div>
          </div>
        )}

        <div className="mt-4 flex flex-col gap-2">
          {detail.interactions.length === 0 && (
            <p className="text-sm text-muted">Noch keine Einträge — protokolliere oben den ersten Kontakt.</p>
          )}
          {detail.interactions.map((entry) => (
            <div key={entry.id} className="group/entry flex gap-3 rounded-xl px-2 py-2 hover:bg-surface-2">
              <span className="mt-0.5 shrink-0 text-base" title={INTERACTION_LABELS[entry.kind].label}>
                {INTERACTION_LABELS[entry.kind].icon}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-xs text-muted">
                  {INTERACTION_LABELS[entry.kind].label} · {entry.happenedAt.split("-").reverse().join(".")} ·{" "}
                  {entry.createdBy}
                </div>
                <p className="mt-0.5 whitespace-pre-wrap text-sm">{entry.text}</p>
              </div>
              {canEdit && (
                <button
                  onClick={async () => apply(await deleteInteractionAction(entry.id))}
                  aria-label="Eintrag löschen"
                  className="h-fit rounded-lg px-2 py-0.5 text-sm text-muted opacity-0 transition group-hover/entry:opacity-100 hover:bg-danger/15 hover:text-danger"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Aufgaben */}
      <section className="mb-6 rounded-2xl border border-line bg-surface p-6">
        <h2 className="font-semibold">Aufgaben ({openTasks} offen)</h2>
        <div className="mt-4 flex flex-col gap-1.5">
          {detail.tasks.length === 0 && <p className="text-sm text-muted">Keine Aufgaben.</p>}
          {detail.tasks.map((t) => (
            <div key={t.id} className="flex items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-surface-2">
              <input
                type="checkbox"
                checked={t.done}
                disabled={!canEdit}
                onChange={async () => apply(await toggleTaskAction(t.id))}
                className="h-4 w-4 accent-[var(--accent)]"
              />
              <span className={`flex-1 text-sm ${t.done ? "text-muted line-through" : ""}`}>{t.title}</span>
              {t.dueDate && (
                <span className="text-xs text-muted">bis {t.dueDate.split("-").reverse().join(".")}</span>
              )}
              {canEdit && (
                <button
                  onClick={async () => apply(await deleteTaskAction(t.id))}
                  aria-label="Aufgabe löschen"
                  className="rounded-lg px-2 py-0.5 text-sm text-muted transition hover:bg-danger/15 hover:text-danger"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
        {canEdit && (
          <div className="mt-4 flex flex-wrap gap-2">
            <input
              value={tTitle}
              onChange={(e) => setTTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTask()}
              placeholder="Neue Aufgabe …"
              className={`${inputCls} min-w-52 flex-1`}
            />
            <input
              type="date"
              value={tDue}
              onChange={(e) => setTDue(e.target.value)}
              className="rounded-xl border border-line bg-surface px-3 py-2 text-sm"
            />
            <Button onClick={addTask} disabled={!tTitle.trim()} className="shrink-0">
              + Aufgabe
            </Button>
          </div>
        )}
      </section>

      {/* Accounts */}
      <section className="rounded-2xl border border-line bg-surface p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Accounts ({detail.accounts.length})</h2>
          <Link href="/app/accounts" className="text-sm text-accent-fg hover:underline">
            Verwalten
          </Link>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {detail.accounts.length === 0 ? (
            <p className="text-sm text-muted">Noch keine Accounts zugeordnet.</p>
          ) : (
            detail.accounts.map((a) => (
              <span key={a.id} className="flex items-center gap-1.5 rounded-lg border border-line px-2 py-1 text-xs">
                <PlatformChip platform={a.platform} size={16} /> {a.handle}
              </span>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
