"use server";

// Echte-KI-Actions (Phase 4). Sicherheitsprinzipien wie in actions.ts:
//   • Auth über requireWorkspace(), nie über Client-IDs.
//   • Kosten (Credits) stehen NUR hier serverseitig.
//   • Credits werden ausschließlich bei einem echten, erfolgreichen KI-Aufruf
//     im "credits"-Modus abgezogen. BYO verbraucht nie Credits. Fällt der
//     Aufruf mangels Key auf einen Demo-Platzhalter zurück, kostet das nichts.
//   • BYO-Keys werden nur im Provider-Modul entschlüsselt, nie hier geloggt.

import { z } from "zod";
import { db } from "./db";
import { requireWorkspace } from "./auth";
import { getWorkspaceBundle, WorkspaceBundle } from "./data";
import { AI_CAPTION_IDEAS } from "./demo-data";
import { PLATFORMS, type Platform } from "./types";
import {
  AiError,
  generateCaption,
  generateIdeas,
  generateImageFile,
  imageReady,
  textReady,
} from "./ai/generate";

const USAGE_COSTS = { caption: 1, image: 6 } as const;

const PLATFORM_KEYS = Object.keys(PLATFORMS) as [Platform, ...Platform[]];

export type CaptionResult = {
  ok: boolean;
  error?: string;
  text?: string;
  /** "ai" = echt generiert · "demo" = Platzhalter, kein Key hinterlegt */
  source?: "ai" | "demo";
  bundle?: WorkspaceBundle;
};

export type IdeasResult = {
  ok: boolean;
  error?: string;
  ideas?: string[];
  source?: "ai" | "demo";
  bundle?: WorkspaceBundle;
};

export type ImageResult = {
  ok: boolean;
  error?: string;
  url?: string;
  source?: "ai" | "demo";
  bundle?: WorkspaceBundle;
};

async function bundleFor(workspaceId: string, user: { name: string; email: string }) {
  return getWorkspaceBundle(workspaceId, user);
}

/** Prüft das Guthaben, ohne abzubuchen. */
async function hasBalance(workspaceId: string, cost: number): Promise<boolean> {
  const ws = await db.workspace.findUniqueOrThrow({ where: { id: workspaceId } });
  return ws.creditBalance >= cost;
}

/** Atomarer Abzug mit Guard — kann nie unter 0 fallen. */
async function chargeCredits(
  workspaceId: string,
  cost: number,
  type: "usage_text" | "usage_image",
  label: string
): Promise<boolean> {
  const res = await db.workspace.updateMany({
    where: { id: workspaceId, creditBalance: { gte: cost } },
    data: { creditBalance: { decrement: cost } },
  });
  if (res.count === 0) return false;
  await db.creditTransaction.create({
    data: { workspaceId, type, amount: -cost, description: label },
  });
  return true;
}

const captionSchema = z.object({
  topic: z.string().trim().min(1, "Bitte ein Thema oder ein paar Stichworte angeben").max(1000),
  platform: z.enum(PLATFORM_KEYS).optional(),
});

function sample(list: string[], i = 0): string {
  // deterministisch genug, ohne Math.random im Serverkontext zu brauchen
  return list[(Date.now() + i) % list.length];
}

// ── Caption (Text via Claude) ─────────────────────────────────────────

export async function generateCaptionAction(input: unknown): Promise<CaptionResult> {
  const { workspace, user } = await requireWorkspace();
  const parsed = captionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const u = { name: user.name, email: user.email };

  // Kein Key → Demo-Platzhalter, ohne Credits
  if (!textReady(workspace)) {
    return {
      ok: true,
      text: sample(AI_CAPTION_IDEAS),
      source: "demo",
      bundle: await bundleFor(workspace.id, u),
    };
  }

  const isCredits = workspace.aiMode !== "byo";
  if (isCredits && !(await hasBalance(workspace.id, USAGE_COSTS.caption))) {
    return { ok: false, error: "Nicht genug Credits — im KI-Studio aufladen oder eigenen Key hinterlegen." };
  }

  let text: string;
  try {
    text = await generateCaption(workspace, parsed.data);
  } catch (e) {
    return { ok: false, error: e instanceof AiError ? e.message : "KI-Dienst nicht erreichbar." };
  }

  if (isCredits) {
    const charged = await chargeCredits(
      workspace.id,
      USAGE_COSTS.caption,
      "usage_text",
      "Caption generiert (Claude)"
    );
    if (!charged) return { ok: false, error: "Nicht genug Credits." };
  }

  return { ok: true, text, source: "ai", bundle: await bundleFor(workspace.id, u) };
}

// ── Content-Ideen (mehrere Captions) ──────────────────────────────────

export async function generateIdeasAction(input: unknown): Promise<IdeasResult> {
  const { workspace, user } = await requireWorkspace();
  const parsed = captionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const u = { name: user.name, email: user.email };

  if (!textReady(workspace)) {
    return {
      ok: true,
      ideas: AI_CAPTION_IDEAS,
      source: "demo",
      bundle: await bundleFor(workspace.id, u),
    };
  }

  const isCredits = workspace.aiMode !== "byo";
  if (isCredits && !(await hasBalance(workspace.id, USAGE_COSTS.caption))) {
    return { ok: false, error: "Nicht genug Credits — im KI-Studio aufladen oder eigenen Key hinterlegen." };
  }

  let ideas: string[];
  try {
    ideas = await generateIdeas(workspace, { ...parsed.data, count: 5 });
  } catch (e) {
    return { ok: false, error: e instanceof AiError ? e.message : "KI-Dienst nicht erreichbar." };
  }

  if (isCredits) {
    const charged = await chargeCredits(
      workspace.id,
      USAGE_COSTS.caption,
      "usage_text",
      "Content-Ideen generiert (Claude)"
    );
    if (!charged) return { ok: false, error: "Nicht genug Credits." };
  }

  return { ok: true, ideas, source: "ai", bundle: await bundleFor(workspace.id, u) };
}

// ── Bild (via OpenAI) ─────────────────────────────────────────────────

const imageSchema = z.string().trim().min(1, "Bitte beschreibe das gewünschte Bild").max(1000);

export async function generateImageAction(input: unknown): Promise<ImageResult> {
  const { workspace, user } = await requireWorkspace();
  const parsed = imageSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const prompt = parsed.data;
  const u = { name: user.name, email: user.email };

  // Kein Key → Demo-Platzhalter, ohne Credits
  if (!imageReady(workspace)) {
    const hue = (prompt.length * 37) % 360;
    return {
      ok: true,
      url: `placeholder:${hue}`,
      source: "demo",
      bundle: await bundleFor(workspace.id, u),
    };
  }

  const isCredits = workspace.aiMode !== "byo";
  if (isCredits && !(await hasBalance(workspace.id, USAGE_COSTS.image))) {
    return { ok: false, error: "Nicht genug Credits — im KI-Studio aufladen oder eigenen Key hinterlegen." };
  }

  let file: { url: string; bytes: number };
  try {
    file = await generateImageFile(workspace, prompt);
  } catch (e) {
    return { ok: false, error: e instanceof AiError ? e.message : "Bild-Dienst nicht erreichbar." };
  }

  // In der Medienbibliothek als KI-Asset ablegen
  await db.mediaAsset.create({
    data: { workspaceId: workspace.id, url: file.url, kind: "image", source: "ai" },
  });

  if (isCredits) {
    const charged = await chargeCredits(
      workspace.id,
      USAGE_COSTS.image,
      "usage_image",
      "Bild generiert (1024×1024)"
    );
    if (!charged) return { ok: false, error: "Nicht genug Credits." };
  }

  return { ok: true, url: file.url, source: "ai", bundle: await bundleFor(workspace.id, u) };
}
