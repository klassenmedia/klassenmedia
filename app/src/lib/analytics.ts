import "server-only";

import { db } from "./db";
import { Platform, PLATFORMS } from "./types";
import { seeded, rangeIn } from "./prng";

// Analytics-Datenschicht (Phase 6).
//
// WICHTIG: Solange die echten Plattform-APIs nicht angebunden sind (Meta App
// Review etc.), gibt es keine echten Reichweiten-/Engagement-Zahlen. Diese
// Schicht erzeugt daher DETERMINISTISCHE Demo-Kennzahlen aus den vorhandenen
// (veröffentlichten) Posts — gleiche Eingabe = gleiche Zahlen, damit das
// Dashboard stabil wirkt. In Phase 6b wird ausschließlich diese Datenquelle
// gegen echte Insights-Aufrufe getauscht; UI und Aggregation bleiben gleich.

// plattformtypische Engagement-Rate (Anteil der Reichweite, der interagiert)
const ENGAGEMENT_RATE: Record<Platform, number> = {
  instagram: 0.045,
  tiktok: 0.07,
  linkedin: 0.03,
  facebook: 0.015,
  youtube: 0.05,
  x: 0.015,
  pinterest: 0.008,
  // Website-Traffic ist nicht mit Social-Reichweite vergleichbar — echte
  // Zahlen kommen später aus WordPress/Google-Analytics-Insights (Phase 6b)
  wordpress: 0.02,
};

function followersFor(accountId: string): number {
  return rangeIn(seeded("f:" + accountId), 1200, 45000);
}

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function labelDM(d: Date): string {
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.`;
}

export interface Kpi {
  value: number;
  deltaPct: number;
}
export interface ChannelRow {
  platform: Platform;
  followers: number;
  reach: number;
  engagement: number;
  posts: number;
  engagementRate: number; // Prozent
}
export interface TopPost {
  id: string;
  body: string;
  date: string;
  platforms: Platform[];
  reach: number;
  engagement: number;
  engagementRate: number;
}
export interface Analytics {
  simulated: boolean;
  rangeDays: number;
  hasPublished: boolean;
  kpis: {
    reach: Kpi;
    engagement: Kpi;
    engagementRate: Kpi;
    followers: Kpi;
  };
  series: { label: string; reach: number; engagement: number }[];
  channels: ChannelRow[];
  topPosts: TopPost[];
  bestTimes: { days: string[]; buckets: string[]; grid: number[][]; peak: string };
}

interface PublishedTarget {
  accountId: string;
  platform: Platform;
  postId: string;
  postBody: string;
  publishedAt: Date;
}

// Reichweite/Engagement eines veröffentlichten Ziels (deterministisch)
function metricsFor(t: PublishedTarget) {
  const rng = seeded("m:" + t.postId + ":" + t.accountId);
  const followers = followersFor(t.accountId);
  const reach = Math.round(followers * (0.2 + rng() * 0.5)); // 20–70 % der Follower
  const rate = ENGAGEMENT_RATE[t.platform] * (0.7 + rng() * 0.6);
  const engagement = Math.round(reach * rate);
  return { reach, engagement };
}

function pct(curr: number, prev: number): number {
  if (prev <= 0) return curr > 0 ? 100 : 0;
  return Math.round(((curr - prev) / prev) * 100);
}

export async function getAnalytics(
  workspaceId: string,
  rangeDays: number
): Promise<Analytics> {
  const accounts = await db.socialAccount.findMany({ where: { workspaceId } });
  const published = await db.postAccount.findMany({
    where: {
      publishedAt: { not: null },
      post: { workspaceId },
    },
    include: { account: true, post: true },
  });

  const targets: PublishedTarget[] = published
    .filter((pa) => pa.publishedAt && accounts.some((a) => a.id === pa.accountId))
    .map((pa) => ({
      accountId: pa.accountId,
      platform: pa.account.platform as Platform,
      postId: pa.postId,
      postBody: pa.post.body,
      publishedAt: pa.publishedAt as Date,
    }));

  const now = new Date();
  const startCurr = new Date(now);
  startCurr.setDate(now.getDate() - rangeDays);
  const startPrev = new Date(now);
  startPrev.setDate(now.getDate() - rangeDays * 2);

  // ── Tages-Zeitreihe: organische Grundlast pro Account + Post-Ausschläge ──
  const series: Analytics["series"] = [];
  let currReach = 0;
  let currEng = 0;
  for (let i = rangeDays - 1; i >= 0; i--) {
    const day = new Date(now);
    day.setDate(now.getDate() - i);
    const key = dateKey(day);
    let dReach = 0;
    let dEng = 0;
    // Grundrauschen: kleine tägliche Reichweite je Account
    for (const acc of accounts) {
      const rng = seeded("d:" + acc.id + ":" + key);
      const base = Math.round(followersFor(acc.id) * (0.02 + rng() * 0.03));
      dReach += base;
      dEng += Math.round(base * ENGAGEMENT_RATE[acc.platform as Platform]);
    }
    // Ausschläge an Tagen mit veröffentlichten Posts
    for (const t of targets) {
      if (dateKey(t.publishedAt) === key) {
        const m = metricsFor(t);
        dReach += m.reach;
        dEng += m.engagement;
      }
    }
    series.push({ label: labelDM(day), reach: dReach, engagement: dEng });
    currReach += dReach;
    currEng += dEng;
  }

  // Vorperiode (für Deltas) — gleiche Logik, nur früherer Zeitraum
  let prevReach = 0;
  let prevEng = 0;
  for (let i = 0; i < rangeDays; i++) {
    const day = new Date(startPrev);
    day.setDate(startPrev.getDate() + i);
    const key = dateKey(day);
    for (const acc of accounts) {
      const rng = seeded("d:" + acc.id + ":" + key);
      const base = Math.round(followersFor(acc.id) * (0.02 + rng() * 0.03));
      prevReach += base;
      prevEng += Math.round(base * ENGAGEMENT_RATE[acc.platform as Platform]);
    }
    for (const t of targets) {
      if (dateKey(t.publishedAt) === key) {
        const m = metricsFor(t);
        prevReach += m.reach;
        prevEng += m.engagement;
      }
    }
  }

  // ── Kanal-Aufstellung ──
  const byPlatform = new Map<Platform, ChannelRow>();
  for (const acc of accounts) {
    const p = acc.platform as Platform;
    const row = byPlatform.get(p) ?? {
      platform: p,
      followers: 0,
      reach: 0,
      engagement: 0,
      posts: 0,
      engagementRate: 0,
    };
    row.followers += followersFor(acc.id);
    byPlatform.set(p, row);
  }
  for (const t of targets) {
    if (t.publishedAt < startCurr) continue;
    const row = byPlatform.get(t.platform);
    if (!row) continue;
    const m = metricsFor(t);
    row.reach += m.reach;
    row.engagement += m.engagement;
    row.posts += 1;
  }
  const channels = [...byPlatform.values()]
    .map((r) => ({
      ...r,
      engagementRate: r.reach > 0 ? Math.round((r.engagement / r.reach) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.reach - a.reach);

  // ── Top-Posts (nach Engagement im Zeitraum) ──
  const perPost = new Map<string, TopPost>();
  for (const t of targets) {
    if (t.publishedAt < startCurr) continue;
    const m = metricsFor(t);
    const existing = perPost.get(t.postId);
    if (existing) {
      existing.reach += m.reach;
      existing.engagement += m.engagement;
      if (!existing.platforms.includes(t.platform)) existing.platforms.push(t.platform);
    } else {
      perPost.set(t.postId, {
        id: t.postId,
        body: t.postBody,
        date: labelDM(t.publishedAt),
        platforms: [t.platform],
        reach: m.reach,
        engagement: m.engagement,
        engagementRate: 0,
      });
    }
  }
  const topPosts = [...perPost.values()]
    .map((p) => ({
      ...p,
      engagementRate: p.reach > 0 ? Math.round((p.engagement / p.reach) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.engagement - a.engagement)
    .slice(0, 6);

  // ── Beste Posting-Zeiten (Heatmap Wochentag × Tageszeit) ──
  const days = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
  const buckets = ["6–9", "9–12", "12–15", "15–18", "18–21", "21–24"];
  // plausibles Grundmuster: werktags mittags & abends stark, Wochenende später
  const basePattern = [0.35, 0.75, 0.6, 0.5, 0.9, 0.55];
  const grid: number[][] = [];
  let peakScore = -1;
  let peak = "";
  for (let d = 0; d < days.length; d++) {
    const row: number[] = [];
    const weekend = d >= 5;
    for (let b = 0; b < buckets.length; b++) {
      const rng = seeded(`bt:${workspaceId}:${d}:${b}`);
      let v = basePattern[b] * (0.75 + rng() * 0.4);
      if (weekend) v *= b >= 3 ? 1.1 : 0.7; // Wochenende: später besser
      v = Math.max(0, Math.min(1, v));
      row.push(Math.round(v * 100) / 100);
      if (v > peakScore) {
        peakScore = v;
        peak = `${days[d]} ${buckets[b]} Uhr`;
      }
    }
    grid.push(row);
  }

  const totalFollowers = channels.reduce((s, c) => s + c.followers, 0);
  const engRate = currReach > 0 ? Math.round((currEng / currReach) * 1000) / 10 : 0;
  const prevEngRate = prevReach > 0 ? (prevEng / prevReach) * 100 : 0;

  return {
    simulated: true,
    rangeDays,
    hasPublished: targets.some((t) => t.publishedAt >= startCurr),
    kpis: {
      reach: { value: currReach, deltaPct: pct(currReach, prevReach) },
      engagement: { value: currEng, deltaPct: pct(currEng, prevEng) },
      engagementRate: { value: engRate, deltaPct: Math.round((engRate - prevEngRate) * 10) / 10 },
      // Follower als Momentaufnahme mit kleinem, deterministischem Zuwachs
      followers: { value: totalFollowers, deltaPct: rangeDays >= 30 ? 4 : 1 },
    },
    series,
    channels,
    topPosts,
    bestTimes: { days, buckets, grid, peak },
  };
}

export function platformColor(p: Platform): string {
  return PLATFORMS[p].color;
}
