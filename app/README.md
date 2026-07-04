# Planbar — Prototyp

Klickbarer Prototyp des Social-Media-Planungstools (siehe `../KONZEPT.md` für das
vollständige Produkt- und Architekturkonzept).

## Starten

```bash
npm install
npm run dev
```

→ http://localhost:3000 (Landingpage) · http://localhost:3000/app (App-Demo)

## Was ist enthalten?

| Bereich | Route | Status |
|---|---|---|
| Landingpage mit Preisen & FAQ | `/` | Prototyp |
| Dashboard | `/app` | Prototyp (Demo-Daten) |
| Planungskalender + Post-Composer | `/app/planner` | Prototyp, voll klickbar |
| Account-Verwaltung (unbegrenzt) | `/app/accounts` | Prototyp |
| KI-Studio (Credits / BYO-Key, Bildgenerierung) | `/app/ai` | Prototyp |
| Abo & Zahlung (Stripe-Integrationspunkte) | `/app/billing` | Prototyp |
| Produktions-Datenmodell | `prisma/schema.prisma` | Referenz für Phase 1 |

Der Prototyp läuft komplett ohne externe Dienste — alle Daten liegen im Speicher
(`src/lib/store.tsx`) und werden beim Neuladen zurückgesetzt. Die Roadmap zu echter
Persistenz, Publishing und Stripe steht in `../KONZEPT.md`, Abschnitt 8.
