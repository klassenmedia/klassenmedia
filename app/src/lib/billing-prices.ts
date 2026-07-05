// Serverseitige Preisliste — einzige Quelle für Beträge (nie aus dem Client).

// Ein Plan für alles ("Komplett"), 79 €/Monat, keine Limits. Die alten
// Tier-Namen bleiben nur intern erhalten und zeigen alle auf denselben Preis.
export const COMPLETE_PLAN_PRICE_EUR = 79;

export const PLAN_PRICES_EUR: Record<string, number> = {
  starter: COMPLETE_PLAN_PRICE_EUR,
  pro: COMPLETE_PLAN_PRICE_EUR,
  agency: COMPLETE_PLAN_PRICE_EUR,
};

export const CREDIT_PACKAGES_EUR: Record<string, { credits: number; price: number }> = {
  S: { credits: 500, price: 9 },
  M: { credits: 2000, price: 29 },
  L: { credits: 10000, price: 119 },
};
