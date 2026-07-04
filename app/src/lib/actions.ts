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
import { requireWorkspace } from "./auth";
import { encrypt } from "./crypto";
import { getWorkspaceBundle, WorkspaceBundle } from "./data";

export type ActionResult = {
  ok: boolean;
  error?: string;
  bundle?: WorkspaceBundle;
};

const PLATFORM_VALUES = [
  "instagram", "facebook", "tiktok", "linkedin", "youtube", "x", "pinterest",
] as const;

// Serverseitige Preislisten — bewusst nicht im Client
const CREDIT_PACKAGES: Record<string, { credits: number; label: string }> = {
  S: { credits: 500, label: "Credit-Paket S gekauft (Demo)" },
  M: { credits: 2000, label: "Credit-Paket M gekauft (Demo)" },
  L: { credits: 10000, label: "Credit-Paket L gekauft (Demo)" },
};
const USAGE_COSTS: Record<string, number> = { caption: 1, image: 6 };
const FORMAT_MAX_MEDIA: Record<string, number> = {
  text: 0, image: 1, video: 1, carousel: 10, story: 1,
};

async function ok(): Promise<ActionResult> {
  const { user, workspace } = await requireWorkspace();
  return {
    ok: true,
    bundle: await getWorkspaceBundle(workspace.id, { name: user.name, email: user.email }),
  };
}

function fail(error: string): ActionResult {
  return { ok: false, error };
}

// ── Posts ─────────────────────────────────────────────────────────────

const postSchema = z.object({
  id: z.string().optional(),
  body: z.string().trim().min(1, "Text fehlt").max(5000),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  accountIds: z.array(z.string()).min(1, "Mindestens ein Account"),
  status: z.enum(["draft", "scheduled"]),
  format: z.enum(["text", "image", "video", "carousel", "story"]),
  media: z
    .array(z.object({ id: z.string().nullable(), url: z.string().max(500) }))
    .max(10),
});

export async function savePostAction(input: unknown): Promise<ActionResult> {
  const { workspace } = await requireWorkspace();
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

  let postId = data.id;
  if (postId) {
    const existing = await db.post.findFirst({
      where: { id: postId, workspaceId: workspace.id },
    });
    if (!existing) return fail("Post nicht gefunden");
    await db.post.update({
      where: { id: postId },
      data: {
        body: data.body,
        format: data.format,
        scheduledAt,
        status: data.status,
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
        body: data.body,
        format: data.format,
        scheduledAt,
        status: data.status,
        accounts: { create: data.accountIds.map((accountId) => ({ accountId })) },
      },
    });
    postId = created.id;
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
    }
  }

  return ok();
}

export async function deletePostAction(id: string): Promise<ActionResult> {
  const { workspace } = await requireWorkspace();
  await db.post.deleteMany({ where: { id, workspaceId: workspace.id } });
  return ok();
}

// ── Social Accounts & Verbindungslinks ───────────────────────────────

const accountSchema = z.object({
  platform: z.enum(PLATFORM_VALUES),
  displayName: z.string().trim().min(1).max(100),
  handle: z.string().trim().min(1).max(100),
});

export async function addAccountAction(input: unknown): Promise<ActionResult> {
  const { workspace } = await requireWorkspace();
  const parsed = accountSchema.safeParse(input);
  if (!parsed.success) return fail("Bitte alle Felder ausfüllen");
  await db.socialAccount.create({
    data: { workspaceId: workspace.id, ...parsed.data },
  });
  return ok();
}

export async function removeAccountAction(id: string): Promise<ActionResult> {
  const { workspace } = await requireWorkspace();
  await db.socialAccount.deleteMany({ where: { id, workspaceId: workspace.id } });
  return ok();
}

const inviteSchema = z.object({
  platform: z.enum(PLATFORM_VALUES),
  clientName: z.string().trim().min(1).max(100),
});

export async function createInviteAction(input: unknown): Promise<ActionResult> {
  const { workspace } = await requireWorkspace();
  const parsed = inviteSchema.safeParse(input);
  if (!parsed.success) return fail("Bitte den Kundennamen eingeben");
  await db.connectionInvite.create({
    data: {
      workspaceId: workspace.id,
      platform: parsed.data.platform,
      clientName: parsed.data.clientName,
      token: randomBytes(16).toString("hex"),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });
  return ok();
}

export async function revokeInviteAction(id: string): Promise<ActionResult> {
  const { workspace } = await requireWorkspace();
  await db.connectionInvite.deleteMany({ where: { id, workspaceId: workspace.id } });
  return ok();
}

/** Demo-Simulation: In Phase 2 passiert das im OAuth-Callback des Kunden. */
export async function acceptInviteAction(id: string): Promise<ActionResult> {
  const { workspace } = await requireWorkspace();
  const invite = await db.connectionInvite.findFirst({
    where: { id, workspaceId: workspace.id, status: "pending" },
  });
  if (!invite) return fail("Einladung nicht gefunden");
  await db.$transaction([
    db.socialAccount.create({
      data: {
        workspaceId: workspace.id,
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

// ── KI-Einstellungen & Credits ────────────────────────────────────────

export async function setAiModeAction(mode: unknown): Promise<ActionResult> {
  const { workspace } = await requireWorkspace();
  const parsed = z.enum(["credits", "byo"]).safeParse(mode);
  if (!parsed.success) return fail("Ungültiger Modus");
  await db.workspace.update({
    where: { id: workspace.id },
    data: { aiMode: parsed.data },
  });
  return ok();
}

const keysSchema = z.object({
  anthropicKey: z.string().trim().max(300).optional(),
  openaiKey: z.string().trim().max(300).optional(),
});

export async function saveByoKeysAction(input: unknown): Promise<ActionResult> {
  const { workspace } = await requireWorkspace();
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
  const { workspace } = await requireWorkspace();
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
  const { workspace } = await requireWorkspace();
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
  const { workspace } = await requireWorkspace();
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
  const { workspace } = await requireWorkspace();
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
  const { workspace } = await requireWorkspace();
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
  const { workspace } = await requireWorkspace();
  // Phase 2: Kommentar zusätzlich über die Plattform-API löschen/verbergen
  await db.comment.deleteMany({ where: { id, workspaceId: workspace.id } });
  return ok();
}

/** Initial-Load für die App-Shell */
export async function loadBundleAction(): Promise<ActionResult> {
  return ok();
}
