import "server-only";

// Leseschicht fürs CRM. Bewusst NICHT in crm-actions.ts ("use server"), weil
// getClientDetail einen workspaceId-Parameter hat — als Server Action wäre das
// ein offener Endpunkt (Client könnte fremde IDs übergeben). Hier ist es eine
// reine serverseitige Funktion, die nur vom authentifizierten Layout/Actions
// mit dem geprüften workspaceId aufgerufen wird.

import { db } from "./db";
import type { ClientDetail, InteractionKind, Platform } from "./types";

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Volles Kunden-Profil laden — immer workspace-gescoped. */
export async function getClientDetail(
  workspaceId: string,
  clientId: string
): Promise<ClientDetail | null> {
  const c = await db.client.findFirst({
    where: { id: clientId, workspaceId },
    include: {
      accounts: { orderBy: { connectedAt: "asc" } },
      contacts: { orderBy: { createdAt: "asc" } },
      tasks: { orderBy: [{ done: "asc" }, { createdAt: "asc" }] },
      interactions: { orderBy: { happenedAt: "desc" }, take: 100 },
      _count: { select: { posts: true } },
    },
  });
  if (!c) return null;
  return {
    id: c.id,
    name: c.name,
    color: c.color,
    company: c.company,
    website: c.website,
    notes: c.notes,
    goals: c.goals,
    audience: c.audience,
    topics: c.topics,
    brandColors: c.brandColors,
    fonts: c.fonts,
    hashtags: c.hashtags,
    accounts: c.accounts.map((a) => ({
      id: a.id,
      platform: a.platform as Platform,
      handle: a.handle,
    })),
    contacts: c.contacts.map((k) => ({
      id: k.id,
      name: k.name,
      role: k.role,
      email: k.email,
      phone: k.phone,
    })),
    followUpAt: c.followUpAt ? dateKey(c.followUpAt) : null,
    followUpNote: c.followUpNote,
    tasks: c.tasks.map((t) => ({
      id: t.id,
      title: t.title,
      done: t.done,
      dueDate: t.dueDate ? dateKey(t.dueDate) : null,
      createdAt: dateKey(t.createdAt),
    })),
    interactions: c.interactions.map((i) => ({
      id: i.id,
      kind: i.kind as InteractionKind,
      text: i.text,
      happenedAt: dateKey(i.happenedAt),
      createdBy: i.createdBy,
    })),
    postCount: c._count.posts,
  };
}
