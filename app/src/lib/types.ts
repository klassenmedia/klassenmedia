export type Platform =
  | "instagram"
  | "facebook"
  | "tiktok"
  | "linkedin"
  | "youtube"
  | "x"
  | "pinterest";

export const PLATFORMS: Record<
  Platform,
  { label: string; short: string; color: string }
> = {
  instagram: { label: "Instagram", short: "IG", color: "#e1306c" },
  facebook: { label: "Facebook", short: "FB", color: "#1877f2" },
  tiktok: { label: "TikTok", short: "TT", color: "#22d3ee" },
  linkedin: { label: "LinkedIn", short: "IN", color: "#0a66c2" },
  youtube: { label: "YouTube", short: "YT", color: "#ff4444" },
  x: { label: "X (Twitter)", short: "X", color: "#9ca3af" },
  pinterest: { label: "Pinterest", short: "PI", color: "#e60023" },
};

export interface SocialAccount {
  id: string;
  platform: Platform;
  displayName: string;
  handle: string;
}

export type PostStatus = "draft" | "scheduled" | "published" | "failed";

export type PostFormat = "text" | "image" | "video" | "carousel" | "story";

export const FORMATS: Record<PostFormat, { label: string; hint: string; maxMedia: number }> = {
  text: { label: "Text", hint: "Nur Text — ideal für X und LinkedIn", maxMedia: 0 },
  image: { label: "Bild", hint: "Ein Bild im Feed", maxMedia: 1 },
  video: { label: "Video / Reel", hint: "Video, Reel oder Short", maxMedia: 1 },
  carousel: { label: "Karussell", hint: "Bis zu 10 Bilder zum Durchwischen", maxMedia: 10 },
  story: { label: "Story", hint: "24 h sichtbar, Hochformat 9:16", maxMedia: 1 },
};

export const STATUS_LABELS: Record<PostStatus, string> = {
  draft: "Entwurf",
  scheduled: "Geplant",
  published: "Veröffentlicht",
  failed: "Fehler",
};

export interface Post {
  id: string;
  body: string;
  /** ISO-Datum yyyy-mm-dd (lokal) */
  date: string;
  /** hh:mm */
  time: string;
  accountIds: string[];
  status: PostStatus;
  format: PostFormat;
  /** Demo-Medien: ein Farbton (hue) pro Platzhalter-Kachel */
  media: number[];
}

export type InviteStatus = "pending" | "accepted" | "revoked";

/** Verbindungslink, mit dem ein Kunde seinen Account selbst freigibt */
export interface ConnectionInvite {
  id: string;
  platform: Platform;
  clientName: string;
  token: string;
  status: InviteStatus;
  createdAt: string; // dd.mm.yyyy
}

export type AiMode = "credits" | "byo";

export interface CreditEntry {
  id: string;
  label: string;
  amount: number; // + Gutschrift / − Verbrauch
  when: string;
}

export type PlanTier = "starter" | "pro" | "agency";

export const PLANS: Record<
  PlanTier,
  {
    name: string;
    price: number;
    workspaces: string;
    members: string;
    credits: number;
    extras: string[];
  }
> = {
  starter: {
    name: "Starter",
    price: 19,
    workspaces: "1 Workspace",
    members: "1 Nutzer",
    credits: 100,
    extras: ["Unbegrenzte Social Accounts", "Unbegrenzter Planungshorizont", "BYO-API-Key"],
  },
  pro: {
    name: "Pro",
    price: 49,
    workspaces: "3 Workspaces",
    members: "5 Teammitglieder",
    credits: 500,
    extras: [
      "Alles aus Starter",
      "Freigabe-Workflow",
      "Serien & Kampagnen",
      "Priorisierter Support",
    ],
  },
  agency: {
    name: "Agency",
    price: 129,
    workspaces: "Unbegrenzte Workspaces",
    members: "Unbegrenzte Teammitglieder",
    credits: 2000,
    extras: ["Alles aus Pro", "White-Label", "Kunden-Freigabelinks"],
  },
};

/** yyyy-mm-dd in lokaler Zeit */
export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
