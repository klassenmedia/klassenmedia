"use server";

// Ads (Phase 8): einen bestehenden Post bewerben (Meta-Boost-Konzept).
// Sicherheit wie überall: Auth über requireWorkspace(), Rollen-Check ("ads"
// — Budget-Verantwortung liegt bei owner/admin), jede fremde ID wird gegen
// den Workspace geprüft, Eingaben via zod.

import { db } from "./db";
import { requireWorkspace } from "./auth";
import { can } from "./permissions";
import { getWorkspaceBundle, type WorkspaceBundle } from "./data";
import { adCampaignSchema } from "./schemas";

export type AdsActionResult = { ok: boolean; error?: string; bundle?: WorkspaceBundle };

async function guard() {
  const ctx = await requireWorkspace();
  if (!can(ctx.role, "ads")) {
    return { denied: fail("Für diese Aktion fehlt dir die Berechtigung — nur Inhaber:in/Admin.") };
  }
  return { denied: null, ctx };
}

async function ok(): Promise<AdsActionResult> {
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

function fail(error: string): AdsActionResult {
  return { ok: false, error };
}

export async function createAdCampaignAction(input: unknown): Promise<AdsActionResult> {
  const g = await guard();
  if (g.denied) return g.denied;
  const { workspace, user } = g.ctx;
  const parsed = adCampaignSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  const data = parsed.data;

  const post = await db.post.findFirst({ where: { id: data.postId, workspaceId: workspace.id } });
  if (!post) return fail("Beitrag nicht gefunden");
  const account = await db.socialAccount.findFirst({
    where: { id: data.accountId, workspaceId: workspace.id },
  });
  if (!account) return fail("Account nicht gefunden");
  if (!["instagram", "facebook"].includes(account.platform)) {
    return fail("Werbeanzeigen sind aktuell nur für Instagram und Facebook möglich");
  }

  const clientId = data.clientId
    ? (await db.client.findFirst({ where: { id: data.clientId, workspaceId: workspace.id } }))?.id ?? null
    : null;

  await db.adCampaign.create({
    data: {
      workspaceId: workspace.id,
      clientId,
      postId: data.postId,
      accountId: data.accountId,
      objective: data.objective,
      budgetTotal: data.budgetTotal,
      startDate: new Date(`${data.startDate}T00:00:00`),
      endDate: new Date(`${data.endDate}T23:59:59`),
      createdBy: user.name,
    },
  });
  return ok();
}

async function setStatus(id: string, status: "active" | "paused"): Promise<AdsActionResult> {
  const g = await guard();
  if (g.denied) return g.denied;
  const { workspace } = g.ctx;
  const res = await db.adCampaign.updateMany({
    where: { id, workspaceId: workspace.id, status: { not: "completed" } },
    data: { status },
  });
  if (res.count === 0) return fail("Kampagne nicht gefunden");
  return ok();
}

export async function pauseAdCampaignAction(id: string): Promise<AdsActionResult> {
  return setStatus(id, "paused");
}

export async function resumeAdCampaignAction(id: string): Promise<AdsActionResult> {
  return setStatus(id, "active");
}

export async function deleteAdCampaignAction(id: string): Promise<AdsActionResult> {
  const g = await guard();
  if (g.denied) return g.denied;
  const { workspace } = g.ctx;
  await db.adCampaign.deleteMany({ where: { id, workspaceId: workspace.id } });
  return ok();
}
