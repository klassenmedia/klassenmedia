import "server-only";

import { cookies } from "next/headers";
import { createHash, randomBytes } from "crypto";
import { cache } from "react";
import { db } from "./db";
import { can, type Capability, type Role } from "./permissions";

const COOKIE_NAME = "planbar_session";
const WORKSPACE_COOKIE = "planbar_workspace";
const SESSION_DAYS = 30;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Legt eine Session an und setzt das httpOnly-Cookie. */
export async function createSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  await db.session.create({
    data: { tokenHash: hashToken(token), userId, expiresAt },
  });

  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

/** Aktuell eingeloggter Nutzer oder null. Pro Request gecacht. */
export const getSessionUser = cache(async () => {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const session = await db.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });
  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await db.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }
  return session.user;
});

/** Session serverseitig löschen + Cookie entfernen. */
export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (token) {
    await db.session
      .deleteMany({ where: { tokenHash: hashToken(token) } })
      .catch(() => {});
  }
  store.delete(COOKIE_NAME);
}

/**
 * Workspace des Nutzers holen und Mitgliedschaft prüfen — die zentrale
 * Autorisierung: JEDE Server Action läuft hierüber, nie über IDs aus dem Client.
 *
 * Ein Nutzer kann in mehreren Workspaces Mitglied sein (eigener + eingeladene).
 * Der aktive Workspace steht im Cookie `planbar_workspace`; ist er ungültig
 * (kein Mitglied), fällt es sicher auf den ältesten Workspace zurück.
 */
export async function requireWorkspace() {
  const user = await getSessionUser();
  if (!user) throw new Error("Nicht eingeloggt");

  const memberships = await db.workspaceMember.findMany({
    where: { userId: user.id },
    include: { workspace: true },
    orderBy: { createdAt: "asc" },
  });
  if (memberships.length === 0) throw new Error("Kein Workspace gefunden");

  const store = await cookies();
  const activeId = store.get(WORKSPACE_COOKIE)?.value;
  const active = memberships.find((m) => m.workspaceId === activeId) ?? memberships[0];

  return {
    user,
    workspace: active.workspace,
    role: active.role as Role,
    memberships,
  };
}

/**
 * Wie requireWorkspace, wirft aber zusätzlich, wenn die Rolle die verlangte
 * Fähigkeit nicht hat. Die Server Actions prüfen zusätzlich mit `can()` und
 * geben eine klare Meldung zurück — dies ist die harte Absicherung.
 */
export async function requireCan(cap: Capability) {
  const ctx = await requireWorkspace();
  if (!can(ctx.role, cap)) throw new Error("FORBIDDEN");
  return ctx;
}

/** Aktiven Workspace wechseln — nur, wenn der Nutzer dort Mitglied ist. */
export async function setActiveWorkspace(workspaceId: string): Promise<boolean> {
  const user = await getSessionUser();
  if (!user) return false;
  const membership = await db.workspaceMember.findFirst({
    where: { userId: user.id, workspaceId },
  });
  if (!membership) return false;
  const store = await cookies();
  store.set(WORKSPACE_COOKIE, workspaceId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
  return true;
}

/**
 * Eine Team-Einladung für den eingeloggten Nutzer annehmen (Token = Zugang).
 * Legt die Mitgliedschaft an, markiert die Einladung als angenommen und setzt
 * den beigetretenen Workspace als aktiv. Idempotent, falls schon Mitglied.
 */
export async function acceptTeamInvite(
  userId: string,
  token: string
): Promise<{ ok: boolean; workspaceId?: string; error?: string }> {
  const invite = await db.teamInvite.findFirst({
    where: { token, status: "pending", expiresAt: { gt: new Date() } },
  });
  if (!invite) return { ok: false, error: "Einladung ungültig oder abgelaufen." };

  const existing = await db.workspaceMember.findFirst({
    where: { workspaceId: invite.workspaceId, userId },
  });
  if (!existing) {
    await db.workspaceMember.create({
      data: { workspaceId: invite.workspaceId, userId, role: invite.role },
    });
  }
  await db.teamInvite.update({
    where: { id: invite.id },
    data: { status: "accepted", acceptedAt: new Date() },
  });
  await setActiveWorkspace(invite.workspaceId);
  return { ok: true, workspaceId: invite.workspaceId };
}
