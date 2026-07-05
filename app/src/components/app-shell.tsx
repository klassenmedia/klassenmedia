"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { StoreProvider, useStore } from "@/lib/store";
import type { WorkspaceBundle } from "@/lib/data";
import { PLANS } from "@/lib/types";
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
    plan,
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
          <span className="text-muted">Tarif</span>
          <span className="font-semibold text-accent-fg">{PLANS[plan].name}</span>
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

export function AppShell({
  initial,
  children,
}: {
  initial: WorkspaceBundle;
  children: React.ReactNode;
}) {
  return (
    <StoreProvider initial={initial}>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="min-w-0 flex-1 px-8 py-8">{children}</main>
      </div>
      <ErrorToast />
    </StoreProvider>
  );
}
