"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { Button, inputCls, Modal, PlatformChip } from "@/components/ui";
import { AD_OBJECTIVES, AD_STATUS_LABELS, AdObjective, toDateKey } from "@/lib/types";

function inTwoWeeks(): string {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  return toDateKey(d);
}

export default function AdsPage() {
  const {
    posts,
    accounts,
    clients,
    selectedClientId,
    adCampaigns: allCampaigns,
    createAdCampaign,
    pauseAdCampaign,
    resumeAdCampaign,
    deleteAdCampaign,
    can,
  } = useStore();

  const manage = can("ads");
  const activeClient = clients.find((c) => c.id === selectedClientId) ?? null;
  const campaigns = selectedClientId
    ? allCampaigns.filter((c) => c.clientId === selectedClientId)
    : allCampaigns;

  // Bewerbbar: veröffentlicht oder geplant, Bild/Video/Karussell, mind. ein IG/FB-Account
  const eligiblePosts = useMemo(
    () =>
      posts.filter(
        (p) =>
          ["published", "scheduled"].includes(p.status) &&
          ["image", "video", "carousel"].includes(p.format) &&
          (!selectedClientId || p.clientId === selectedClientId) &&
          p.accountIds.some((id) => {
            const acc = accounts.find((a) => a.id === id);
            return acc && ["instagram", "facebook"].includes(acc.platform);
          })
      ),
    [posts, accounts, selectedClientId]
  );

  const [open, setOpen] = useState(false);
  const [postId, setPostId] = useState("");
  const [accountId, setAccountId] = useState("");
  const [objective, setObjective] = useState<AdObjective>("reach");
  const [budget, setBudget] = useState("50");
  const [startDate, setStartDate] = useState(toDateKey(new Date()));
  const [endDate, setEndDate] = useState(inTwoWeeks());
  const [saving, setSaving] = useState(false);

  const selectedPost = posts.find((p) => p.id === postId);
  const postAccounts = selectedPost
    ? selectedPost.accountIds
        .map((id) => accounts.find((a) => a.id === id))
        .filter((a): a is NonNullable<typeof a> => !!a && ["instagram", "facebook"].includes(a.platform))
    : [];

  function firstEligibleAccountId(postId: string): string {
    const post = posts.find((p) => p.id === postId);
    const first = post?.accountIds
      .map((aid) => accounts.find((a) => a.id === aid))
      .find((a) => a && ["instagram", "facebook"].includes(a.platform));
    return first?.id ?? "";
  }

  function openDialog() {
    const first = eligiblePosts[0];
    setPostId(first?.id ?? "");
    setAccountId(first ? firstEligibleAccountId(first.id) : "");
    setObjective("reach");
    setBudget("50");
    setStartDate(toDateKey(new Date()));
    setEndDate(inTwoWeeks());
    setOpen(true);
  }

  function pickPost(id: string) {
    setPostId(id);
    setAccountId(firstEligibleAccountId(id));
  }

  async function submit() {
    const budgetNum = Number(budget);
    if (!postId || !accountId || !budgetNum || budgetNum < 5) return;
    setSaving(true);
    const ok = await createAdCampaign({
      postId,
      accountId,
      clientId: selectedClientId,
      objective,
      budgetTotal: budgetNum,
      startDate,
      endDate,
    });
    setSaving(false);
    if (ok) setOpen(false);
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Ads</h1>
          <p className="mt-1 text-sm text-muted">
            {activeClient ? (
              <>Werbeanzeigen von <span className="font-medium text-foreground">{activeClient.name}</span></>
            ) : (
              "Bestehende Beiträge auf Instagram/Facebook bewerben."
            )}{" "}
            — Kennzahlen simuliert, bis eine echte Meta-Ad-Account-Anbindung besteht.
          </p>
        </div>
        {manage && (
          <Button onClick={openDialog} disabled={eligiblePosts.length === 0}>
            + Bewerben
          </Button>
        )}
      </div>

      {campaigns.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line p-10 text-center text-sm text-muted">
          {eligiblePosts.length === 0
            ? "Noch keine bewerbbaren Beiträge — veröffentliche oder plane zuerst einen Bild-/Video-/Karussell-Post auf Instagram oder Facebook."
            : "Noch keine Kampagnen. Bewirb oben deinen ersten Beitrag."}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {campaigns.map((c) => {
            const progress = Math.min(100, Math.round((c.metrics.spend / c.budgetTotal) * 100));
            return (
              <div key={c.id} className="rounded-2xl border border-line bg-surface p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <PlatformChip platform={c.platform} size={28} />
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{c.postBody}</div>
                      <div className="text-xs text-muted">
                        {c.accountHandle} · {AD_OBJECTIVES[c.objective].label} · {c.startDate.split("-").reverse().join(".")}–
                        {c.endDate.split("-").reverse().join(".")}
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span
                      className={`rounded-lg px-2.5 py-1 text-xs font-medium ${
                        c.status === "active"
                          ? "bg-success/15 text-success"
                          : c.status === "paused"
                            ? "bg-warning/15 text-warning"
                            : "bg-surface-2 text-muted"
                      }`}
                    >
                      {AD_STATUS_LABELS[c.status]}
                    </span>
                    {manage && c.status !== "completed" && (
                      <button
                        onClick={() =>
                          c.status === "active" ? pauseAdCampaign(c.id) : resumeAdCampaign(c.id)
                        }
                        className="rounded-lg px-2 py-1 text-xs text-muted transition hover:bg-surface-2 hover:text-foreground"
                      >
                        {c.status === "active" ? "Pausieren" : "Fortsetzen"}
                      </button>
                    )}
                    {manage && (
                      <button
                        onClick={() => {
                          if (confirm("Kampagne wirklich löschen?")) deleteAdCampaign(c.id);
                        }}
                        aria-label="Kampagne löschen"
                        className="rounded-lg px-2 py-1 text-sm text-muted transition hover:bg-danger/15 hover:text-danger"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-4">
                  <div className="mb-1 flex items-center justify-between text-xs text-muted">
                    <span>
                      {c.metrics.spend.toLocaleString("de-DE", { style: "currency", currency: "EUR" })}{" "}
                      von {c.budgetTotal.toLocaleString("de-DE", { style: "currency", currency: "EUR" })}
                    </span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
                    <div className="h-full rounded-full bg-accent" style={{ width: `${progress}%` }} />
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
                  <Metric label="Impressionen" value={c.metrics.impressions.toLocaleString("de-DE")} />
                  <Metric label="Reichweite" value={c.metrics.reach.toLocaleString("de-DE")} />
                  <Metric
                    label={c.objective === "engagement" ? "Interaktionen" : "Klicks"}
                    value={c.metrics.clicks.toLocaleString("de-DE")}
                  />
                  <Metric label="CTR" value={`${c.metrics.ctr.toLocaleString("de-DE")}%`} />
                  {c.objective === "traffic" && c.metrics.roas !== null ? (
                    <Metric label="ROAS" value={`${c.metrics.roas.toLocaleString("de-DE")}×`} accent />
                  ) : (
                    <Metric
                      label="Kosten/Ergebnis"
                      value={c.metrics.costPerResult.toLocaleString("de-DE", {
                        style: "currency",
                        currency: "EUR",
                      })}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {open && (
        <Modal title="Beitrag bewerben" onClose={() => setOpen(false)} wide>
          <div className="flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Beitrag</label>
              <select value={postId} onChange={(e) => pickPost(e.target.value)} className={inputCls}>
                {eligiblePosts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {(p.title || p.body).slice(0, 60)}
                  </option>
                ))}
              </select>
            </div>

            {postAccounts.length > 0 && (
              <div>
                <label className="mb-1.5 block text-sm font-medium">Account</label>
                <div className="flex flex-wrap gap-2">
                  {postAccounts.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => setAccountId(a.id)}
                      className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 text-sm transition ${
                        accountId === a.id
                          ? "border-accent bg-accent-soft text-foreground"
                          : "border-line text-muted hover:border-accent/40"
                      }`}
                    >
                      <PlatformChip platform={a.platform} size={18} />
                      {a.handle}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-medium">Ziel</label>
              <div className="grid gap-2 sm:grid-cols-3">
                {(Object.keys(AD_OBJECTIVES) as AdObjective[]).map((o) => (
                  <button
                    key={o}
                    onClick={() => setObjective(o)}
                    className={`rounded-xl border p-3 text-left text-sm transition ${
                      objective === o
                        ? "border-accent bg-accent-soft"
                        : "border-line text-muted hover:border-accent/40"
                    }`}
                  >
                    <div className="font-medium text-foreground">{AD_OBJECTIVES[o].label}</div>
                    <div className="mt-0.5 text-xs text-muted">{AD_OBJECTIVES[o].hint}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Budget (€)</label>
                <input
                  type="number"
                  min={5}
                  step={5}
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Start</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Ende</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={inputCls}
                />
              </div>
            </div>

            <p className="text-xs text-muted">
              Demo-Modus: Kennzahlen werden simuliert. Mit echter Meta-Marketing-API-Anbindung
              (nach App-Review) laufen dieselbe Anzeige und Aktionen gegen echte Insights.
            </p>

            <div className="flex justify-end gap-3 border-t border-line pt-4">
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Abbrechen
              </Button>
              <Button
                onClick={submit}
                disabled={saving || !postId || !accountId || !Number(budget) || Number(budget) < 5}
              >
                {saving ? "Startet …" : "Kampagne starten"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Metric({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-xl bg-surface-2 px-3 py-2">
      <div className="text-xs text-muted">{label}</div>
      <div className={`mt-0.5 text-sm font-semibold ${accent ? "text-accent-fg" : ""}`}>{value}</div>
    </div>
  );
}
