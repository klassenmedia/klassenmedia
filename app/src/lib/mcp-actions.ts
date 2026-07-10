"use server";

// MCP-Connector: API-Tokens verwalten (anlegen/widerrufen). Der Rohwert des
// Tokens wird nur bei der Erstellung einmal zurückgegeben — die DB speichert
// ausschließlich den SHA-256-Hash (siehe hashApiToken in crypto.ts), analog
// zu Session-Tokens.

import { randomBytes } from "crypto";
import { db } from "./db";
import { requireWorkspace } from "./auth";
import { can } from "./permissions";
import { hashApiToken } from "./crypto";
import { getWorkspaceBundle, type WorkspaceBundle } from "./data";
import { apiTokenNameSchema } from "./schemas";

export type McpActionResult = {
  ok: boolean;
  error?: string;
  bundle?: WorkspaceBundle;
  /** Nur bei createApiTokenAction gesetzt — wird kein zweites Mal angezeigt. */
  rawToken?: string;
};

async function guard() {
  const ctx = await requireWorkspace();
  if (!can(ctx.role, "accounts")) {
    return { denied: fail("Für diese Aktion fehlt dir die Berechtigung — nur Inhaber:in/Admin.") };
  }
  return { denied: null, ctx };
}

async function ok(): Promise<McpActionResult> {
  const { user, workspace, role } = await requireWorkspace();
  return {
    ok: true,
    bundle: await getWorkspaceBundle(
      workspace.id,
      { id: user.id, name: user.name, email: user.email },
      role
    ),
  };
}

function fail(error: string): McpActionResult {
  return { ok: false, error };
}

export async function createApiTokenAction(name: unknown): Promise<McpActionResult> {
  const g = await guard();
  if (g.denied) return g.denied;
  const { workspace, user } = g.ctx;
  const parsed = apiTokenNameSchema.safeParse(name);
  if (!parsed.success) return fail(parsed.error.issues[0].message);

  const raw = `pb_${randomBytes(24).toString("hex")}`;
  await db.apiToken.create({
    data: {
      workspaceId: workspace.id,
      name: parsed.data,
      tokenHash: hashApiToken(raw),
      createdBy: user.name,
    },
  });

  const base = await ok();
  return { ...base, rawToken: raw };
}

export async function revokeApiTokenAction(id: string): Promise<McpActionResult> {
  const g = await guard();
  if (g.denied) return g.denied;
  const { workspace } = g.ctx;
  await db.apiToken.updateMany({
    where: { id, workspaceId: workspace.id, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  return ok();
}
