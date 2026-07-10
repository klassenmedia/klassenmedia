import "server-only";

import { db } from "./db";
import { imageReady, textReady } from "./ai/generate";
import { oauthReadyMap } from "./oauth/providers";
import { simulateAdMetrics } from "./ads-simulation";
import type { Role } from "./permissions";
import {
  ActivityItem,
  AdCampaignItem,
  AdObjective,
  AiMode,
  ApiTokenItem,
  ApprovalStatus,
  ClientItem,
  CommentItem,
  ConnectionInvite,
  CreditEntry,
  isFollowUpDue,
  Platform,
  PlanTier,
  Post,
  ReviewLinkItem,
  SocialAccount,
  TeamInviteItem,
  TeamMember,
  WorkspaceSummary,
} from "./types";

export interface WorkspaceBundle {
  user: { name: string; email: string };
  workspaceId: string;
  workspaceName: string;
  /** Rolle des aktuellen Nutzers im aktiven Workspace */
  role: Role;
  /** Alle Workspaces des Nutzers (für den Wechsler) */
  workspaces: WorkspaceSummary[];
  /** Mitglieder des aktiven Workspace */
  members: TeamMember[];
  /** Offene Team-Einladungen */
  teamInvites: TeamInviteItem[];
  /** MCP-Connector: API-Tokens für Claude (Remote-MCP-Server) */
  apiTokens: ApiTokenItem[];
  /** Je Plattform: ist der echte OAuth-Login konfiguriert (App-Credentials in .env)? */
  oauthReady: Record<Platform, boolean>;
  plan: PlanTier;
  aiMode: AiMode;
  hasByoKeys: boolean;
  /** Ist echte KI einsatzbereit? (BYO-Key hinterlegt bzw. Plattform-Key gesetzt) */
  ai: { textReady: boolean; imageReady: boolean };
  credits: number;
  billing: {
    stripeConfigured: boolean;
    subscriptionStatus: string | null;
    currentPeriodEnd: string | null;
  };
  clients: ClientItem[];
  accounts: SocialAccount[];
  posts: Post[];
  adCampaigns: AdCampaignItem[];
  invites: ConnectionInvite[];
  creditLog: CreditEntry[];
  comments: CommentItem[];
  reviewLinks: ReviewLinkItem[];
  activity: ActivityItem[];
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
  user: { id: string; name: string; email: string },
  role: Role
): Promise<WorkspaceBundle> {
  const [
    workspace,
    accounts,
    posts,
    invites,
    creditLog,
    comments,
    reviewLinks,
    activity,
    memberRows,
    teamInviteRows,
    myMemberships,
    clientRows,
    adCampaignRows,
    apiTokenRows,
  ] = await Promise.all([
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
    db.reviewLink.findMany({
      where: { workspaceId, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
    }),
    db.activityLog.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
      take: 40,
    }),
    db.workspaceMember.findMany({
      where: { workspaceId },
      include: { user: true },
      orderBy: { createdAt: "asc" },
    }),
    db.teamInvite.findMany({
      where: { workspaceId, status: "pending", expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
    }),
    db.workspaceMember.findMany({
      where: { userId: user.id },
      include: { workspace: true },
      orderBy: { createdAt: "asc" },
    }),
    db.client.findMany({
      where: { workspaceId },
      include: { _count: { select: { accounts: true, posts: true } } },
      orderBy: { name: "asc" },
    }),
    db.adCampaign.findMany({
      where: { workspaceId },
      include: { post: true, account: true },
      orderBy: { createdAt: "desc" },
    }),
    db.apiToken.findMany({
      where: { workspaceId, revokedAt: null },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return {
    user: { name: user.name, email: user.email },
    workspaceId: workspace.id,
    workspaceName: workspace.name,
    role,
    workspaces: myMemberships.map((m) => ({
      id: m.workspaceId,
      name: m.workspace.name,
      role: m.role as Role,
    })),
    members: memberRows.map((m) => ({
      id: m.id,
      userId: m.userId,
      name: m.user.name,
      email: m.user.email,
      role: m.role as Role,
      isSelf: m.userId === user.id,
      since: fmtDate(m.createdAt),
    })),
    teamInvites: teamInviteRows.map((t) => ({
      id: t.id,
      email: t.email,
      role: t.role as Role,
      token: t.token,
      invitedBy: t.invitedBy,
      createdAt: fmtDate(t.createdAt),
    })),
    apiTokens: apiTokenRows.map((t) => ({
      id: t.id,
      name: t.name,
      createdBy: t.createdBy,
      createdAt: fmtDate(t.createdAt),
      lastUsedAt: t.lastUsedAt ? fmtDate(t.lastUsedAt) : null,
      revoked: t.revokedAt !== null,
    })) satisfies ApiTokenItem[],
    oauthReady: oauthReadyMap(),
    plan: workspace.plan as PlanTier,
    aiMode: workspace.aiMode as AiMode,
    hasByoKeys: Boolean(workspace.anthropicKeyEnc || workspace.openaiKeyEnc),
    ai: { textReady: textReady(workspace), imageReady: imageReady(workspace) },
    credits: workspace.creditBalance,
    billing: {
      stripeConfigured: Boolean(process.env.STRIPE_SECRET_KEY),
      subscriptionStatus: workspace.subscriptionStatus,
      currentPeriodEnd: workspace.currentPeriodEnd
        ? fmtDate(workspace.currentPeriodEnd)
        : null,
    },
    clients: clientRows.map((c) => {
      const followUpAt = c.followUpAt ? dateKey(c.followUpAt) : null;
      return {
        id: c.id,
        name: c.name,
        color: c.color,
        accountCount: c._count.accounts,
        postCount: c._count.posts,
        followUpAt,
        followUpNote: c.followUpNote,
        followUpDue: isFollowUpDue(followUpAt, dateKey(new Date())),
      };
    }),
    accounts: accounts.map((a) => ({
      id: a.id,
      platform: a.platform as Platform,
      displayName: a.displayName,
      handle: a.handle,
      clientId: a.clientId,
    })),
    posts: posts.map((p) => ({
      id: p.id,
      title: p.title,
      body: p.body,
      clientId: p.clientId,
      date: dateKey(p.scheduledAt),
      time: timeKey(p.scheduledAt),
      accountIds: p.accounts.map((pa) => pa.accountId),
      status: p.status as Post["status"],
      format: p.format as Post["format"],
      media: p.media.map((m) => ({ id: m.id, url: m.url })),
      publishErrors: p.accounts
        .filter((pa) => pa.error && !pa.publishedAt)
        .map((pa) => `${pa.account.handle}: ${pa.error}`),
      approval: p.approval as ApprovalStatus,
      approvalNote: p.approvalNote,
      reminderMode: p.reminderMode,
      reminderDue: p.reminderMode && p.reminderSentAt !== null && p.status === "scheduled",
    })),
    adCampaigns: adCampaignRows.map((c) => ({
      id: c.id,
      postId: c.postId,
      postBody: c.post.title || c.post.body,
      accountId: c.accountId,
      accountHandle: c.account.handle,
      platform: c.account.platform as Platform,
      clientId: c.clientId,
      objective: c.objective as AdObjective,
      budgetTotal: c.budgetTotal,
      startDate: dateKey(c.startDate),
      endDate: dateKey(c.endDate),
      status: c.status as AdCampaignItem["status"],
      createdBy: c.createdBy,
      metrics: simulateAdMetrics(
        { id: c.id, objective: c.objective as AdObjective, budgetTotal: c.budgetTotal, startDate: c.startDate, endDate: c.endDate },
        new Date()
      ),
    })),
    invites: invites.map((i) => ({
      id: i.id,
      platform: i.platform as Platform,
      clientName: i.clientName,
      clientId: i.clientId,
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
        clientId: c.post.clientId,
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
    reviewLinks: reviewLinks.map((r) => ({
      id: r.id,
      clientName: r.clientName,
      token: r.token,
      createdAt: fmtDate(r.createdAt),
    })),
    activity: activity.map((a) => ({
      id: a.id,
      actor: a.actor,
      action: a.action,
      target: a.target,
      when: fmtDate(a.createdAt),
    })),
  };
}
