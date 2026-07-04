// Serverseitige Preisliste — einzige Quelle für Beträge (nie aus dem Client).

export const PLAN_PRICES_EUR: Record<string, number> = {
  starter: 19,
  pro: 49,
  agency: 129,
};

export const CREDIT_PACKAGES_EUR: Record<string, { credits: number; price: number }> = {
  S: { credits: 500, price: 9 },
  M: { credits: 2000, price: 29 },
  L: { credits: 10000, price: 119 },
};
