export type Platform =
  | "instagram"
  | "facebook"
  | "tiktok"
  | "linkedin"
  | "youtube"
  | "x"
  | "pinterest"
  | "wordpress";

export const PLATFORMS: Record<
  Platform,
  { label: string; short: string; color: string }
> = {
  instagram: { label: "Instagram", short: "IG", color: "#e1306c" },
  facebook: { label: "Facebook", short: "FB", color: "#1877f2" },
  tiktok: { label: "TikTok", short: "TT", color: "#0891b2" },
  linkedin: { label: "LinkedIn", short: "IN", color: "#0a66c2" },
  youtube: { label: "YouTube", short: "YT", color: "#ff4444" },
  x: { label: "X (Twitter)", short: "X", color: "#6b7280" },
  pinterest: { label: "Pinterest", short: "PI", color: "#e60023" },
  wordpress: { label: "Website (WordPress)", short: "WP", color: "#21759b" },
};

export interface SocialAccount {
  id: string;
  platform: Platform;
  displayName: string;
  handle: string;
  clientId: string | null;
}

/** Kunde (Mandant der Agentur) — gruppiert Accounts */
export interface ClientItem {
  id: string;
  name: string;
  color: string;
  accountCount: number;
  postCount: number;
}

// ── CRM: Kunden-Profil ────────────────────────────────────────────────

export interface ClientContactItem {
  id: string;
  name: string;
  role: string | null;
  email: string | null;
  phone: string | null;
}

export interface ClientTaskItem {
  id: string;
  title: string;
  done: boolean;
  dueDate: string | null; // yyyy-mm-dd
  createdAt: string;
}

export interface ClientDetail {
  id: string;
  name: string;
  color: string;
  company: string | null;
  website: string | null;
  notes: string | null;
  goals: string | null;
  audience: string | null;
  topics: string | null;
  brandColors: string | null;
  fonts: string | null;
  hashtags: string | null;
  accounts: { id: string; platform: Platform; handle: string }[];
  contacts: ClientContactItem[];
  tasks: ClientTaskItem[];
  postCount: number;
}

export type PostStatus = "draft" | "scheduled" | "publishing" | "published" | "failed";

export type PostFormat = "text" | "image" | "video" | "carousel" | "story" | "article";

export const FORMATS: Record<PostFormat, { label: string; hint: string; maxMedia: number }> = {
  text: { label: "Text", hint: "Nur Text — ideal für X und LinkedIn", maxMedia: 0 },
  image: { label: "Bild", hint: "Ein Bild im Feed", maxMedia: 1 },
  video: { label: "Video / Reel", hint: "Video, Reel oder Short", maxMedia: 1 },
  carousel: { label: "Karussell", hint: "Bis zu 20 Bilder zum Durchwischen (Ads nur 10)", maxMedia: 20 },
  story: { label: "Story", hint: "24 h sichtbar, Hochformat 9:16", maxMedia: 1 },
  article: { label: "Blogartikel", hint: "Titel + Text für die Website (WordPress)", maxMedia: 1 },
};

export const STATUS_LABELS: Record<PostStatus, string> = {
  draft: "Entwurf",
  scheduled: "Geplant",
  publishing: "Wird veröffentlicht …",
  published: "Veröffentlicht",
  failed: "Fehler",
};

/** Medien-Anhang: echte Uploads haben eine id + /uploads/-URL,
 *  Platzhalter (Demo/KI) haben url "placeholder:<hue>" */
export interface MediaItem {
  id: string | null;
  url: string;
}

/** Externer Medien-Link (Dropbox/Drive/URL) statt lokalem Upload */
export function isExternalLink(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

/** CSS-Hintergrund für eine Medien-Kachel */
export function mediaBackground(url: string): string {
  if (url.startsWith("placeholder:")) {
    const hue = Number(url.slice("placeholder:".length)) || 0;
    return `linear-gradient(135deg, hsl(${hue} 55% 55%), hsl(${(hue + 60) % 360} 55% 35%))`;
  }
  if (isExternalLink(url)) {
    // externe Datei (z. B. Dropbox-Video) — kein Bild-Preview, neutrale Kachel
    return "linear-gradient(135deg, #334155, #1e293b)";
  }
  return `url(${JSON.stringify(url)}) center/cover`;
}

export interface Post {
  id: string;
  /** Nur für format "article" (Blogartikel) */
  title: string | null;
  body: string;
  /** Kunde, für den dieser Beitrag ist (null = keinem zugeordnet) */
  clientId: string | null;
  /** ISO-Datum yyyy-mm-dd (lokal) */
  date: string;
  /** hh:mm */
  time: string;
  accountIds: string[];
  status: PostStatus;
  format: PostFormat;
  media: MediaItem[];
  /** Publishing-Fehler pro Ziel-Account, z. B. "@handle: Text zu lang" */
  publishErrors: string[];
  approval: ApprovalStatus;
  approvalNote: string | null;
  /** Erinnerungs-Modus (Reels): statt automatisch zu posten, erinnert das Tool zur geplanten Zeit */
  reminderMode: boolean;
  /** true = die Erinnerung ist fällig, wartet auf manuelle Bestätigung ("Ich habe gepostet") */
  reminderDue: boolean;
}

export type ApprovalStatus = "none" | "pending" | "approved" | "changes_requested";

export const APPROVAL_LABELS: Record<ApprovalStatus, string> = {
  none: "",
  pending: "Wartet auf Freigabe",
  approved: "Freigegeben",
  changes_requested: "Änderungen erbeten",
};

export interface ReviewLinkItem {
  id: string;
  clientName: string;
  token: string;
  createdAt: string;
}

export interface ActivityItem {
  id: string;
  actor: string;
  action: string;
  target: string | null;
  when: string;
}

export const ACTIVITY_LABELS: Record<string, string> = {
  created: "hat einen Beitrag erstellt",
  submitted: "hat einen Beitrag zur Freigabe eingereicht",
  approved: "hat einen Beitrag freigegeben",
  changes_requested: "hat Änderungen erbeten",
  published: "Beitrag wurde veröffentlicht",
  connected: "hat einen Account verbunden",
};

export interface CommentReply {
  id: string;
  text: string;
  when: string;
}

export interface CommentItem {
  id: string;
  postId: string;
  clientId: string | null;
  postSnippet: string;
  platform: Platform;
  accountLabel: string;
  author: string;
  authorHandle: string | null;
  text: string;
  likedByUs: boolean;
  when: string;
  replies: CommentReply[];
}

export type InviteStatus = "pending" | "accepted" | "revoked";

/** Verbindungslink, mit dem ein Kunde seinen Account selbst freigibt */
export interface ConnectionInvite {
  id: string;
  platform: Platform;
  clientName: string;
  clientId: string | null;
  token: string;
  status: InviteStatus;
  createdAt: string; // dd.mm.yyyy
}

import type { Role } from "./permissions";

export interface WorkspaceSummary {
  id: string;
  name: string;
  role: Role;
}

export interface TeamMember {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: Role;
  isSelf: boolean;
  since: string;
}

export interface TeamInviteItem {
  id: string;
  email: string;
  role: Role;
  token: string;
  invitedBy: string;
  createdAt: string;
}

/** API-Token für den MCP-Connector (Claude) — der Rohwert wird nur einmal bei Erstellung gezeigt. */
export interface ApiTokenItem {
  id: string;
  name: string;
  createdBy: string;
  createdAt: string;
  lastUsedAt: string | null;
  revoked: boolean;
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

// ── Ads (Phase 8) — Meta-Boost auf einen bestehenden Post ──────────────

export type AdObjective = "reach" | "engagement" | "traffic";

export const AD_OBJECTIVES: Record<AdObjective, { label: string; hint: string }> = {
  reach: { label: "Mehr Reichweite", hint: "Zeigt die Anzeige möglichst vielen Personen" },
  engagement: { label: "Mehr Interaktionen", hint: "Likes, Kommentare und Shares steigern" },
  traffic: { label: "Klicks auf die Website", hint: "Nutzer:innen auf Website/Landingpage lenken" },
};

export type AdCampaignStatus = "active" | "paused" | "completed";

export const AD_STATUS_LABELS: Record<AdCampaignStatus, string> = {
  active: "Aktiv",
  paused: "Pausiert",
  completed: "Beendet",
};

export interface AdMetricsView {
  spend: number;
  impressions: number;
  reach: number;
  clicks: number;
  ctr: number;
  costPerResult: number;
  roas: number | null;
}

export interface AdCampaignItem {
  id: string;
  postId: string;
  postBody: string;
  accountId: string;
  accountHandle: string;
  platform: Platform;
  clientId: string | null;
  objective: AdObjective;
  budgetTotal: number;
  startDate: string; // yyyy-mm-dd
  endDate: string;
  status: AdCampaignStatus;
  createdBy: string;
  metrics: AdMetricsView;
}

/** yyyy-mm-dd in lokaler Zeit */
export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
