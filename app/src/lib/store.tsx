"use client";

// Client-Store der App: hält das vom Server geladene Workspace-Bundle und
// ruft für jede Mutation eine Server Action auf. Die Actions geben das frische
// Bundle zurück — eine Quelle der Wahrheit, kein Client-Drift.

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import {
  ActivityItem,
  AiMode,
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
} from "./types";
import type { WorkspaceBundle } from "./data";
import {
  checkoutCreditsAction,
  checkoutPlanAction,
  customerPortalAction,
} from "./billing-actions";
import {
  acceptInviteAction,
  ActionResult,
  addAccountAction,
  createInviteAction,
  deleteCommentAction,
  deletePostAction,
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
} from "./actions";
import {
  generateCaptionAction,
  generateIdeasAction,
  generateImageAction,
} from "./ai-actions";

export interface SavePostInput {
  id?: string;
  body: string;
  date: string;
  time: string;
  accountIds: string[];
  status: "draft" | "scheduled" | "review";
  format: PostFormat;
  media: MediaItem[];
}

interface Store {
  user: { name: string; email: string };
  workspaceName: string;
  accounts: SocialAccount[];
  posts: Post[];
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
  addAccount: (a: { platform: Platform; displayName: string; handle: string }) => Promise<void>;
  removeAccount: (id: string) => Promise<void>;
  createInvite: (platform: Platform, clientName: string) => Promise<void>;
  revokeInvite: (id: string) => Promise<void>;
  acceptInvite: (id: string) => Promise<void>;
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
}

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({
  initial,
  children,
}: {
  initial: WorkspaceBundle;
  children: React.ReactNode;
}) {
  const [bundle, setBundle] = useState<WorkspaceBundle>(initial);
  const [error, setError] = useState<string | null>(null);

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
      clearError: () => setError(null),
      savePost: (p) => apply(savePostAction(p)),
      deletePost: async (id) => void (await apply(deletePostAction(id))),
      addAccount: async (a) => void (await apply(addAccountAction(a))),
      removeAccount: async (id) => void (await apply(removeAccountAction(id))),
      createInvite: async (platform, clientName) =>
        void (await apply(createInviteAction({ platform, clientName }))),
      revokeInvite: async (id) => void (await apply(revokeInviteAction(id))),
      acceptInvite: async (id) => void (await apply(acceptInviteAction(id))),
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
    }),
    [bundle, error, apply]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore muss innerhalb von <StoreProvider> verwendet werden");
  return ctx;
}
