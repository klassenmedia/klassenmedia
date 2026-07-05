"use server";

// CRM: schlankes Kunden-Profil (Stammdaten, Ansprechpartner, Notizen, To-dos).
// Sicherheit wie überall: Auth über requireWorkspace(), Rollen-Check ("accounts"),
// jede fremde ID wird gegen den Workspace geprüft, Eingaben via zod.

import { z } from "zod";
import { db } from "./db";
import { requireWorkspace } from "./auth";
import { can } from "./permissions";
import { getClientDetail } from "./crm-data";
import type { ClientDetail } from "./types";

export type CrmResult = { ok: boolean; error?: string; detail?: ClientDetail };

/** Kontext holen + Rolle prüfen + sicherstellen, dass der Kunde zum WS gehört. */
async function ctxForClient(clientId: string) {
  const { workspace, role } = await requireWorkspace();
  if (!can(role, "accounts")) {
    return { error: "Für diese Aktion fehlt dir die Berechtigung." as string, workspaceId: "" };
  }
  const client = await db.client.findFirst({ where: { id: clientId, workspaceId: workspace.id } });
  if (!client) return { error: "Kunde nicht gefunden", workspaceId: "" };
  return { error: null as string | null, workspaceId: workspace.id };
}

async function detailResult(workspaceId: string, clientId: string): Promise<CrmResult> {
  const detail = await getClientDetail(workspaceId, clientId);
  return detail ? { ok: true, detail } : { ok: false, error: "Kunde nicht gefunden" };
}

const profileSchema = z.object({
  company: z.string().trim().max(120).optional(),
  website: z.string().trim().max(200).optional(),
  notes: z.string().trim().max(5000).optional(),
  goals: z.string().trim().max(2000).optional(),
  audience: z.string().trim().max(2000).optional(),
  topics: z.string().trim().max(2000).optional(),
  brandColors: z.string().trim().max(500).optional(),
  fonts: z.string().trim().max(500).optional(),
  hashtags: z.string().trim().max(2000).optional(),
});

export async function updateClientProfileAction(
  clientId: string,
  input: unknown
): Promise<CrmResult> {
  const ctx = await ctxForClient(clientId);
  if (ctx.error) return { ok: false, error: ctx.error };
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const d = parsed.data;
  await db.client.update({
    where: { id: clientId },
    data: {
      company: d.company ?? null,
      website: d.website ?? null,
      notes: d.notes ?? null,
      goals: d.goals ?? null,
      audience: d.audience ?? null,
      topics: d.topics ?? null,
      brandColors: d.brandColors ?? null,
      fonts: d.fonts ?? null,
      hashtags: d.hashtags ?? null,
    },
  });
  return detailResult(ctx.workspaceId, clientId);
}

const contactSchema = z.object({
  name: z.string().trim().min(1, "Name fehlt").max(120),
  role: z.string().trim().max(120).optional(),
  email: z.string().trim().max(200).optional(),
  phone: z.string().trim().max(60).optional(),
});

export async function addContactAction(clientId: string, input: unknown): Promise<CrmResult> {
  const ctx = await ctxForClient(clientId);
  if (ctx.error) return { ok: false, error: ctx.error };
  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  await db.clientContact.create({
    data: {
      clientId,
      name: parsed.data.name,
      role: parsed.data.role || null,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
    },
  });
  return detailResult(ctx.workspaceId, clientId);
}

export async function deleteContactAction(contactId: string): Promise<CrmResult> {
  const { workspace, role } = await requireWorkspace();
  if (!can(role, "accounts")) return { ok: false, error: "Keine Berechtigung." };
  // Nur löschen, wenn der Kontakt zu einem Kunden dieses Workspace gehört
  const contact = await db.clientContact.findFirst({
    where: { id: contactId, client: { workspaceId: workspace.id } },
  });
  if (!contact) return { ok: false, error: "Kontakt nicht gefunden" };
  await db.clientContact.delete({ where: { id: contactId } });
  return detailResult(workspace.id, contact.clientId);
}

const taskSchema = z.object({
  title: z.string().trim().min(1, "Aufgabe fehlt").max(200),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export async function addTaskAction(clientId: string, input: unknown): Promise<CrmResult> {
  const ctx = await ctxForClient(clientId);
  if (ctx.error) return { ok: false, error: ctx.error };
  const parsed = taskSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  await db.clientTask.create({
    data: {
      clientId,
      title: parsed.data.title,
      dueDate: parsed.data.dueDate ? new Date(`${parsed.data.dueDate}T00:00:00`) : null,
    },
  });
  return detailResult(ctx.workspaceId, clientId);
}

export async function toggleTaskAction(taskId: string): Promise<CrmResult> {
  const { workspace, role } = await requireWorkspace();
  if (!can(role, "accounts")) return { ok: false, error: "Keine Berechtigung." };
  const task = await db.clientTask.findFirst({
    where: { id: taskId, client: { workspaceId: workspace.id } },
  });
  if (!task) return { ok: false, error: "Aufgabe nicht gefunden" };
  await db.clientTask.update({ where: { id: taskId }, data: { done: !task.done } });
  return detailResult(workspace.id, task.clientId);
}

export async function deleteTaskAction(taskId: string): Promise<CrmResult> {
  const { workspace, role } = await requireWorkspace();
  if (!can(role, "accounts")) return { ok: false, error: "Keine Berechtigung." };
  const task = await db.clientTask.findFirst({
    where: { id: taskId, client: { workspaceId: workspace.id } },
  });
  if (!task) return { ok: false, error: "Aufgabe nicht gefunden" };
  await db.clientTask.delete({ where: { id: taskId } });
  return detailResult(workspace.id, task.clientId);
}
