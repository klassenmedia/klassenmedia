// Zentrale Eingabe-Validierung (zod) + serverseitige Preis-/Kosten-Tabellen.
// Bewusst dependency-frei (kein db/auth-Import), damit sich diese Regeln
// isoliert unit-testen lassen und Server Actions (actions.ts, ai-actions.ts)
// dieselbe Quelle nutzen statt sie zu duplizieren.

import { z } from "zod";
import { ASSIGNABLE_ROLES, type Role } from "./permissions";

export const PLATFORM_VALUES = [
  "instagram", "facebook", "tiktok", "linkedin", "youtube", "x", "pinterest",
] as const;

export const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

export const postSchema = z
  .object({
    id: z.string().optional(),
    // Nur für format "article" (Blogartikel) — siehe Refine unten
    title: z.string().trim().max(200).nullable().optional(),
    body: z.string().trim().min(1, "Text fehlt").max(20000),
    clientId: z.string().nullable().optional(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    time: z.string().regex(/^\d{2}:\d{2}$/),
    accountIds: z.array(z.string()).min(1, "Mindestens ein Account"),
    // "review" = zur Freigabe einreichen (wird intern als Entwurf + approval=pending abgelegt)
    status: z.enum(["draft", "scheduled", "review"]),
    format: z.enum(["text", "image", "video", "carousel", "story", "article"]),
    media: z
      .array(z.object({ id: z.string().nullable(), url: z.string().max(500) }))
      .max(20),
  })
  .refine((data) => data.format !== "article" || !!data.title?.trim(), {
    message: "Blogartikel braucht einen Titel",
    path: ["title"],
  });

export const wordpressAccountSchema = z.object({
  displayName: z.string().trim().min(1, "Bitte einen Namen angeben").max(100),
  siteUrl: z
    .string()
    .trim()
    .url("Bitte eine vollständige URL angeben (https://…)")
    .refine((u) => u.startsWith("https://") || u.startsWith("http://"), {
      message: "Nur http(s)-URLs sind erlaubt",
    }),
  username: z.string().trim().min(1, "WordPress-Benutzername fehlt").max(100),
  appPassword: z.string().trim().min(1, "Anwendungskennwort fehlt").max(300),
  clientId: z.string().nullable().optional(),
});

export const accountSchema = z.object({
  platform: z.enum(PLATFORM_VALUES),
  displayName: z.string().trim().min(1).max(100),
  handle: z.string().trim().min(1).max(100),
  clientId: z.string().nullable().optional(),
});

export const inviteSchema = z.object({
  platform: z.enum(PLATFORM_VALUES),
  clientName: z.string().trim().min(1).max(100),
  clientId: z.string().nullable().optional(),
});

export const clientSchema = z.object({
  name: z.string().trim().min(1, "Name fehlt").max(80),
  color: z.string().regex(HEX_COLOR, "Ungültige Farbe").optional(),
});

export const keysSchema = z.object({
  anthropicKey: z.string().trim().max(300).optional(),
  openaiKey: z.string().trim().max(300).optional(),
});

export const inviteMemberSchema = z.object({
  email: z.string().trim().toLowerCase().email("Bitte eine gültige E-Mail eingeben"),
  role: z.enum(ASSIGNABLE_ROLES as [Role, ...Role[]]),
});

export const changeRoleSchema = z.object({
  memberId: z.string(),
  role: z.enum(ASSIGNABLE_ROLES as [Role, ...Role[]]),
});

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const adCampaignSchema = z
  .object({
    postId: z.string().min(1, "Bitte einen Beitrag wählen"),
    accountId: z.string().min(1, "Bitte einen Account wählen"),
    clientId: z.string().nullable().optional(),
    objective: z.enum(["reach", "engagement", "traffic"]),
    budgetTotal: z.number().min(5, "Mindestbudget 5 €").max(100000, "Budget zu hoch"),
    startDate: z.string().regex(DATE_RE),
    endDate: z.string().regex(DATE_RE),
  })
  .refine((d) => d.endDate > d.startDate, {
    message: "Enddatum muss nach dem Startdatum liegen",
    path: ["endDate"],
  });

export const captionSchema = z.object({
  topic: z.string().trim().min(1, "Bitte ein Thema oder ein paar Stichworte angeben").max(1000),
  platform: z.enum(PLATFORM_VALUES).optional(),
});

export const imageSchema = z.string().trim().min(1, "Bitte beschreibe das gewünschte Bild").max(1000);

// ── Serverseitige Preis-/Kosten-Tabellen (nie aus dem Client) ──────────

export const CREDIT_PACKAGES: Record<string, { credits: number; label: string }> = {
  S: { credits: 500, label: "Credit-Paket S gekauft (Demo)" },
  M: { credits: 2000, label: "Credit-Paket M gekauft (Demo)" },
  L: { credits: 10000, label: "Credit-Paket L gekauft (Demo)" },
};

export const USAGE_COSTS: Record<string, number> = { caption: 1, image: 6, learnings: 2 };

export const FORMAT_MAX_MEDIA: Record<string, number> = {
  text: 0, image: 1, video: 1, carousel: 20, story: 1, article: 1,
};

/** Reiner Guthaben-Check (die atomare DB-Abbuchung passiert in actions.ts/ai-actions.ts). */
export function canAfford(balance: number, cost: number): boolean {
  return balance >= cost;
}
