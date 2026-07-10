"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import { PlatformChip, StatusBadge } from "@/components/ui";
import { toDateKey } from "@/lib/types";

export default function DashboardPage() {
  const { posts: allPosts, accounts: allAccounts, clients, selectedClientId, credits, can } =
    useStore();

  // Wie überall: aktiver Kunden-Kontext filtert die Sicht
  const posts = selectedClientId ? allPosts.filter((p) => p.clientId === selectedClientId) : allPosts;
  const accounts = selectedClientId
    ? allAccounts.filter((a) => a.clientId === selectedClientId)
    : allAccounts;
  const activeClient = clients.find((c) => c.id === selectedClientId) ?? null;

  const todayKey = toDateKey(new Date());
  const upcoming = posts
    .filter((p) => p.status === "scheduled" && p.date >= todayKey)
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
    .slice(0, 5);

  const scheduledCount = posts.filter((p) => p.status === "scheduled").length;
  const pendingApprovals = posts.filter((p) => p.approval === "pending").length;

  const stats = [
    { label: "Geplante Posts", value: scheduledCount, href: "/app/planner" },
    { label: "Warten auf Freigabe", value: pendingApprovals, href: "/app/approvals" },
    { label: "Verbundene Accounts", value: accounts.length, href: "/app/accounts" },
    { label: "KI-Credits", value: credits.toLocaleString("de-DE"), href: "/app/ai" },
  ];

  // CRM: anstehende Wiedervorlagen (fällige zuerst)
  const followUps = can("accounts")
    ? clients
        .filter((c) => c.followUpAt !== null)
        .sort((a, b) => (a.followUpAt! < b.followUpAt! ? -1 : 1))
        .slice(0, 5)
    : [];

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Übersicht</h1>
          <p className="mt-1 text-sm text-muted">
            {activeClient
              ? `Der Stand für „${activeClient.name}“.`
              : "Willkommen zurück! Hier ist der Stand deiner Content-Planung."}
          </p>
        </div>
        <Link
          href="/app/planner"
          className="rounded-xl bg-accent px-4 py-2 text-sm font-medium text-accent-contrast transition hover:brightness-110"
        >
          + Neuer Post
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="rounded-2xl border border-line bg-surface p-5 transition hover:border-accent/40"
          >
            <div className="text-3xl font-semibold tracking-tight">{s.value}</div>
            <div className="mt-1 text-sm text-muted">{s.label}</div>
          </Link>
        ))}
      </div>

      <div className={`mt-10 grid gap-6 ${followUps.length > 0 ? "lg:grid-cols-[3fr_2fr]" : ""}`}>
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">
            Als Nächstes geplant
          </h2>
          <div className="overflow-hidden rounded-2xl border border-line bg-surface">
            {upcoming.length === 0 && (
              <div className="p-8 text-center text-sm text-muted">
                Noch nichts geplant.{" "}
                <Link href="/app/planner" className="text-accent-fg hover:underline">
                  Plane deinen ersten Post →
                </Link>
              </div>
            )}
            {upcoming.map((post, i) => {
              const [y, m, d] = post.date.split("-");
              return (
                <Link
                  key={post.id}
                  href="/app/planner"
                  className={`flex items-center gap-4 p-4 transition hover:bg-surface-2 ${
                    i > 0 ? "border-t border-line" : ""
                  }`}
                >
                  <div className="w-24 shrink-0 text-sm">
                    <div className="font-medium">
                      {d}.{m}.{y.slice(2)}
                    </div>
                    <div className="text-muted">{post.time} Uhr</div>
                  </div>
                  <div className="min-w-0 flex-1 truncate text-sm">{post.title || post.body}</div>
                  <div className="flex shrink-0 -space-x-1.5">
                    {post.accountIds.map((id) => {
                      const acc = allAccounts.find((a) => a.id === id);
                      return acc ? <PlatformChip key={id} platform={acc.platform} size={22} /> : null;
                    })}
                  </div>
                  <StatusBadge status={post.status} />
                </Link>
              );
            })}
          </div>
        </div>

        {followUps.length > 0 && (
          <div>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">
              Kunden-Wiedervorlagen
            </h2>
            <div className="overflow-hidden rounded-2xl border border-line bg-surface">
              {followUps.map((c, i) => {
                const due = c.followUpDue;
                return (
                  <Link
                    key={c.id}
                    href={`/app/clients/${c.id}`}
                    className={`flex items-center gap-3 p-4 transition hover:bg-surface-2 ${
                      i > 0 ? "border-t border-line" : ""
                    }`}
                  >
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ background: c.color }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{c.name}</div>
                      <div className="truncate text-xs text-muted">
                        {c.followUpNote || "Beim Kunden melden"}
                      </div>
                    </div>
                    <span
                      className={`shrink-0 rounded-lg px-2 py-1 text-xs font-medium ${
                        due ? "bg-warning/15 text-warning" : "bg-surface-2 text-muted"
                      }`}
                    >
                      {due ? "fällig" : c.followUpAt!.split("-").reverse().join(".")}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-line bg-surface p-6">
          <h3 className="font-semibold">📇 Kunden & CRM</h3>
          <p className="mt-2 text-sm text-muted">
            Stammdaten, Kontakt-Historie und Wiedervorlagen — alles zum Kunden an einem Ort.
          </p>
          <Link
            href="/app/clients"
            className="mt-4 inline-block text-sm font-medium text-accent-fg hover:underline"
          >
            Zu den Kunden →
          </Link>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-6">
          <h3 className="font-semibold">💡 KI-Studio</h3>
          <p className="mt-2 text-sm text-muted">
            Captions, Content-Ideen und Bilder generieren — mit Credits oder eigenem API-Key.
          </p>
          <Link href="/app/ai" className="mt-4 inline-block text-sm font-medium text-accent-fg hover:underline">
            Zum KI-Studio →
          </Link>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-6">
          <h3 className="font-semibold">🔗 Accounts verbinden</h3>
          <p className="mt-2 text-sm text-muted">
            Verbinde beliebig viele Profile und Websites — ganz ohne Account-Limits.
          </p>
          <Link
            href="/app/accounts"
            className="mt-4 inline-block text-sm font-medium text-accent-fg hover:underline"
          >
            Account hinzufügen →
          </Link>
        </div>
      </div>
    </div>
  );
}
