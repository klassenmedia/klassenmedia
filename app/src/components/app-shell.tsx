"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { StoreProvider, useStore } from "@/lib/store";
import type { WorkspaceBundle } from "@/lib/data";
import { ROLE_LABELS } from "@/lib/permissions";
import { ThemeToggle } from "@/components/theme-toggle";
import { logout } from "@/lib/auth-actions";

const NAV = [
  {
    href: "/app",
    label: "Übersicht",
    icon: (
      <path d="M2.5 8L8 3l5.5 5M4 7v5.5h8V7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    ),
  },
  {
    href: "/app/planner",
    label: "Planer",
    icon: (
      <>
        <rect x="2.5" y="3.5" width="11" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.4" fill="none" />
        <path d="M2.5 6.5h11M5.5 2v2.5M10.5 2v2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </>
    ),
  },
  {
    href: "/app/board",
    label: "Board",
    icon: (
      <>
        <rect x="2.5" y="2.5" width="3" height="11" rx="1" stroke="currentColor" strokeWidth="1.4" fill="none" />
        <rect x="6.5" y="2.5" width="3" height="7.5" rx="1" stroke="currentColor" strokeWidth="1.4" fill="none" />
        <rect x="10.5" y="2.5" width="3" height="9" rx="1" stroke="currentColor" strokeWidth="1.4" fill="none" />
      </>
    ),
  },
  {
    href: "/app/analytics",
    label: "Analytics",
    icon: (
      <path d="M2.5 13.5V2.5M2.5 13.5h11M5 11V8M8 11V5M11 11V6.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    ),
  },
  {
    href: "/app/ads",
    label: "Ads",
    icon: (
      <>
        <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.4" fill="none" />
        <path d="M8 5v3l2 1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </>
    ),
  },
  {
    href: "/app/approvals",
    label: "Freigaben",
    icon: (
      <path d="M2.5 8.5l3 3 8-8M6.5 13.5h5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    ),
  },
  {
    href: "/app/inbox",
    label: "Inbox",
    icon: (
      <path d="M2.5 3.5h11v7.5h-5L5.5 14v-3h-3V3.5zM5 6h6M5 8.5h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    ),
  },
  {
    href: "/app/clients",
    label: "Kunden",
    icon: (
      <>
        <rect x="2.5" y="5" width="11" height="8.5" rx="1.5" stroke="currentColor" strokeWidth="1.4" fill="none" />
        <path d="M5.5 5V3.8c0-.7.5-1.3 1.2-1.3h2.6c.7 0 1.2.6 1.2 1.3V5" stroke="currentColor" strokeWidth="1.4" fill="none" />
      </>
    ),
  },
  {
    href: "/app/accounts",
    label: "Accounts",
    icon: (
      <>
        <circle cx="8" cy="5.5" r="2.5" stroke="currentColor" strokeWidth="1.4" fill="none" />
        <path d="M3 13.5c.6-2.3 2.6-3.5 5-3.5s4.4 1.2 5 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" fill="none" />
      </>
    ),
  },
  {
    href: "/app/team",
    label: "Team",
    icon: (
      <>
        <circle cx="5.5" cy="6" r="2" stroke="currentColor" strokeWidth="1.3" fill="none" />
        <circle cx="11" cy="6.5" r="1.6" stroke="currentColor" strokeWidth="1.3" fill="none" />
        <path d="M2 13c.4-1.8 1.9-2.8 3.5-2.8S8.6 11.2 9 13M9.5 10.6c1.3-.2 3 .5 3.4 2.4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" fill="none" />
      </>
    ),
  },
  {
    href: "/app/ai",
    label: "KI-Studio",
    icon: (
      <path d="M8 2.5l1.2 3.3 3.3 1.2-3.3 1.2L8 11.5 6.8 8.2 3.5 7l3.3-1.2L8 2.5zM12.5 11l.6 1.4 1.4.6-1.4.6-.6 1.4-.6-1.4-1.4-.6 1.4-.6.6-1.4z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" fill="none" />
    ),
  },
  {
    href: "/app/billing",
    label: "Abo & Zahlung",
    icon: (
      <>
        <rect x="2" y="4" width="12" height="8.5" rx="1.5" stroke="currentColor" strokeWidth="1.4" fill="none" />
        <path d="M2 7h12" stroke="currentColor" strokeWidth="1.4" />
      </>
    ),
  },
];

/**
 * Erinnerungs-Modus (Reels): statt Push-Benachrichtigungen (keine native App)
 * eine persistente Banner-Erinnerung auf jeder Seite, sobald ein Post fällig
 * ist, dessen Sound manuell in der Instagram-App gewählt werden muss.
 */
function RemindersBanner() {
  const { posts, accounts, markReminderPosted } = useStore();
  const due = posts.filter((p) => p.reminderDue);
  if (due.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 border-b border-warning/40 bg-warning/10 px-8 py-3">
      {due.slice(0, 3).map((p) => {
        const acc = accounts.find((id) => p.accountIds.includes(id.id));
        return (
          <div key={p.id} className="flex flex-wrap items-center gap-3 text-sm">
            <span className="shrink-0">🔔</span>
            <span className="min-w-0 flex-1 truncate">
              Jetzt posten: <strong className="font-medium">{p.title || p.body}</strong>
              {acc ? ` auf ${acc.handle}` : ""} — Trending-Sound in der App wählen.
            </span>
            <button
              onClick={() => markReminderPosted(p.id)}
              className="shrink-0 rounded-lg border border-warning/40 px-2.5 py-1 text-xs font-medium text-warning transition hover:bg-warning/15"
            >
              ✓ Ich habe gepostet
            </button>
          </div>
        );
      })}
      {due.length > 3 && (
        <div className="text-xs text-muted">+{due.length - 3} weitere Erinnerungen</div>
      )}
    </div>
  );
}

function ErrorToast() {
  const { error, clearError } = useStore();
  if (!error) return null;
  return (
    <div className="fixed bottom-5 left-1/2 z-[60] -translate-x-1/2">
      <button
        onClick={clearError}
        className="flex items-center gap-3 rounded-xl border border-danger/40 bg-surface px-4 py-2.5 text-sm text-danger shadow-xl"
      >
        {error}
        <span className="text-xs text-muted">Schließen</span>
      </button>
    </div>
  );
}

function Sidebar() {
  const pathname = usePathname();
  const {
    credits,
    user,
    comments,
    posts,
    role,
    workspaceId,
    workspaces,
    switchWorkspace,
  } = useStore();
  const openComments = comments.length;
  const openApprovals = posts.filter((p) => p.approval === "pending").length;
  const badges: Record<string, number> = {
    "/app/inbox": openComments,
    "/app/approvals": openApprovals,
  };

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-line bg-surface">
      <div className="flex items-center justify-between px-5 py-5">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent text-sm font-bold text-accent-contrast">
            P
          </span>
          <span className="text-lg font-semibold tracking-tight">Planbar</span>
        </Link>
        <ThemeToggle />
      </div>

      {/* Workspace-Wechsler + Rolle */}
      <div className="px-3 pb-2">
        <div className="rounded-xl border border-line bg-surface-2 p-2.5">
          {workspaces.length > 1 ? (
            <select
              value={workspaceId}
              onChange={(e) => switchWorkspace(e.target.value)}
              aria-label="Workspace wechseln"
              className="w-full rounded-lg border border-line bg-surface px-2 py-1.5 text-sm font-medium"
            >
              {workspaces.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          ) : (
            <div className="truncate px-1 text-sm font-medium">{workspaces[0]?.name}</div>
          )}
          <div className="mt-1.5 px-1 text-[11px] text-muted">
            Deine Rolle: <span className="font-medium text-accent-fg">{ROLE_LABELS[role]}</span>
          </div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3">
        {NAV.map((item) => {
          const active =
            item.href === "/app"
              ? pathname === "/app"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? "bg-accent-soft text-accent-fg"
                  : "text-muted hover:bg-surface-2 hover:text-foreground"
              }`}
            >
              <svg width="16" height="16" viewBox="0 0 16 16">{item.icon}</svg>
              {item.label}
              {badges[item.href] > 0 && (
                <span className="ml-auto rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-semibold text-accent-fg">
                  {badges[item.href]}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="m-3 rounded-xl border border-line bg-surface-2 p-4 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-muted">Plan</span>
          <span className="font-semibold text-accent-fg">Komplett</span>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-muted">KI-Credits</span>
          <span className="font-semibold">{credits.toLocaleString("de-DE")}</span>
        </div>
        <Link
          href="/app/billing"
          className="mt-3 block rounded-lg bg-accent px-3 py-1.5 text-center font-medium text-accent-contrast transition hover:brightness-110"
        >
          Verwalten
        </Link>
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-line px-5 py-3.5">
        <div className="min-w-0">
          <div className="truncate text-xs font-medium">{user.name}</div>
          <div className="truncate text-[11px] text-muted">{user.email}</div>
        </div>
        <form action={logout}>
          <button
            className="rounded-lg px-2 py-1 text-[11px] font-medium text-muted transition hover:bg-surface-2 hover:text-foreground"
            title="Abmelden"
          >
            Abmelden
          </button>
        </form>
      </div>
    </aside>
  );
}

/** Prominenter Kunden-Kontext: „Du arbeitest bei Kunde X" — scoped die ganze App. */
function ClientBar() {
  const { clients, selectedClientId, setSelectedClient } = useStore();
  const [open, setOpen] = useState(false);
  const active = clients.find((c) => c.id === selectedClientId) ?? null;

  if (clients.length === 0) {
    return (
      <div className="flex items-center gap-3 border-b border-line bg-surface px-8 py-3 text-sm">
        <span className="text-muted">Noch keine Kunden angelegt.</span>
        <Link href="/app/clients" className="font-medium text-accent-fg hover:underline">
          + Ersten Kunden anlegen
        </Link>
      </div>
    );
  }

  return (
    <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-line bg-surface/95 px-8 py-2.5 backdrop-blur">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">Kunde</span>
      <div className="relative">
        <button
          data-testid="client-bar-trigger"
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-2 rounded-xl border border-line bg-surface-2 px-3 py-1.5 text-sm font-semibold transition hover:border-accent/40"
        >
          {active ? (
            <>
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: active.color }} />
              {active.name}
            </>
          ) : (
            "Alle Kunden"
          )}
          <svg width="12" height="12" viewBox="0 0 12 12" className="text-muted">
            <path d="M3 4.5L6 7.5l3-3" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <div
              data-testid="client-bar-menu"
              className="absolute left-0 top-full z-20 mt-1 max-h-80 w-64 overflow-auto rounded-xl border border-line bg-surface p-1 shadow-xl"
            >
              <button
                data-testid="client-bar-option-all"
                onClick={() => {
                  setSelectedClient(null);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm ${
                  !selectedClientId ? "bg-accent-soft text-accent-fg" : "hover:bg-surface-2"
                }`}
              >
                Alle Kunden <span className="ml-auto text-xs text-muted">Übersicht</span>
              </button>
              {clients.map((c) => (
                <button
                  key={c.id}
                  data-testid={`client-bar-option-${c.id}`}
                  data-client-name={c.name}
                  onClick={() => {
                    setSelectedClient(c.id);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm ${
                    selectedClientId === c.id ? "bg-accent-soft text-accent-fg" : "hover:bg-surface-2"
                  }`}
                >
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.color }} />
                  {c.name}
                </button>
              ))}
              <Link
                href="/app/clients"
                onClick={() => setOpen(false)}
                className="mt-1 block border-t border-line px-3 py-2 text-xs text-muted transition hover:text-foreground"
              >
                + Kunde anlegen / verwalten
              </Link>
            </div>
          </>
        )}
      </div>
      <span className="ml-auto text-xs text-muted">
        {active ? `Du arbeitest nur bei „${active.name}“` : "Übersicht über alle Kunden"}
      </span>
    </div>
  );
}

export function AppShell({
  initial,
  initialClientId,
  children,
}: {
  initial: WorkspaceBundle;
  initialClientId?: string | null;
  children: React.ReactNode;
}) {
  return (
    <StoreProvider initial={initial} initialClientId={initialClientId}>
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <ClientBar />
          <RemindersBanner />
          <main className="min-w-0 flex-1 px-8 py-8">{children}</main>
        </div>
      </div>
      <ErrorToast />
    </StoreProvider>
  );
}
