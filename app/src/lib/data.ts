import "server-only";

import { db } from "./db";
import {
  AiMode,
  CommentItem,
  ConnectionInvite,
  CreditEntry,
  Platform,
  PlanTier,
  Post,
  SocialAccount,
} from "./types";

export interface WorkspaceBundle {
  user: { name: string; email: string };
  workspaceName: string;
  plan: PlanTier;
  aiMode: AiMode;
  hasByoKeys: boolean;
  credits: number;
  billing: {
    stripeConfigured: boolean;
    subscriptionStatus: string | null;
    currentPeriodEnd: string | null;
  };
  accounts: SocialAccount[];
  posts: Post[];
  invites: ConnectionInvite[];
  creditLog: CreditEntry[];
  comments: CommentItem[];
}

function fmtDate(d: Date): string {
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
}

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function timeKey(d: Date): string {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** Lädt alles, was die App-Oberfläche braucht — immer workspace-gescoped. */
export async function getWorkspaceBundle(
  workspaceId: string,
  user: { name: string; email: string }
): Promise<WorkspaceBundle> {
  const [workspace, accounts, posts, invites, creditLog, comments] = await Promise.all([
    db.workspace.findUniqueOrThrow({ where: { id: workspaceId } }),
    db.socialAccount.findMany({
      where: { workspaceId },
      orderBy: { connectedAt: "asc" },
    }),
    db.post.findMany({
      where: { workspaceId },
      include: {
        accounts: { include: { account: true } },
        media: { orderBy: { sortOrder: "asc" } },
      },
      orderBy: { scheduledAt: "asc" },
    }),
    db.connectionInvite.findMany({
      where: { workspaceId, status: { in: ["pending", "accepted"] } },
      orderBy: { createdAt: "desc" },
    }),
    db.creditTransaction.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    db.comment.findMany({
      where: { workspaceId, parentId: null },
      include: {
        replies: { orderBy: { createdAt: "asc" } },
        post: { include: { accounts: { include: { account: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);

  return {
    user,
    workspaceName: workspace.name,
    plan: workspace.plan as PlanTier,
    aiMode: workspace.aiMode as AiMode,
    hasByoKeys: Boolean(workspace.anthropicKeyEnc || workspace.openaiKeyEnc),
    credits: workspace.creditBalance,
    billing: {
      stripeConfigured: Boolean(process.env.STRIPE_SECRET_KEY),
      subscriptionStatus: workspace.subscriptionStatus,
      currentPeriodEnd: workspace.currentPeriodEnd
        ? fmtDate(workspace.currentPeriodEnd)
        : null,
    },
    accounts: accounts.map((a) => ({
      id: a.id,
      platform: a.platform as Platform,
      displayName: a.displayName,
      handle: a.handle,
    })),
    posts: posts.map((p) => ({
      id: p.id,
      body: p.body,
      date: dateKey(p.scheduledAt),
      time: timeKey(p.scheduledAt),
      accountIds: p.accounts.map((pa) => pa.accountId),
      status: p.status as Post["status"],
      format: p.format as Post["format"],
      media: p.media.map((m) => ({ id: m.id, url: m.url })),
      publishErrors: p.accounts
        .filter((pa) => pa.error && !pa.publishedAt)
        .map((pa) => `${pa.account.handle}: ${pa.error}`),
    })),
    invites: invites.map((i) => ({
      id: i.id,
      platform: i.platform as Platform,
      clientName: i.clientName,
      token: i.token,
      status: i.status as ConnectionInvite["status"],
      createdAt: fmtDate(i.createdAt),
    })),
    creditLog: creditLog.map((t) => ({
      id: t.id,
      label: t.description,
      amount: t.amount,
      when: fmtDate(t.createdAt),
    })),
    comments: comments.map((c) => {
      const firstAccount = c.post.accounts[0]?.account;
      return {
        id: c.id,
        postId: c.postId,
        postSnippet: c.post.body.slice(0, 80),
        platform: (firstAccount?.platform ?? "instagram") as Platform,
        accountLabel: firstAccount?.handle ?? "—",
        author: c.author,
        authorHandle: c.authorHandle,
        text: c.text,
        likedByUs: c.likedByUs,
        when: fmtDate(c.createdAt),
        replies: c.replies.map((r) => ({
          id: r.id,
          text: r.text,
          when: fmtDate(r.createdAt),
        })),
      };
    }),
  };
}
