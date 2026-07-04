import "server-only";

import { cookies } from "next/headers";
import { createHash, randomBytes } from "crypto";
import { cache } from "react";
import { db } from "./db";

const COOKIE_NAME = "planbar_session";
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
 */
export async function requireWorkspace() {
  const user = await getSessionUser();
  if (!user) throw new Error("Nicht eingeloggt");

  const membership = await db.workspaceMember.findFirst({
    where: { userId: user.id },
    include: { workspace: true },
    orderBy: { id: "asc" },
  });
  if (!membership) throw new Error("Kein Workspace gefunden");

  return { user, workspace: membership.workspace, role: membership.role };
}
