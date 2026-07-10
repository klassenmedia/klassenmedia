import { describe, expect, it } from "vitest";
import { rangeIn, seeded } from "@/lib/prng";

describe("seeded", () => {
  it("is deterministic — same seed produces the same sequence", () => {
    const a = seeded("campaign-1");
    const b = seeded("campaign-1");
    const seqA = [a(), a(), a()];
    const seqB = [b(), b(), b()];
    expect(seqA).toEqual(seqB);
  });

  it("different seeds produce different sequences", () => {
    const a = seeded("campaign-1")();
    const b = seeded("campaign-2")();
    expect(a).not.toBe(b);
  });

  it("produces values in [0, 1)", () => {
    const rng = seeded("range-check");
    for (let i = 0; i < 50; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe("rangeIn", () => {
  it("stays within [min, max]", () => {
    const rng = seeded("bounds");
    for (let i = 0; i < 100; i++) {
      const v = rangeIn(rng, 10, 20);
      expect(v).toBeGreaterThanOrEqual(10);
      expect(v).toBeLessThanOrEqual(20);
    }
  });
});
