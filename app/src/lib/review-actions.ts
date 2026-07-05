"use server";

// Öffentliche Kunden-Freigabe über den Review-Link. Der Token in der URL ist
// die Berechtigung — der Kunde hat kein Konto. Alle Aktionen sind auf den
// Workspace des Tokens beschränkt und nur auf Posts mit approval="pending".

import { z } from "zod";
import { db } from "./db";
import { Platform, PostFormat } from "./types";
import { logActivity } from "./activity";

export interface ReviewPost {
  id: string;
  body: string;
  format: PostFormat;
  when: string;
  platforms: Platform[];
  media: string[]; // URLs / placeholder-Strings
}

export interface ReviewData {
  valid: boolean;
  clientName: string;
  workspaceName: string;
  posts: ReviewPost[];
}

function fmt(d: Date): string {
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}, ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")} Uhr`;
}

async function resolveToken(token: string) {
  const link = await db.reviewLink.findUnique({
    where: { token },
    include: { workspace: true },
  });
  if (!link || link.expiresAt < new Date()) return null;
  return link;
}

export async function getReviewData(token: string): Promise<ReviewData> {
  const link = await resolveToken(token);
  if (!link) {
    return { valid: false, clientName: "", workspaceName: "", posts: [] };
  }
  const posts = await db.post.findMany({
    where: { workspaceId: link.workspaceId, approval: "pending" },
    include: {
      accounts: { include: { account: true } },
      media: { orderBy: { sortOrder: "asc" } },
    },
    orderBy: { scheduledAt: "asc" },
  });
  return {
    valid: true,
    clientName: link.clientName,
    workspaceName: link.workspace.name,
    posts: posts.map((p) => ({
      id: p.id,
      body: p.body,
      format: p.format as PostFormat,
      when: fmt(p.scheduledAt),
      platforms: p.accounts.map((pa) => pa.account.platform as Platform),
      media: p.media.map((m) => m.url),
    })),
  };
}

export interface ReviewActionResult {
  ok: boolean;
  error?: string;
  data?: ReviewData;
}

const noteSchema = z.string().trim().max(1000).optional();

async function decide(
  token: string,
  postId: string,
  decision: "approved" | "changes_requested",
  note?: string
): Promise<ReviewActionResult> {
  const link = await resolveToken(token);
  if (!link) return { ok: false, error: "Link ist nicht mehr gültig." };

  const post = await db.post.findFirst({
    where: { id: postId, workspaceId: link.workspaceId, approval: "pending" },
  });
  if (!post) return { ok: false, error: "Beitrag nicht gefunden." };

  await db.post.update({
    where: { id: postId },
    data:
      decision === "approved"
        ? { approval: "approved", status: "scheduled", decidedAt: new Date(), approvalNote: null }
        : { approval: "changes_requested", status: "draft", decidedAt: new Date(), approvalNote: note || null },
  });
  await logActivity(link.workspaceId, `Kunde: ${link.clientName}`, decision, post.body);

  return { ok: true, data: await getReviewData(token) };
}

export async function clientApproveAction(token: string, postId: string): Promise<ReviewActionResult> {
  return decide(token, postId, "approved");
}

export async function clientRequestChangesAction(
  token: string,
  postId: string,
  note: unknown
): Promise<ReviewActionResult> {
  const parsed = noteSchema.safeParse(note);
  if (!parsed.success) return { ok: false, error: "Kommentar zu lang." };
  return decide(token, postId, "changes_requested", parsed.data);
}
