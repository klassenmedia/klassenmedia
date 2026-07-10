// Deterministische Demo-Kennzahlen für Ad-Kampagnen — dependency-frei (kein
// db-Import), damit sich die Simulation isoliert testen lässt. Läuft, solange
// keine echte Meta-Marketing-API-Anbindung besteht (App Review, Ad-Account-
// Zugriff); ersetzt dieselbe Anzeige, sobald echte Insights verfügbar sind.

import { seeded, rangeIn } from "./prng";

export type AdObjective = "reach" | "engagement" | "traffic";

export interface AdMetrics {
  spend: number;
  impressions: number;
  reach: number;
  clicks: number;
  ctr: number; // Prozent
  costPerResult: number; // € je Klick/Interaktion
  roas: number | null; // nur bei objective "traffic" — Umsatz je ausgegebenem Euro
}

interface CampaignInput {
  id: string;
  objective: AdObjective;
  budgetTotal: number;
  startDate: Date;
  endDate: Date;
}

/** Ausgegebenes Budget bis "now" — linear über die Laufzeit, gedeckelt aufs Gesamtbudget. */
export function spendSoFar(campaign: Pick<CampaignInput, "budgetTotal" | "startDate" | "endDate">, now: Date): number {
  const totalMs = campaign.endDate.getTime() - campaign.startDate.getTime();
  if (totalMs <= 0) return campaign.budgetTotal;
  const elapsedMs = now.getTime() - campaign.startDate.getTime();
  const progress = Math.min(1, Math.max(0, elapsedMs / totalMs));
  return Math.round(campaign.budgetTotal * progress * 100) / 100;
}

const CTR_RANGE: Record<AdObjective, [number, number]> = {
  reach: [0.005, 0.01],
  engagement: [0.02, 0.04],
  traffic: [0.01, 0.025],
};

export function simulateAdMetrics(campaign: CampaignInput, now: Date): AdMetrics {
  const spend = spendSoFar(campaign, now);
  const rng = seeded(campaign.id);

  const impressionsPerEuro = rangeIn(rng, 60, 140);
  const impressions = Math.round(spend * impressionsPerEuro);
  const reachRatio = 0.55 + rng() * 0.25;
  const reach = Math.round(impressions * reachRatio);

  const [ctrMin, ctrMax] = CTR_RANGE[campaign.objective];
  const ctrBase = ctrMin + rng() * (ctrMax - ctrMin);
  const clicks = Math.round(impressions * ctrBase);
  const ctr = impressions > 0 ? Math.round((clicks / impressions) * 10000) / 100 : 0;
  const costPerResult = clicks > 0 ? Math.round((spend / clicks) * 100) / 100 : 0;

  let roas: number | null = null;
  if (campaign.objective === "traffic" && spend > 0) {
    const conversionRate = 0.03 + rng() * 0.05;
    const avgOrderValue = rangeIn(rng, 25, 70);
    const revenue = clicks * conversionRate * avgOrderValue;
    roas = Math.round((revenue / spend) * 100) / 100;
  }

  return { spend, impressions, reach, clicks, ctr, costPerResult, roas };
}
