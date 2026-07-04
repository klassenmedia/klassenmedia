"use client";

// Client-Store der App: hält das vom Server geladene Workspace-Bundle und
// ruft für jede Mutation eine Server Action auf. Die Actions geben das frische
// Bundle zurück — eine Quelle der Wahrheit, kein Client-Drift.

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import {
  AiMode,
  CommentItem,
  ConnectionInvite,
  CreditEntry,
  MediaItem,
  Platform,
  PlanTier,
  Post,
  PostFormat,
  PostStatus,
  SocialAccount,
} from "./types";
import type { WorkspaceBundle } from "./data";
import {
  acceptInviteAction,
  ActionResult,
  addAccountAction,
  buyCreditsAction,
  createInviteAction,
  deleteCommentAction,
  deletePostAction,
  removeAccountAction,
  replyCommentAction,
  revokeInviteAction,
  savePostAction,
  saveByoKeysAction,
  setAiModeAction,
  setPlanAction,
  spendCreditsAction,
  toggleCommentLikeAction,
} from "./actions";

export interface SavePostInput {
  id?: string;
  body: string;
  date: string;
  time: string;
  accountIds: string[];
  status: PostStatus;
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
  plan: PlanTier;
  aiMode: AiMode;
  hasByoKeys: boolean;
  credits: number;
  creditLog: CreditEntry[];
  error: string | null;
  clearError: () => void;
  savePost: (p: SavePostInput) => Promise<boolean>;
  deletePost: (id: string) => Promise<void>;
  addAccount: (a: { platform: Platform; displayName: string; handle: string }) => Promise<void>;
  removeAccount: (id: string) => Promise<void>;
  createInvite: (platform: Platform, clientName: string) => Promise<void>;
  revokeInvite: (id: string) => Promise<void>;
  acceptInvite: (id: string) => Promise<void>;
  setPlan: (p: PlanTier) => Promise<void>;
  setAiMode: (m: AiMode) => Promise<void>;
  saveByoKeys: (keys: { anthropicKey?: string; openaiKey?: string }) => Promise<boolean>;
  buyCredits: (packageId: "S" | "M" | "L") => Promise<void>;
  spendCredits: (kind: "caption" | "image", label: string) => Promise<boolean>;
  toggleCommentLike: (id: string) => Promise<void>;
  replyComment: (id: string, text: string) => Promise<boolean>;
  deleteComment: (id: string) => Promise<void>;
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
      setPlan: async (p) => void (await apply(setPlanAction(p))),
      setAiMode: async (m) => void (await apply(setAiModeAction(m))),
      saveByoKeys: (keys) => apply(saveByoKeysAction(keys)),
      buyCredits: async (pkg) => void (await apply(buyCreditsAction(pkg))),
      spendCredits: (kind, label) => apply(spendCreditsAction(kind, label)),
      toggleCommentLike: async (id) => void (await apply(toggleCommentLikeAction(id))),
      replyComment: (id, text) => apply(replyCommentAction(id, text)),
      deleteComment: async (id) => void (await apply(deleteCommentAction(id))),
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
