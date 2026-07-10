// Deterministischer Pseudozufall aus einem String-Seed (mulberry32) — gleiche
// Eingabe ergibt immer dieselbe Zahl. Genutzt für Demo-Kennzahlen (Analytics,
// Ads-Simulation), damit das Dashboard stabil wirkt, statt bei jedem Laden
// andere Werte zu zeigen.

export function seeded(str: string): () => number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function rangeIn(rng: () => number, min: number, max: number): number {
  return Math.round(min + rng() * (max - min));
}
