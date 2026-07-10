"use client";

// Client-Store der App: hält das vom Server geladene Workspace-Bundle und
// ruft für jede Mutation eine Server Action auf. Die Actions geben das frische
// Bundle zurück — eine Quelle der Wahrheit, kein Client-Drift.

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import {
  ActivityItem,
  AdCampaignItem,
  AdObjective,
  AiMode,
  ApiTokenItem,
  ClientItem,
  CommentItem,
  ConnectionInvite,
  CreditEntry,
  MediaItem,
  Platform,
  PlanTier,
  Post,
  PostFormat,
  ReviewLinkItem,
  SocialAccount,
  TeamInviteItem,
  TeamMember,
  WorkspaceSummary,
} from "./types";
import type { WorkspaceBundle } from "./data";
import { can as canDo, type Capability, type Role } from "./permissions";
import {
  checkoutCreditsAction,
  checkoutPlanAction,
  customerPortalAction,
} from "./billing-actions";
import {
  acceptInviteAction,
  ActionResult,
  addAccountAction,
  addWordPressAccountAction,
  createInviteAction,
  clearClientFollowUpAction,
  createClientAction,
  updateClientAction,
  deleteClientAction,
  assignAccountAction,
  deleteCommentAction,
  deletePostAction,
  markReminderPostedAction,
  movePostAction,
  removeAccountAction,
  replyCommentAction,
  revokeInviteAction,
  savePostAction,
  saveByoKeysAction,
  setAiModeAction,
  spendCreditsAction,
  toggleCommentLikeAction,
  approvePostAction,
  requestChangesAction,
  createReviewLinkAction,
  revokeReviewLinkAction,
  inviteMemberAction,
  revokeTeamInviteAction,
  changeMemberRoleAction,
  removeMemberAction,
  switchWorkspaceAction,
  leaveWorkspaceAction,
} from "./actions";
import {
  generateCaptionAction,
  generateIdeasAction,
  generateImageAction,
} from "./ai-actions";
import {
  createAdCampaignAction,
  deleteAdCampaignAction,
  pauseAdCampaignAction,
  resumeAdCampaignAction,
} from "./ads-actions";
import { createApiTokenAction, revokeApiTokenAction } from "./mcp-actions";

export interface SavePostInput {
  id?: string;
  /** Nur für format "article" (Blogartikel) */
  title?: string | null;
  body: string;
  clientId?: string | null;
  date: string;
  time: string;
  accountIds: string[];
  status: "draft" | "scheduled" | "review";
  format: PostFormat;
  media: MediaItem[];
  /** Erinnerungs-Modus (Reels) — nur bei format "video" wirksam */
  reminderMode?: boolean;
}

interface Store {
  user: { name: string; email: string };
  workspaceId: string;
  workspaceName: string;
  role: Role;
  workspaces: WorkspaceSummary[];
  members: TeamMember[];
  teamInvites: TeamInviteItem[];
  /** MCP-Connector: API-Tokens für Claude */
  apiTokens: ApiTokenItem[];
  /** Je Plattform: echter OAuth-Login verfügbar (App-Credentials hinterlegt)? */
  oauthReady: WorkspaceBundle["oauthReady"];
  /** Rollen-Check für die UI (Buttons aus-/einblenden) */
  can: (cap: Capability) => boolean;
  clients: ClientItem[];
  /** aktiver Kunden-Filter (null = alle Kunden) — reine Client-Ansicht */
  selectedClientId: string | null;
  setSelectedClient: (id: string | null) => void;
  accounts: SocialAccount[];
  posts: Post[];
  adCampaigns: AdCampaignItem[];
  invites: ConnectionInvite[];
  comments: CommentItem[];
  reviewLinks: ReviewLinkItem[];
  activity: ActivityItem[];
  plan: PlanTier;
  aiMode: AiMode;
  hasByoKeys: boolean;
  ai: WorkspaceBundle["ai"];
  credits: number;
  creditLog: CreditEntry[];
  billing: WorkspaceBundle["billing"];
  error: string | null;
  clearError: () => void;
  savePost: (p: SavePostInput) => Promise<boolean>;
  deletePost: (id: string) => Promise<void>;
  /** Erinnerungs-Modus: fällige Erinnerung als "gepostet" bestätigen */
  markReminderPosted: (id: string) => Promise<void>;
  /** Kanban: Beitrag in eine andere Pipeline-Spalte ziehen */
  movePost: (id: string, column: "draft" | "review" | "scheduled") => Promise<boolean>;
  addAccount: (a: {
    platform: Platform;
    displayName: string;
    handle: string;
    clientId?: string | null;
  }) => Promise<void>;
  /** Website (WordPress) verbinden — Zugangsdaten werden serverseitig live geprüft */
  connectWordPress: (a: {
    displayName: string;
    siteUrl: string;
    username: string;
    appPassword: string;
    clientId?: string | null;
  }) => Promise<boolean>;
  removeAccount: (id: string) => Promise<void>;
  createClient: (name: string, color?: string) => Promise<boolean>;
  updateClient: (id: string, patch: { name?: string; color?: string }) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  /** Wiedervorlage als erledigt markieren (Erinnerungs-Banner) */
  clearClientFollowUp: (id: string) => Promise<void>;
  assignAccount: (accountId: string, clientId: string | null) => Promise<void>;
  createInvite: (platform: Platform, clientName: string, clientId?: string | null) => Promise<void>;
  revokeInvite: (id: string) => Promise<void>;
  acceptInvite: (id: string) => Promise<void>;
  /** Ads: einen bestehenden Post bewerben (Meta-Boost, aktuell simuliert) */
  createAdCampaign: (input: {
    postId: string;
    accountId: string;
    clientId?: string | null;
    objective: AdObjective;
    budgetTotal: number;
    startDate: string;
    endDate: string;
  }) => Promise<boolean>;
  pauseAdCampaign: (id: string) => Promise<void>;
  resumeAdCampaign: (id: string) => Promise<void>;
  deleteAdCampaign: (id: string) => Promise<void>;
  /** Abo abschließen/wechseln — leitet zu Stripe weiter, wenn konfiguriert */
  checkoutPlan: (p: PlanTier) => Promise<void>;
  setAiMode: (m: AiMode) => Promise<void>;
  saveByoKeys: (keys: { anthropicKey?: string; openaiKey?: string }) => Promise<boolean>;
  /** Credits kaufen — leitet zu Stripe weiter, wenn konfiguriert */
  buyCredits: (packageId: "S" | "M" | "L") => Promise<void>;
  openCustomerPortal: () => Promise<void>;
  spendCredits: (kind: "caption" | "image", label: string) => Promise<boolean>;
  /** Echte KI: eine Caption erzeugen (oder Demo-Platzhalter ohne Key) */
  generateCaption: (
    topic: string,
    platform?: Platform
  ) => Promise<{ text: string; source: "ai" | "demo" } | null>;
  /** Echte KI: mehrere Content-Ideen erzeugen */
  generateIdeas: (
    topic: string,
    platform?: Platform
  ) => Promise<{ ideas: string[]; source: "ai" | "demo" } | null>;
  /** Echte KI: ein Bild erzeugen (URL oder placeholder:<hue> im Demo-Modus) */
  generateImage: (
    prompt: string
  ) => Promise<{ url: string; source: "ai" | "demo" } | null>;
  toggleCommentLike: (id: string) => Promise<void>;
  replyComment: (id: string, text: string) => Promise<boolean>;
  deleteComment: (id: string) => Promise<void>;
  approvePost: (id: string) => Promise<void>;
  requestChanges: (id: string, note: string) => Promise<boolean>;
  createReviewLink: (clientName: string) => Promise<void>;
  revokeReviewLink: (id: string) => Promise<void>;
  inviteMember: (email: string, role: Role) => Promise<boolean>;
  revokeTeamInvite: (id: string) => Promise<void>;
  /** MCP-Connector: Token erstellen — gibt den Rohwert zurück (wird nur einmal angezeigt) */
  createApiToken: (name: string) => Promise<string | null>;
  revokeApiToken: (id: string) => Promise<void>;
  changeMemberRole: (memberId: string, role: Role) => Promise<void>;
  removeMember: (memberId: string) => Promise<void>;
  switchWorkspace: (workspaceId: string) => Promise<void>;
  leaveWorkspace: () => Promise<void>;
}

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({
  initial,
  initialClientId = null,
  children,
}: {
  initial: WorkspaceBundle;
  initialClientId?: string | null;
  children: React.ReactNode;
}) {
  const [bundle, setBundle] = useState<WorkspaceBundle>(initial);
  const [error, setError] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(initialClientId);

  // Kunden-Kontext übersteht Reloads (Cookie) — fühlt sich an wie ein fester Bereich
  const setSelectedClient = useCallback((id: string | null) => {
    setSelectedClientId(id);
    if (typeof document !== "undefined") {
      document.cookie = `planbar_client=${id ?? ""}; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`;
    }
  }, []);

  /** Ergebnis einer Action einarbeiten; liefert ok-Flag zurück */
  const apply = useCallback(async (promise: Promise<ActionResult>): Promise<boolean> => {
    try {
      const res = await promise;
      if (res.bundle) setBundle(res.bundle);
      if (!res.ok) setError(res.error ?? "Unbekannter Fehler");
      return res.ok;
    } catch (e) {
      console.error(e);
      setError("Etwas ist schiefgelaufen — bitte noch einmal versuchen.");
      return false;
    }
  }, []);

  const value = useMemo<Store>(
    () => ({
      ...bundle,
      error,
      can: (cap) => canDo(bundle.role, cap),
      selectedClientId,
      setSelectedClient,
      clearError: () => setError(null),
      savePost: (p) => apply(savePostAction(p)),
      deletePost: async (id) => void (await apply(deletePostAction(id))),
      markReminderPosted: async (id) => void (await apply(markReminderPostedAction(id))),
      movePost: (id, column) => apply(movePostAction(id, column)),
      addAccount: async (a) => void (await apply(addAccountAction(a))),
      connectWordPress: (a) => apply(addWordPressAccountAction(a)),
      removeAccount: async (id) => void (await apply(removeAccountAction(id))),
      createClient: (name, color) => apply(createClientAction({ name, color })),
      updateClient: async (id, patch) => void (await apply(updateClientAction(id, patch))),
      deleteClient: async (id) => void (await apply(deleteClientAction(id))),
      clearClientFollowUp: async (id) => void (await apply(clearClientFollowUpAction(id))),
      assignAccount: async (accountId, clientId) =>
        void (await apply(assignAccountAction(accountId, clientId))),
      createInvite: async (platform, clientName, clientId) =>
        void (await apply(createInviteAction({ platform, clientName, clientId }))),
      revokeInvite: async (id) => void (await apply(revokeInviteAction(id))),
      acceptInvite: async (id) => void (await apply(acceptInviteAction(id))),
      createAdCampaign: (input) => apply(createAdCampaignAction(input)),
      pauseAdCampaign: async (id) => void (await apply(pauseAdCampaignAction(id))),
      resumeAdCampaign: async (id) => void (await apply(resumeAdCampaignAction(id))),
      deleteAdCampaign: async (id) => void (await apply(deleteAdCampaignAction(id))),
      checkoutPlan: async (p) => {
        const res = await checkoutPlanAction(p);
        if (res.url) {
          window.location.href = res.url; // Stripe Checkout
          return;
        }
        if (res.bundle) setBundle(res.bundle);
        if (!res.ok) setError(res.error ?? "Unbekannter Fehler");
      },
      setAiMode: async (m) => void (await apply(setAiModeAction(m))),
      saveByoKeys: (keys) => apply(saveByoKeysAction(keys)),
      buyCredits: async (pkg) => {
        const res = await checkoutCreditsAction(pkg);
        if (res.url) {
          window.location.href = res.url;
          return;
        }
        if (res.bundle) setBundle(res.bundle);
        if (!res.ok) setError(res.error ?? "Unbekannter Fehler");
      },
      openCustomerPortal: async () => {
        const res = await customerPortalAction();
        if (res.url) {
          window.location.href = res.url;
          return;
        }
        if (!res.ok) setError(res.error ?? "Unbekannter Fehler");
      },
      spendCredits: (kind, label) => apply(spendCreditsAction(kind, label)),
      generateCaption: async (topic, platform) => {
        try {
          const res = await generateCaptionAction({ topic, platform });
          if (res.bundle) setBundle(res.bundle);
          if (!res.ok || !res.text) {
            setError(res.error ?? "KI-Vorschlag fehlgeschlagen");
            return null;
          }
          return { text: res.text, source: res.source ?? "ai" };
        } catch (e) {
          console.error(e);
          setError("Etwas ist schiefgelaufen — bitte noch einmal versuchen.");
          return null;
        }
      },
      generateIdeas: async (topic, platform) => {
        try {
          const res = await generateIdeasAction({ topic, platform });
          if (res.bundle) setBundle(res.bundle);
          if (!res.ok || !res.ideas) {
            setError(res.error ?? "KI-Ideen fehlgeschlagen");
            return null;
          }
          return { ideas: res.ideas, source: res.source ?? "ai" };
        } catch (e) {
          console.error(e);
          setError("Etwas ist schiefgelaufen — bitte noch einmal versuchen.");
          return null;
        }
      },
      generateImage: async (prompt) => {
        try {
          const res = await generateImageAction(prompt);
          if (res.bundle) setBundle(res.bundle);
          if (!res.ok || !res.url) {
            setError(res.error ?? "Bild-Generierung fehlgeschlagen");
            return null;
          }
          return { url: res.url, source: res.source ?? "ai" };
        } catch (e) {
          console.error(e);
          setError("Etwas ist schiefgelaufen — bitte noch einmal versuchen.");
          return null;
        }
      },
      toggleCommentLike: async (id) => void (await apply(toggleCommentLikeAction(id))),
      replyComment: (id, text) => apply(replyCommentAction(id, text)),
      deleteComment: async (id) => void (await apply(deleteCommentAction(id))),
      approvePost: async (id) => void (await apply(approvePostAction(id))),
      requestChanges: (id, note) => apply(requestChangesAction(id, note)),
      createReviewLink: async (name) => void (await apply(createReviewLinkAction(name))),
      revokeReviewLink: async (id) => void (await apply(revokeReviewLinkAction(id))),
      inviteMember: (email, role) => apply(inviteMemberAction({ email, role })),
      revokeTeamInvite: async (id) => void (await apply(revokeTeamInviteAction(id))),
      createApiToken: async (name) => {
        try {
          const res = await createApiTokenAction(name);
          if (res.bundle) setBundle(res.bundle);
          if (!res.ok) {
            setError(res.error ?? "Unbekannter Fehler");
            return null;
          }
          return res.rawToken ?? null;
        } catch (e) {
          console.error(e);
          setError("Etwas ist schiefgelaufen — bitte noch einmal versuchen.");
          return null;
        }
      },
      revokeApiToken: async (id) => void (await apply(revokeApiTokenAction(id))),
      changeMemberRole: async (memberId, role) =>
        void (await apply(changeMemberRoleAction({ memberId, role }))),
      removeMember: async (memberId) => void (await apply(removeMemberAction(memberId))),
      switchWorkspace: async (workspaceId) => {
        const okSwitch = await apply(switchWorkspaceAction(workspaceId));
        // Beim Wechsel Seiteninhalte neu laden, damit alles zum neuen Workspace passt
        if (okSwitch && typeof window !== "undefined") window.location.assign("/app");
      },
      leaveWorkspace: async () => {
        const left = await apply(leaveWorkspaceAction());
        if (left && typeof window !== "undefined") window.location.assign("/app");
      },
    }),
    [bundle, error, apply, selectedClientId, setSelectedClient]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore muss innerhalb von <StoreProvider> verwendet werden");
  return ctx;
}
