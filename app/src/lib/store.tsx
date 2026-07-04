"use client";

// Zentraler In-Memory-Store des Prototyps (React Context).
// In Phase 1 wird er durch Server Actions + Postgres ersetzt; die Action-
// Signaturen hier entsprechen bewusst den späteren Service-Funktionen.

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import {
  AiMode,
  ConnectionInvite,
  CreditEntry,
  Platform,
  PlanTier,
  Post,
  SocialAccount,
} from "./types";
import {
  buildDemoPosts,
  DEMO_ACCOUNTS,
  DEMO_CREDIT_LOG,
} from "./demo-data";

interface Store {
  accounts: SocialAccount[];
  posts: Post[];
  invites: ConnectionInvite[];
  plan: PlanTier;
  aiMode: AiMode;
  credits: number;
  creditLog: CreditEntry[];
  addAccount: (a: Omit<SocialAccount, "id">) => void;
  removeAccount: (id: string) => void;
  createInvite: (platform: Platform, clientName: string) => void;
  revokeInvite: (id: string) => void;
  /** Demo: simuliert, dass der Kunde den Link geöffnet und bestätigt hat */
  acceptInvite: (id: string) => void;
  savePost: (p: Omit<Post, "id"> & { id?: string }) => void;
  deletePost: (id: string) => void;
  setPlan: (p: PlanTier) => void;
  setAiMode: (m: AiMode) => void;
  buyCredits: (amount: number, label: string) => void;
  spendCredits: (amount: number, label: string) => boolean;
}

const StoreContext = createContext<Store | null>(null);

let nextId = 1;
function genId(prefix: string): string {
  return `${prefix}-${nextId++}-${Math.random().toString(36).slice(2, 7)}`;
}

function today(): string {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, "0")}.${String(
    d.getMonth() + 1
  ).padStart(2, "0")}.${d.getFullYear()}`;
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [accounts, setAccounts] = useState<SocialAccount[]>(DEMO_ACCOUNTS);
  const [posts, setPosts] = useState<Post[]>(() => buildDemoPosts());
  const [invites, setInvites] = useState<ConnectionInvite[]>([
    {
      id: "inv-demo-1",
      platform: "instagram",
      clientName: "Bäckerei Berger",
      token: "k3x9mq2v",
      status: "pending",
      createdAt: "02.07.2026",
    },
  ]);
  const [plan, setPlan] = useState<PlanTier>("pro");
  const [aiMode, setAiMode] = useState<AiMode>("credits");
  const [credits, setCredits] = useState(480);
  const [creditLog, setCreditLog] = useState<CreditEntry[]>(DEMO_CREDIT_LOG);

  const addAccount = useCallback((a: Omit<SocialAccount, "id">) => {
    setAccounts((prev) => [...prev, { ...a, id: genId("acc") }]);
  }, []);

  const removeAccount = useCallback((id: string) => {
    setAccounts((prev) => prev.filter((a) => a.id !== id));
    // Posts behalten, aber den entfernten Account aus den Zielen streichen
    setPosts((prev) =>
      prev.map((p) => ({
        ...p,
        accountIds: p.accountIds.filter((aid) => aid !== id),
      }))
    );
  }, []);

  const createInvite = useCallback((platform: Platform, clientName: string) => {
    setInvites((prev) => [
      {
        id: genId("inv"),
        platform,
        clientName,
        token: Math.random().toString(36).slice(2, 10),
        status: "pending" as const,
        createdAt: today(),
      },
      ...prev,
    ]);
  }, []);

  const revokeInvite = useCallback((id: string) => {
    setInvites((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const acceptInvite = useCallback((id: string) => {
    setInvites((prev) => {
      const inv = prev.find((i) => i.id === id);
      if (!inv || inv.status !== "pending") return prev;
      // In Produktion passiert das im OAuth-Callback des Kunden; hier simuliert
      setAccounts((accs) => [
        ...accs,
        {
          id: genId("acc"),
          platform: inv.platform,
          displayName: inv.clientName,
          handle: "@" + inv.clientName.toLowerCase().replace(/[^a-zä-ü0-9]+/gi, ""),
        },
      ]);
      return prev.map((i) => (i.id === id ? { ...i, status: "accepted" as const } : i));
    });
  }, []);

  const savePost = useCallback(
    (p: Omit<Post, "id"> & { id?: string }) => {
      setPosts((prev) => {
        if (p.id) {
          return prev.map((old) => (old.id === p.id ? { ...old, ...p, id: p.id } : old));
        }
        return [...prev, { ...p, id: genId("post") }];
      });
    },
    []
  );

  const deletePost = useCallback((id: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const buyCredits = useCallback((amount: number, label: string) => {
    setCredits((c) => c + amount);
    setCreditLog((log) => [
      { id: genId("ct"), label, amount, when: today() },
      ...log,
    ]);
  }, []);

  const spendCredits = useCallback(
    (amount: number, label: string): boolean => {
      let ok = false;
      setCredits((c) => {
        if (c < amount) return c;
        ok = true;
        return c - amount;
      });
      if (ok) {
        setCreditLog((log) => [
          { id: genId("ct"), label, amount: -amount, when: today() },
          ...log,
        ]);
      }
      return ok;
    },
    []
  );

  const value = useMemo<Store>(
    () => ({
      accounts,
      posts,
      invites,
      plan,
      aiMode,
      credits,
      creditLog,
      addAccount,
      removeAccount,
      createInvite,
      revokeInvite,
      acceptInvite,
      savePost,
      deletePost,
      setPlan,
      setAiMode,
      buyCredits,
      spendCredits,
    }),
    [
      accounts,
      posts,
      invites,
      plan,
      aiMode,
      credits,
      creditLog,
      addAccount,
      removeAccount,
      createInvite,
      revokeInvite,
      acceptInvite,
      savePost,
      deletePost,
      buyCredits,
      spendCredits,
    ]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore muss innerhalb von <StoreProvider> verwendet werden");
  return ctx;
}
