import { describe, expect, it } from "vitest";
import { summarizeForAi } from "@/lib/analytics-summary";
import type { Analytics } from "@/lib/analytics";

const base: Analytics = {
  simulated: true,
  rangeDays: 30,
  hasPublished: true,
  kpis: {
    reach: { value: 12000, deltaPct: 8 },
    engagement: { value: 540, deltaPct: -3 },
    engagementRate: { value: 4.5, deltaPct: 0.2 },
    followers: { value: 3000, deltaPct: 4 },
  },
  series: [],
  channels: [
    { platform: "instagram", followers: 2000, reach: 8000, engagement: 400, posts: 5, engagementRate: 5 },
  ],
  topPosts: [
    {
      id: "p1",
      body: "Behind the Scenes: So entsteht ein Kundenprojekt bei uns von A bis Z, ganz genau",
      date: "01.07.",
      platforms: ["instagram"],
      reach: 5000,
      engagement: 300,
      engagementRate: 6,
    },
  ],
  bestTimes: { days: ["Mo"], buckets: ["9-12"], grid: [[0.5]], peak: "Di 18–21 Uhr" },
};

describe("summarizeForAi", () => {
  it("includes the range, KPIs and peak time", () => {
    const s = summarizeForAi(base);
    expect(s).toContain("30 Tage");
    expect(s).toContain("12000");
    expect(s).toContain("Di 18–21 Uhr");
  });

  it("includes channel and top-post detail when present", () => {
    const s = summarizeForAi(base);
    expect(s).toContain("Instagram");
    expect(s).toContain("Behind the Scenes");
  });

  it("omits channel/top-post lines when there is no data yet", () => {
    const empty = { ...base, channels: [], topPosts: [] };
    const s = summarizeForAi(empty);
    expect(s).not.toContain("Kanäle:");
    expect(s).not.toContain("Beste Beiträge");
  });

  it("truncates long post bodies", () => {
    const long = { ...base, topPosts: [{ ...base.topPosts[0], body: "x".repeat(200) }] };
    const s = summarizeForAi(long);
    expect(s).not.toContain("x".repeat(70));
  });
});
