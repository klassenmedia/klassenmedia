import { describe, expect, it } from "vitest";
import { COMPLETE_PLAN_PRICE_EUR, CREDIT_PACKAGES_EUR, PLAN_PRICES_EUR } from "@/lib/billing-prices";

describe("billing prices — ein Plan für alles, keine Tarif-Limits", () => {
  it("all legacy tier keys map to the same single price", () => {
    expect(PLAN_PRICES_EUR.starter).toBe(COMPLETE_PLAN_PRICE_EUR);
    expect(PLAN_PRICES_EUR.pro).toBe(COMPLETE_PLAN_PRICE_EUR);
    expect(PLAN_PRICES_EUR.agency).toBe(COMPLETE_PLAN_PRICE_EUR);
  });

  it("credit packages get cheaper per credit at larger sizes", () => {
    const perCredit = (pkg: { credits: number; price: number }) => pkg.price / pkg.credits;
    expect(perCredit(CREDIT_PACKAGES_EUR.L)).toBeLessThan(perCredit(CREDIT_PACKAGES_EUR.M));
    expect(perCredit(CREDIT_PACKAGES_EUR.M)).toBeLessThan(perCredit(CREDIT_PACKAGES_EUR.S));
  });
});
