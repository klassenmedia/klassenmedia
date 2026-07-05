"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { Button, inputCls } from "@/components/ui";
import {
  ASSIGNABLE_ROLES,
  ROLE_HINTS,
  ROLE_LABELS,
  type Role,
} from "@/lib/permissions";

function RoleBadge({ role }: { role: Role }) {
  const tone =
    role === "owner"
      ? "bg-accent text-accent-contrast"
      : role === "admin"
        ? "bg-accent-soft text-accent-fg"
        : "bg-surface-2 text-muted";
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${tone}`}>
      {ROLE_LABELS[role]}
    </span>
  );
}

export default function TeamPage() {
  const {
    workspaceName,
    role,
    members,
    teamInvites,
    can,
    inviteMember,
    revokeTeamInvite,
    changeMemberRole,
    removeMember,
    leaveWorkspace,
  } = useStore();

  const manage = can("team");
  const [email, setEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>("editor");
  const [inviting, setInviting] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  async function sendInvite() {
    if (!email.trim()) return;
    setInviting(true);
    const ok = await inviteMember(email.trim(), inviteRole);
    setInviting(false);
    if (ok) {
      setEmail("");
      setInviteRole("editor");
    }
  }

  function copyLink(token: string) {
    const link = `${window.location.origin}/invite/${token}`;
    navigator.clipboard?.writeText(link).catch(() => {});
    setCopied(token);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Team</h1>
        <p className="mt-1 text-sm text-muted">
          Mitglieder von <strong className="text-foreground">{workspaceName}</strong> und ihre
          Rollen. Deine Rolle: <RoleBadge role={role} />
        </p>
      </div>

      {/* Mitglieder */}
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">
        Mitglieder ({members.length})
      </h2>
      <div className="overflow-hidden rounded-2xl border border-line bg-surface">
        {members.map((m, i) => (
          <div
            key={m.id}
            className={`flex flex-wrap items-center gap-3 p-4 ${i > 0 ? "border-t border-line" : ""}`}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-sm font-semibold text-accent-fg">
              {m.name.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">
                {m.name}
                {m.isSelf && <span className="ml-1.5 text-xs text-muted">(du)</span>}
              </div>
              <div className="truncate text-xs text-muted">{m.email} · seit {m.since}</div>
            </div>

            {manage && !m.isSelf && m.role !== "owner" ? (
              <div className="flex items-center gap-2">
                <select
                  value={m.role}
                  onChange={(e) => changeMemberRole(m.id, e.target.value as Role)}
                  className="rounded-lg border border-line bg-surface px-2 py-1 text-xs"
                >
                  {ASSIGNABLE_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => removeMember(m.id)}
                  aria-label="Mitglied entfernen"
                  className="rounded-lg px-2 py-1 text-sm text-muted transition hover:bg-danger/15 hover:text-danger"
                >
                  ×
                </button>
              </div>
            ) : (
              <RoleBadge role={m.role} />
            )}
          </div>
        ))}
      </div>

      {/* Einladen */}
      {manage && (
        <div className="mt-8 rounded-2xl border border-line bg-surface p-6">
          <h2 className="font-semibold">Mitglied einladen</h2>
          <p className="mt-1 text-sm text-muted">
            Wir erzeugen einen Einladungslink. Sende ihn an die Person — sie tritt nach
            Login/Registrierung automatisch mit der gewählten Rolle bei.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="kollege@firma.de"
              className={`${inputCls} min-w-52 flex-1`}
            />
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as Role)}
              className="rounded-xl border border-line bg-surface px-3 py-2 text-sm"
            >
              {ASSIGNABLE_ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
            <Button onClick={sendInvite} disabled={!email.trim() || inviting} className="shrink-0">
              {inviting ? "Lädt ein …" : "Einladen"}
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted">{ROLE_HINTS[inviteRole]}</p>

          {teamInvites.length > 0 && (
            <div className="mt-5">
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted">
                Offene Einladungen ({teamInvites.length})
              </h3>
              <div className="flex flex-col gap-2">
                {teamInvites.map((inv) => (
                  <div
                    key={inv.id}
                    className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-surface-2 px-3 py-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{inv.email}</div>
                      <div className="truncate font-mono text-xs text-muted">/invite/{inv.token}</div>
                    </div>
                    <RoleBadge role={inv.role} />
                    <Button
                      variant="ghost"
                      className="!px-3 !py-1.5 text-xs"
                      onClick={() => copyLink(inv.token)}
                    >
                      {copied === inv.token ? "✓ Kopiert" : "Link kopieren"}
                    </Button>
                    <button
                      onClick={() => revokeTeamInvite(inv.id)}
                      aria-label="Einladung zurückziehen"
                      className="rounded-lg px-2 py-1 text-sm text-muted transition hover:bg-danger/15 hover:text-danger"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Rollenübersicht */}
      <div className="mt-8 rounded-2xl border border-line bg-surface p-6">
        <h2 className="font-semibold">Rollen &amp; Rechte</h2>
        <div className="mt-3 flex flex-col gap-2 text-sm">
          {(["owner", "admin", "editor", "viewer"] as Role[]).map((r) => (
            <div key={r} className="flex gap-3">
              <span className="w-28 shrink-0">
                <RoleBadge role={r} />
              </span>
              <span className="text-muted">{ROLE_HINTS[r]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Workspace verlassen */}
      {role !== "owner" && (
        <div className="mt-8 rounded-2xl border border-danger/30 bg-danger/5 p-6">
          <h2 className="font-semibold text-danger">Workspace verlassen</h2>
          <p className="mt-1 text-sm text-muted">
            Du verlierst den Zugriff auf <strong className="text-foreground">{workspaceName}</strong>.
            Deine eigenen Workspaces bleiben bestehen.
          </p>
          <Button
            variant="danger"
            className="mt-4"
            onClick={() => {
              if (confirm(`„${workspaceName}“ wirklich verlassen?`)) leaveWorkspace();
            }}
          >
            Workspace verlassen
          </Button>
        </div>
      )}
    </div>
  );
}
