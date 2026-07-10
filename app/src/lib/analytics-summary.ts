// Kompakte Textzusammenfassung der Analytics — Grundlage für den KI-Prompt
// (Learnings). Dependency-frei (kein "server-only"/db-Import), damit sich das
// Format isoliert testen lässt.

import { PLATFORMS } from "./types";
import type { Analytics } from "./analytics";

export function summarizeForAi(a: Analytics): string {
  const lines: string[] = [];
  lines.push(`Zeitraum: letzte ${a.rangeDays} Tage.`);
  lines.push(
    `Reichweite: ${a.kpis.reach.value} (${a.kpis.reach.deltaPct >= 0 ? "+" : ""}${a.kpis.reach.deltaPct}% ggü. Vorperiode).`
  );
  lines.push(
    `Interaktionen: ${a.kpis.engagement.value} (${a.kpis.engagement.deltaPct >= 0 ? "+" : ""}${a.kpis.engagement.deltaPct}%), ` +
      `Interaktionsrate ${a.kpis.engagementRate.value}%.`
  );
  if (a.channels.length > 0) {
    lines.push(
      "Kanäle: " +
        a.channels
          .map((c) => `${PLATFORMS[c.platform].label} ${c.reach} Reichweite / ${c.engagementRate}% Interaktionsrate`)
          .join(", ") +
        "."
    );
  }
  if (a.topPosts.length > 0) {
    lines.push(
      "Beste Beiträge (nach Interaktionen): " +
        a.topPosts
          .slice(0, 3)
          .map(
            (p) =>
              `„${p.body.slice(0, 60)}" (${p.platforms.map((pl) => PLATFORMS[pl].label).join("/")}, ${p.engagement} Interaktionen)`
          )
          .join("; ") +
        "."
    );
  }
  lines.push(`Beste Posting-Zeit laut Muster: ${a.bestTimes.peak}.`);
  return lines.join("\n");
}
