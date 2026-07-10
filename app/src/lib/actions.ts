"use server";

// Alle Mutationen der App. Sicherheitsprinzipien:
// 1. Jede Action authentifiziert über requireWorkspace() — nie über Client-IDs.
// 2. Jede fremde Zeile wird gegen workspaceId geprüft, bevor sie angefasst wird.
// 3. Preise/Kosten (Credits) stehen NUR hier serverseitig — der Client schickt
//    Paket-/Aktions-IDs, niemals Beträge.
// 4. Eingaben werden mit zod validiert.

import { randomBytes } from "crypto";
import { z } from "zod";
import { db } from "./db";
import { requireWorkspace, setActiveWorkspace } from "./auth";
import { encrypt } from "./crypto";
import { getWorkspaceBundle, WorkspaceBundle } from "./data";
import { logActivity } from "./activity";
import { can, ROLE_LABELS, type Capability } from "./permissions";
import {
  accountSchema,
  changeRoleSchema,
  clientSchema,
  CREDIT_PACKAGES,
  FORMAT_MAX_MEDIA,
  inviteMemberSchema,
  inviteSchema,
  keysSchema,
  postSchema,
  USAGE_COSTS,
  wordpressAccountSchema,
} from "./schemas";

export type ActionResult = {
  ok: boolean;
  error?: string;
  bundle?: WorkspaceBundle;
};

type Ctx = Awaited<ReturnType<typeof requireWorkspace>>;

/**
 * Zentrale Rollenprüfung. Jede mutierende Action ruft dies auf; fehlt die
 * Berechtigung, kommt eine klare Meldung statt einer Mutation. Das ist die
 * harte, serverseitige Absicherung — die UI-Prüfung ist nur Komfort.
 */
async function guard(
  cap: Capability
): Promise<{ denied: ActionResult; ctx: null } | { denied: null; ctx: Ctx }> {
  const ctx = await requireWorkspace();
  if (!can(ctx.role, cap)) {
    return {
      denied: fail(
        `Für diese Aktion fehlt dir die Berechtigung (deine Rolle: ${ROLE_LABELS[ctx.role]}).`
      ),
      ctx: null,
    };
  }
  return { denied: null, ctx };
}

async function ok(): Promise<ActionResult> {
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

function fail(error: string): ActionResult {
  return { ok: false, error };
}

// ── Posts ─────────────────────────────────────────────────────────────

export async function savePostAction(input: unknown): Promise<ActionResult> {
  const g = await guard("content");
  if (g.denied) return g.denied;
  const { workspace, user } = g.ctx;
  const actorName = user.name;
  const parsed = postSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  const data = parsed.data;

  const media = data.media.slice(0, FORMAT_MAX_MEDIA[data.format]);

  // Accounts müssen zum Workspace gehören
  const ownedAccounts = await db.socialAccount.count({
    where: { id: { in: data.accountIds }, workspaceId: workspace.id },
  });
  if (ownedAccounts !== data.accountIds.length) return fail("Ungültige Account-Auswahl");

  const scheduledAt = new Date(`${data.date}T${data.time}:00`);
  if (isNaN(scheduledAt.getTime())) return fail("Ungültiger Termin");

  const clientId = await resolveClientId(workspace.id, data.clientId);

  // "review" -> Entwurf, der auf Freigabe wartet
  const isReview = data.status === "review";
  const dbStatus = isReview ? "draft" : data.status;
  const approval = isReview ? "pending" : "none";

  let postId = data.id;
  if (postId) {
    const existing = await db.post.findFirst({
      where: { id: postId, workspaceId: workspace.id },
    });
    if (!existing) return fail("Post nicht gefunden");
    await db.post.update({
      where: { id: postId },
      data: {
        title: data.format === "article" ? data.title?.trim() : null,
        body: data.body,
        clientId,
        format: data.format,
        scheduledAt,
        status: dbStatus,
        approval,
        approvalNote: isReview ? null : existing.approvalNote,
        submittedAt: isReview ? new Date() : existing.submittedAt,
        reminderMode: data.format === "video" ? !!data.reminderMode : false,
        reminderSentAt: null,
        accounts: {
          deleteMany: {},
          create: data.accountIds.map((accountId) => ({ accountId })),
        },
      },
    });
  } else {
    const created = await db.post.create({
      data: {
        workspaceId: workspace.id,
        clientId,
        title: data.format === "article" ? data.title?.trim() : null,
        body: data.body,
        format: data.format,
        scheduledAt,
        status: dbStatus,
        approval,
        submittedAt: isReview ? new Date() : null,
        reminderMode: data.format === "video" ? !!data.reminderMode : false,
        accounts: { create: data.accountIds.map((accountId) => ({ accountId })) },
      },
    });
    postId = created.id;
  }

  if (isReview) {
    await logActivity(workspace.id, actorName, "submitted", data.body);
  }

  // Medien synchronisieren: vorhandene Assets anhängen, Platzhalter anlegen,
  // entfernte lösen
  await db.mediaAsset.updateMany({
    where: { postId, workspaceId: workspace.id },
    data: { postId: null },
  });
  for (let i = 0; i < media.length; i++) {
    const item = media[i];
    if (item.id) {
      // nur eigene Assets anhängen
      await db.mediaAsset.updateMany({
        where: { id: item.id, workspaceId: workspace.id },
        data: { postId, sortOrder: i },
      });
    } else if (item.url.startsWith("placeholder:")) {
      await db.mediaAsset.create({
        data: {
          workspaceId: workspace.id,
          url: item.url,
          source: "placeholder",
          postId,
          sortOrder: i,
        },
      });
    } else if (/^https?:\/\//i.test(item.url)) {
      // externer Medien-Link (Dropbox/Drive/URL) — z. B. großes Video
      await db.mediaAsset.create({
        data: {
          workspaceId: workspace.id,
          url: item.url,
          kind: "video",
          source: "link",
          postId,
          sortOrder: i,
        },
      });
    }
  }

  return ok();
}

export async function deletePostAction(id: string): Promise<ActionResult> {
  const g = await guard("content");
  if (g.denied) return g.denied;
  const { workspace } = g.ctx;
  await db.post.deleteMany({ where: { id, workspaceId: workspace.id } });
  return ok();
}

/**
 * Erinnerungs-Modus: Nutzer:in hat manuell gepostet (Sound in der App
 * gewählt) — bestätigt eine fällige Erinnerung als erledigt.
 */
export async function markReminderPostedAction(id: string): Promise<ActionResult> {
  const g = await guard("content");
  if (g.denied) return g.denied;
  const { workspace, user } = g.ctx;
  const post = await db.post.findFirst({
    where: { id, workspaceId: workspace.id, reminderMode: true, reminderSentAt: { not: null } },
  });
  if (!post) return fail("Erinnerung nicht gefunden");

  await db.$transaction([
    db.post.update({ where: { id }, data: { status: "published" } }),
    db.postAccount.updateMany({
      where: { postId: id, publishedAt: null },
      data: { publishedAt: new Date() },
    }),
  ]);
  await logActivity(workspace.id, user.name, "published", post.body);
  return ok();
}

/**
 * Kanban-Board: einen Beitrag in eine andere Pipeline-Spalte ziehen.
 * Spalten = draft (Entwurf) · review (In Freigabe) · scheduled (Geplant).
 * „Veröffentlicht" ist kein Ziel (das macht nur der Scheduler zur geplanten Zeit).
 * Berechtigung ist kontextabhängig: einen wartenden Beitrag freizugeben
 * (→ Geplant) verlangt „approve", alles andere „content".
 */
export async function movePostAction(id: string, column: unknown): Promise<ActionResult> {
  const parsedCol = z.enum(["draft", "review", "scheduled"]).safeParse(column);
  if (!parsedCol.success) return fail("Ungültige Spalte");
  const target = parsedCol.data;

  const { workspace, user, role } = await requireWorkspace();
  const post = await db.post.findFirst({ where: { id, workspaceId: workspace.id } });
  if (!post) return fail("Beitrag nicht gefunden");
  if (post.status === "published") {
    return fail("Veröffentlichte Beiträge können nicht verschoben werden.");
  }

  // Einen wartenden Beitrag freizugeben ist eine Freigabe-Aktion
  const isApproval = target === "scheduled" && post.approval === "pending";
  const neededCap: Capability = isApproval ? "approve" : "content";
  if (!can(role, neededCap)) {
    return fail(`Für diesen Schritt fehlt dir die Berechtigung (deine Rolle: ${ROLE_LABELS[role]}).`);
  }

  if (target === "draft") {
    await db.post.update({
      where: { id },
      data: { status: "draft", approval: "none", approvalNote: null },
    });
  } else if (target === "review") {
    await db.post.update({
      where: { id },
      data: { status: "draft", approval: "pending", submittedAt: new Date(), approvalNote: null },
    });
    await logActivity(workspace.id, user.name, "submitted", post.body);
  } else {
    // → Geplant
    const approval = isApproval ? "approved" : post.approval === "approved" ? "approved" : "none";
    await db.post.update({
      where: { id },
      data: {
        status: "scheduled",
        approval,
        approvalNote: null,
        decidedAt: isApproval ? new Date() : post.decidedAt,
      },
    });
    if (isApproval) await logActivity(workspace.id, user.name, "approved", post.body);
  }
  return ok();
}

// ── Social Accounts & Verbindungslinks ───────────────────────────────

export async function addAccountAction(input: unknown): Promise<ActionResult> {
  const g = await guard("accounts");
  if (g.denied) return g.denied;
  const { workspace } = g.ctx;
  const parsed = accountSchema.safeParse(input);
  if (!parsed.success) return fail("Bitte alle Felder ausfüllen");
  const { clientId, ...rest } = parsed.data;
  const validClientId = await resolveClientId(workspace.id, clientId);
  await db.socialAccount.create({
    data: { workspaceId: workspace.id, ...rest, clientId: validClientId },
  });
  return ok();
}

/**
 * WordPress verbinden — anders als die Social-"Selbst einloggen"-Demo prüfen
 * wir die Zugangsdaten (Website-URL + Anwendungskennwort) hier sofort per
 * echtem API-Call, bevor sie verschlüsselt gespeichert werden. Kein App-Review
 * nötig — funktioniert sofort, wenn PUBLISH_MODE=live gesetzt ist.
 */
export async function addWordPressAccountAction(input: unknown): Promise<ActionResult> {
  const g = await guard("accounts");
  if (g.denied) return g.denied;
  const { workspace } = g.ctx;
  const parsed = wordpressAccountSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  const { displayName, siteUrl, username, appPassword, clientId } = parsed.data;
  const normalizedUrl = siteUrl.replace(/\/+$/, "");

  let res: Response;
  try {
    res = await fetch(`${normalizedUrl}/wp-json/wp/v2/users/me`, {
      headers: {
        Authorization: `Basic ${Buffer.from(`${username}:${appPassword}`).toString("base64")}`,
      },
      signal: AbortSignal.timeout(8_000),
    });
  } catch {
    return fail(`Website unter ${normalizedUrl} nicht erreichbar — URL prüfen.`);
  }
  if (!res.ok) {
    return fail(
      res.status === 401
        ? "Zugangsdaten abgelehnt — Benutzername oder Anwendungskennwort prüfen."
        : `WordPress hat mit Status ${res.status} geantwortet — ist die REST API aktiv?`
    );
  }

  const validClientId = await resolveClientId(workspace.id, clientId);
  await db.socialAccount.create({
    data: {
      workspaceId: workspace.id,
      clientId: validClientId,
      platform: "wordpress",
      displayName,
      handle: normalizedUrl,
      accessTokenEnc: encrypt(`${username}:${appPassword}`),
    },
  });
  return ok();
}

/** Prüft, dass eine clientId (falls gesetzt) zum Workspace gehört; sonst null. */
async function resolveClientId(
  workspaceId: string,
  clientId: string | null | undefined
): Promise<string | null> {
  if (!clientId) return null;
  const client = await db.client.findFirst({ where: { id: clientId, workspaceId } });
  return client ? client.id : null;
}

export async function removeAccountAction(id: string): Promise<ActionResult> {
  const g = await guard("accounts");
  if (g.denied) return g.denied;
  const { workspace } = g.ctx;
  await db.socialAccount.deleteMany({ where: { id, workspaceId: workspace.id } });
  return ok();
}

export async function createInviteAction(input: unknown): Promise<ActionResult> {
  const g = await guard("accounts");
  if (g.denied) return g.denied;
  const { workspace } = g.ctx;
  const parsed = inviteSchema.safeParse(input);
  if (!parsed.success) return fail("Bitte den Kundennamen eingeben");
  const validClientId = await resolveClientId(workspace.id, parsed.data.clientId);
  await db.connectionInvite.create({
    data: {
      workspaceId: workspace.id,
      platform: parsed.data.platform,
      clientName: parsed.data.clientName,
      clientId: validClientId,
      token: randomBytes(16).toString("hex"),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });
  return ok();
}

export async function revokeInviteAction(id: string): Promise<ActionResult> {
  const g = await guard("accounts");
  if (g.denied) return g.denied;
  const { workspace } = g.ctx;
  await db.connectionInvite.deleteMany({ where: { id, workspaceId: workspace.id } });
  return ok();
}

/** Demo-Simulation: In Phase 2 passiert das im OAuth-Callback des Kunden. */
export async function acceptInviteAction(id: string): Promise<ActionResult> {
  const g = await guard("accounts");
  if (g.denied) return g.denied;
  const { workspace } = g.ctx;
  const invite = await db.connectionInvite.findFirst({
    where: { id, workspaceId: workspace.id, status: "pending" },
  });
  if (!invite) return fail("Einladung nicht gefunden");
  await db.$transaction([
    db.socialAccount.create({
      data: {
        workspaceId: workspace.id,
        clientId: invite.clientId,
        platform: invite.platform,
        displayName: invite.clientName,
        handle: "@" + invite.clientName.toLowerCase().replace(/[^a-zä-ü0-9]+/gi, ""),
      },
    }),
    db.connectionInvite.update({
      where: { id: invite.id },
      data: { status: "accepted", acceptedAt: new Date() },
    }),
  ]);
  return ok();
}

// ── Kunden (Mandanten der Agentur) ────────────────────────────────────

export async function createClientAction(input: unknown): Promise<ActionResult> {
  const g = await guard("accounts");
  if (g.denied) return g.denied;
  const { workspace } = g.ctx;
  const parsed = clientSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  await db.client.create({
    data: {
      workspaceId: workspace.id,
      name: parsed.data.name,
      color: parsed.data.color ?? "#2563eb",
    },
  });
  return ok();
}

export async function updateClientAction(id: string, input: unknown): Promise<ActionResult> {
  const g = await guard("accounts");
  if (g.denied) return g.denied;
  const { workspace } = g.ctx;
  const parsed = clientSchema.partial().safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  const owned = await db.client.findFirst({ where: { id, workspaceId: workspace.id } });
  if (!owned) return fail("Kunde nicht gefunden");
  await db.client.update({
    where: { id },
    data: {
      ...(parsed.data.name ? { name: parsed.data.name } : {}),
      ...(parsed.data.color ? { color: parsed.data.color } : {}),
    },
  });
  return ok();
}

/** Kunde löschen — seine Accounts/Posts bleiben erhalten (werden „ohne Kunde"). */
export async function deleteClientAction(id: string): Promise<ActionResult> {
  const g = await guard("accounts");
  if (g.denied) return g.denied;
  const { workspace } = g.ctx;
  await db.client.deleteMany({ where: { id, workspaceId: workspace.id } });
  return ok();
}

/** Einen Account einem Kunden zuordnen (oder mit null die Zuordnung lösen). */
export async function assignAccountAction(
  accountId: string,
  clientId: unknown
): Promise<ActionResult> {
  const g = await guard("accounts");
  if (g.denied) return g.denied;
  const { workspace } = g.ctx;
  const parsed = z.string().nullable().safeParse(clientId);
  if (!parsed.success) return fail("Ungültige Auswahl");

  // Zielkunde muss zum Workspace gehören
  if (parsed.data) {
    const client = await db.client.findFirst({
      where: { id: parsed.data, workspaceId: workspace.id },
    });
    if (!client) return fail("Kunde nicht gefunden");
  }
  await db.socialAccount.updateMany({
    where: { id: accountId, workspaceId: workspace.id },
    data: { clientId: parsed.data },
  });
  return ok();
}

// ── KI-Einstellungen & Credits ────────────────────────────────────────

export async function setAiModeAction(mode: unknown): Promise<ActionResult> {
  const g = await guard("ai_settings");
  if (g.denied) return g.denied;
  const { workspace } = g.ctx;
  const parsed = z.enum(["credits", "byo"]).safeParse(mode);
  if (!parsed.success) return fail("Ungültiger Modus");
  await db.workspace.update({
    where: { id: workspace.id },
    data: { aiMode: parsed.data },
  });
  return ok();
}

export async function saveByoKeysAction(input: unknown): Promise<ActionResult> {
  const g = await guard("ai_settings");
  if (g.denied) return g.denied;
  const { workspace } = g.ctx;
  const parsed = keysSchema.safeParse(input);
  if (!parsed.success) return fail("Ungültige Eingabe");
  const { anthropicKey, openaiKey } = parsed.data;
  if (!anthropicKey && !openaiKey) return fail("Bitte mindestens einen Key eingeben");
  await db.workspace.update({
    where: { id: workspace.id },
    data: {
      ...(anthropicKey ? { anthropicKeyEnc: encrypt(anthropicKey) } : {}),
      ...(openaiKey ? { openaiKeyEnc: encrypt(openaiKey) } : {}),
    },
  });
  return ok();
}

export async function setPlanAction(plan: unknown): Promise<ActionResult> {
  const g = await guard("billing");
  if (g.denied) return g.denied;
  const { workspace } = g.ctx;
  const parsed = z.enum(["starter", "pro", "agency"]).safeParse(plan);
  if (!parsed.success) return fail("Ungültiger Tarif");
  // Phase 3: hier startet später der Stripe-Checkout/Portal-Flow
  await db.workspace.update({
    where: { id: workspace.id },
    data: { plan: parsed.data },
  });
  return ok();
}

export async function buyCreditsAction(packageId: unknown): Promise<ActionResult> {
  const g = await guard("billing");
  if (g.denied) return g.denied;
  const { workspace } = g.ctx;
  const pkg = CREDIT_PACKAGES[String(packageId)];
  if (!pkg) return fail("Unbekanntes Paket");
  // Phase 3: erst nach erfolgreichem Stripe-Payment gutschreiben
  await db.workspace.update({
    where: { id: workspace.id },
    data: {
      creditBalance: { increment: pkg.credits },
      creditTransactions: {
        create: { type: "purchase", amount: pkg.credits, description: pkg.label },
      },
    },
  });
  return ok();
}

/** Credits verbrauchen — atomar, kann nie unter 0 fallen. */
export async function spendCreditsAction(
  kind: unknown,
  label: unknown
): Promise<ActionResult> {
  const g = await guard("content");
  if (g.denied) return g.denied;
  const { workspace } = g.ctx;
  const parsedKind = z.enum(["caption", "image"]).safeParse(kind);
  const parsedLabel = z.string().trim().min(1).max(120).safeParse(label);
  if (!parsedKind.success || !parsedLabel.success) return fail("Ungültige Anfrage");

  if (workspace.aiMode === "byo") return ok(); // läuft über den Kunden-Key

  const cost = USAGE_COSTS[parsedKind.data];
  // updateMany mit Guard = atomare Prüfung + Abzug in einem Statement
  const res = await db.workspace.updateMany({
    where: { id: workspace.id, creditBalance: { gte: cost } },
    data: { creditBalance: { decrement: cost } },
  });
  if (res.count === 0) return fail("Nicht genug Credits");

  await db.creditTransaction.create({
    data: {
      workspaceId: workspace.id,
      type: parsedKind.data === "caption" ? "usage_text" : "usage_image",
      amount: -cost,
      description: parsedLabel.data,
    },
  });
  return ok();
}

// ── Kommentare (Inbox) ────────────────────────────────────────────────

export async function toggleCommentLikeAction(id: string): Promise<ActionResult> {
  const g = await guard("content");
  if (g.denied) return g.denied;
  const { workspace } = g.ctx;
  const comment = await db.comment.findFirst({
    where: { id, workspaceId: workspace.id },
  });
  if (!comment) return fail("Kommentar nicht gefunden");
  // Phase 2: zusätzlich Like über die Plattform-API setzen/entfernen
  await db.comment.update({
    where: { id },
    data: { likedByUs: !comment.likedByUs },
  });
  return ok();
}

export async function replyCommentAction(
  id: string,
  text: unknown
): Promise<ActionResult> {
  const g = await guard("content");
  if (g.denied) return g.denied;
  const { workspace } = g.ctx;
  const parsed = z.string().trim().min(1, "Antwort fehlt").max(2000).safeParse(text);
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  const comment = await db.comment.findFirst({
    where: { id, workspaceId: workspace.id },
  });
  if (!comment) return fail("Kommentar nicht gefunden");
  // Phase 2: Antwort zusätzlich über die Plattform-API veröffentlichen
  await db.comment.create({
    data: {
      workspaceId: workspace.id,
      postId: comment.postId,
      parentId: comment.id,
      author: "Du",
      text: parsed.data,
      isOwnReply: true,
    },
  });
  return ok();
}

export async function deleteCommentAction(id: string): Promise<ActionResult> {
  const g = await guard("content");
  if (g.denied) return g.denied;
  const { workspace } = g.ctx;
  // Phase 2: Kommentar zusätzlich über die Plattform-API löschen/verbergen
  await db.comment.deleteMany({ where: { id, workspaceId: workspace.id } });
  return ok();
}

// ── Freigabe-Workflow (Phase 7) ───────────────────────────────────────

/** Beitrag freigeben → wird geplant und vom Scheduler veröffentlicht. */
export async function approvePostAction(id: string): Promise<ActionResult> {
  const g = await guard("approve");
  if (g.denied) return g.denied;
  const { workspace, user } = g.ctx;
  const post = await db.post.findFirst({
    where: { id, workspaceId: workspace.id, approval: "pending" },
  });
  if (!post) return fail("Beitrag nicht gefunden oder nicht in Freigabe");
  await db.post.update({
    where: { id },
    data: { approval: "approved", status: "scheduled", decidedAt: new Date(), approvalNote: null },
  });
  await logActivity(workspace.id, user.name, "approved", post.body);
  return ok();
}

const noteSchema = z.string().trim().max(1000).optional();

/** Änderungen erbeten → zurück an den Ersteller, mit optionalem Kommentar. */
export async function requestChangesAction(
  id: string,
  note: unknown
): Promise<ActionResult> {
  const g = await guard("approve");
  if (g.denied) return g.denied;
  const { workspace, user } = g.ctx;
  const parsedNote = noteSchema.safeParse(note);
  if (!parsedNote.success) return fail("Kommentar zu lang");
  const post = await db.post.findFirst({
    where: { id, workspaceId: workspace.id, approval: "pending" },
  });
  if (!post) return fail("Beitrag nicht gefunden oder nicht in Freigabe");
  await db.post.update({
    where: { id },
    data: {
      approval: "changes_requested",
      status: "draft",
      decidedAt: new Date(),
      approvalNote: parsedNote.data || null,
    },
  });
  await logActivity(workspace.id, user.name, "changes_requested", post.body);
  return ok();
}

const clientNameSchema = z.string().trim().min(1).max(100);

/** Kunden-Freigabelink erstellen (7 Tage gültig). */
export async function createReviewLinkAction(clientName: unknown): Promise<ActionResult> {
  const g = await guard("approve");
  if (g.denied) return g.denied;
  const { workspace } = g.ctx;
  const parsed = clientNameSchema.safeParse(clientName);
  if (!parsed.success) return fail("Bitte einen Kundennamen eingeben");
  await db.reviewLink.create({
    data: {
      workspaceId: workspace.id,
      clientName: parsed.data,
      token: randomBytes(16).toString("hex"),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });
  return ok();
}

export async function revokeReviewLinkAction(id: string): Promise<ActionResult> {
  const g = await guard("approve");
  if (g.denied) return g.denied;
  const { workspace } = g.ctx;
  await db.reviewLink.deleteMany({ where: { id, workspaceId: workspace.id } });
  return ok();
}

// ── Team & Rollen (Phase 7b) ──────────────────────────────────────────

/** Teammitglied per E-Mail einladen — erzeugt einen 7 Tage gültigen Link. */
export async function inviteMemberAction(input: unknown): Promise<ActionResult> {
  const g = await guard("team");
  if (g.denied) return g.denied;
  const { workspace, user } = g.ctx;
  const parsed = inviteMemberSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0].message);

  // Ist die Adresse schon Mitglied?
  const existingUser = await db.user.findUnique({ where: { email: parsed.data.email } });
  if (existingUser) {
    const member = await db.workspaceMember.findFirst({
      where: { workspaceId: workspace.id, userId: existingUser.id },
    });
    if (member) return fail("Diese Person ist bereits Mitglied dieses Workspace.");
  }

  await db.teamInvite.create({
    data: {
      workspaceId: workspace.id,
      email: parsed.data.email,
      role: parsed.data.role,
      token: randomBytes(16).toString("hex"),
      invitedBy: user.name,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });
  return ok();
}

export async function revokeTeamInviteAction(id: string): Promise<ActionResult> {
  const g = await guard("team");
  if (g.denied) return g.denied;
  const { workspace } = g.ctx;
  await db.teamInvite.updateMany({
    where: { id, workspaceId: workspace.id, status: "pending" },
    data: { status: "revoked" },
  });
  return ok();
}

/** Rolle eines Mitglieds ändern — der Inhaber ist unveränderlich. */
export async function changeMemberRoleAction(input: unknown): Promise<ActionResult> {
  const g = await guard("team");
  if (g.denied) return g.denied;
  const { workspace, user } = g.ctx;
  const parsed = changeRoleSchema.safeParse(input);
  if (!parsed.success) return fail("Ungültige Eingabe");

  const member = await db.workspaceMember.findFirst({
    where: { id: parsed.data.memberId, workspaceId: workspace.id },
  });
  if (!member) return fail("Mitglied nicht gefunden");
  if (member.userId === user.id) return fail("Die eigene Rolle kann nicht geändert werden.");
  if (member.role === "owner") return fail("Die Rolle des Inhabers kann nicht geändert werden.");

  await db.workspaceMember.update({
    where: { id: member.id },
    data: { role: parsed.data.role },
  });
  return ok();
}

/** Mitglied entfernen — Inhaber und man selbst sind ausgenommen. */
export async function removeMemberAction(memberId: string): Promise<ActionResult> {
  const g = await guard("team");
  if (g.denied) return g.denied;
  const { workspace, user } = g.ctx;

  const member = await db.workspaceMember.findFirst({
    where: { id: memberId, workspaceId: workspace.id },
  });
  if (!member) return fail("Mitglied nicht gefunden");
  if (member.role === "owner") return fail("Der Inhaber kann nicht entfernt werden.");
  if (member.userId === user.id) return fail("Zum Selbst-Entfernen bitte „Workspace verlassen“ nutzen.");

  await db.workspaceMember.delete({ where: { id: member.id } });
  return ok();
}

/** Aktiven Workspace wechseln (nur eigene Mitgliedschaften). */
export async function switchWorkspaceAction(workspaceId: unknown): Promise<ActionResult> {
  const parsed = z.string().safeParse(workspaceId);
  if (!parsed.success) return fail("Ungültige Auswahl");
  const switched = await setActiveWorkspace(parsed.data);
  if (!switched) return fail("Kein Zugriff auf diesen Workspace.");
  return ok();
}

/** Workspace verlassen — der Inhaber kann nicht verlassen. */
export async function leaveWorkspaceAction(): Promise<ActionResult> {
  const { workspace, user, role, memberships } = await requireWorkspace();
  if (role === "owner") {
    return fail("Als Inhaber kannst du den Workspace nicht verlassen.");
  }
  if (memberships.length <= 1) {
    return fail("Das ist dein einziger Workspace — verlassen nicht möglich.");
  }
  await db.workspaceMember.deleteMany({
    where: { workspaceId: workspace.id, userId: user.id },
  });
  // auf einen verbleibenden Workspace wechseln
  const next = memberships.find((m) => m.workspaceId !== workspace.id);
  if (next) await setActiveWorkspace(next.workspaceId);
  return ok();
}

/** Initial-Load für die App-Shell */
export async function loadBundleAction(): Promise<ActionResult> {
  return ok();
}
