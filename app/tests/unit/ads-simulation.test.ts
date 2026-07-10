import { describe, expect, it } from "vitest";
import { simulateAdMetrics, spendSoFar } from "@/lib/ads-simulation";

const campaign = (over: Partial<{ objective: "reach" | "engagement" | "traffic" }> = {}) => ({
  id: "camp_1",
  budgetTotal: 100,
  startDate: new Date("2026-07-01T00:00:00Z"),
  endDate: new Date("2026-07-11T00:00:00Z"), // 10 Tage
  objective: "reach" as const,
  ...over,
});

describe("spendSoFar", () => {
  it("is 0 before the campaign starts", () => {
    expect(spendSoFar(campaign(), new Date("2026-06-30T00:00:00Z"))).toBe(0);
  });

  it("is the full budget after the campaign ends", () => {
    expect(spendSoFar(campaign(), new Date("2026-08-01T00:00:00Z"))).toBe(100);
  });

  it("is roughly half the budget at the midpoint", () => {
    expect(spendSoFar(campaign(), new Date("2026-07-06T00:00:00Z"))).toBeCloseTo(50, 0);
  });
});

describe("simulateAdMetrics", () => {
  it("is deterministic for the same campaign and time", () => {
    const now = new Date("2026-07-06T00:00:00Z");
    expect(simulateAdMetrics(campaign(), now)).toEqual(simulateAdMetrics(campaign(), now));
  });

  it("never spends more than the budget", () => {
    const m = simulateAdMetrics(campaign(), new Date("2026-09-01T00:00:00Z"));
    expect(m.spend).toBeLessThanOrEqual(100);
  });

  it("has no clicks/impressions before the campaign starts (spend = 0)", () => {
    const m = simulateAdMetrics(campaign(), new Date("2026-06-01T00:00:00Z"));
    expect(m.spend).toBe(0);
    expect(m.impressions).toBe(0);
    expect(m.clicks).toBe(0);
  });

  it("only sets a ROAS for the traffic objective", () => {
    const now = new Date("2026-07-08T00:00:00Z");
    expect(simulateAdMetrics(campaign({ objective: "reach" }), now).roas).toBeNull();
    expect(simulateAdMetrics(campaign({ objective: "engagement" }), now).roas).toBeNull();
    expect(simulateAdMetrics(campaign({ objective: "traffic" }), now).roas).not.toBeNull();
  });

  it("different campaign ids yield different metrics for the same spend", () => {
    const now = new Date("2026-07-11T01:00:00Z");
    const a = simulateAdMetrics({ ...campaign(), id: "camp_a" }, now);
    const b = simulateAdMetrics({ ...campaign(), id: "camp_b" }, now);
    expect(a).not.toEqual(b);
  });
});
