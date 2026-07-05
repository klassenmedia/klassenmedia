# Planbar — Social-Media-Planungstool (Arbeitstitel)

> SaaS-Produkt zum Planen, Erstellen und Veröffentlichen von Social-Media-Inhalten
> für **beliebig viele Accounts**, mit KI-Unterstützung, monatlichem Abo-Modell und
> Verkauf über eine eigene Landingpage.
>
> Der Name „Planbar" ist ein Arbeitstitel und kann jederzeit geändert werden.

---

## 1. Produktvision

Ein Planungstool wie Metricool oder Buffer — aber ohne künstliche Account-Limits.
Kunden (Freelancer, Agenturen, Unternehmen) verbinden **unbegrenzt viele
Social-Media-Profile**, planen Inhalte **beliebig weit im Voraus** und bekommen
dabei **KI-Unterstützung** für Texte und Bilder. Bezahlt wird monatlich per Abo.

**Differenzierung gegenüber Metricool & Co.:**

1. **Keine Account-Limits** — der Tarif skaliert nicht über die Anzahl der Profile.
2. **Flexible KI-Nutzung** — Kunden bringen ihren eigenen API-Key mit (BYO-Key,
   eigene Kosten) *oder* kaufen Credit-Kontingente direkt bei uns (mit Marge).
3. **Langfrist-Planung** — Kalender ohne Zeitlimit nach vorn, Kampagnen- und
   Serienplanung (z. B. „jeden Dienstag 9:00 für die nächsten 12 Monate").

## 2. Zielgruppen

| Zielgruppe | Bedarf | Tarif-Fit |
|---|---|---|
| Solo-Creator / Freelancer | 3–10 Profile, einfache Planung | Starter |
| Kleine Unternehmen | Mehrere Kanäle, KI-Texte, Team-Freigabe | Pro |
| Agenturen | Viele Kunden-Workspaces, Mandantenfähigkeit, White-Label | Agency |

## 3. Feature-Set

### 3.1 Kernfunktionen (MVP)

- **Workspaces (Mandanten):** Ein Nutzer kann mehrere Workspaces besitzen
  (z. B. eine Agentur pro Kunde einen). Abrechnung pro Workspace.
- **Unbegrenzte Social Accounts:** Instagram, Facebook, TikTok, LinkedIn,
  YouTube, X (Twitter), Pinterest. Anbindung per OAuth über die offiziellen APIs —
  auf **zwei Wegen** (wichtig für Agenturen):
  1. **Selbst einloggen:** Der Nutzer meldet sich mit seinem eigenen Plattform-Konto
     an und sieht alle Seiten/Profile, die er verwaltet (z. B. Kunden-Seiten über
     Meta Business Manager Partner-Zugriff). Häkchen setzen → verbunden.
  2. **Verbindungslink an den Kunden senden:** Das Tool erzeugt einen sicheren,
     zeitlich begrenzten Einladungslink. Der Kunde öffnet ihn auf seinem Gerät,
     loggt sich beim offiziellen Plattform-Login ein und bestätigt — der Account
     landet automatisch im richtigen Workspace. **Kein Passwort wechselt je den
     Besitzer.** (Tabelle `ConnectionInvite` im Datenmodell: Einmal-Token,
     Ablaufdatum, Status pending/accepted/revoked.)
- **Planungskalender:** Monats- und Wochenansicht, Drag & Drop, Farbcodierung
  pro Plattform, beliebig weit in die Zukunft planbar.
- **Post-Composer:** Ein Entwurf → mehrere Plattformen gleichzeitig, mit
  plattformspezifischen Anpassungen (Textlängen, Hashtags, Formate).
- **Alle gängigen Formate:** Text, Bild, Video/Reel/Short, Karussell (bis 10
  Medien) und Story (9:16). Der Composer validiert pro Plattform, was möglich
  ist (z. B. Karussell nicht auf X, Story nur IG/FB), bevor geplant wird.
- **Serien & Kampagnen:** Wiederkehrende Slots („Content-Rezepte"), Kampagnen
  mit eigener Farbe im Kalender.
- **Medienbibliothek:** Upload, Wiederverwendung, KI-generierte Bilder.
- **Status-Workflow:** Entwurf → geplant → freigegeben → veröffentlicht / Fehler.

### 3.2 KI-Unterstützung

Zwei Modi, pro Workspace wählbar:

1. **BYO-Key (Bring Your Own Key):** Kunde hinterlegt eigenen API-Key
   (Anthropic, OpenAI, …). Verbrauch läuft über das Konto des Kunden,
   wir berechnen nichts extra. Keys werden verschlüsselt gespeichert (AES-256-GCM,
   Schlüssel im KMS/ENV, niemals im Klartext in der DB).
2. **Credit-Kontingente:** Kunde kauft Credits bei uns (Stripe One-Time-Payment
   oder monatliches Add-on). Wir rufen die KI-APIs mit unserem Plattform-Key auf
   und rechnen den Verbrauch in Credits ab — **mit Marge** (siehe 5.3).

KI-Funktionen:

- Caption-/Text-Vorschläge pro Plattform (Ton, Länge, Hashtags)
- Bild-Generierung für Posts
- Content-Ideen & Themenplan („Erstelle mir einen Monatsplan für ein Fitnessstudio")
- Recycling: alte Top-Posts umschreiben und neu einplanen

### 3.3 Zielbild: Was eine Social-Media-Managerin komplett braucht

Langfristiges Ziel ist ein **All-in-One-Tool**, das die gängigen Einzeltools
ersetzt — vergleichbar mit adhook, aber mit unserem Keil (unbegrenzte Accounts,
BYO-KI, fairer Preis). Die folgende Landkarte ist die *vollständige* Vision;
gebaut wird sie gestaffelt (siehe Roadmap, Abschnitt 8). Statuslegende:
✅ fertig · 🔶 teilweise · 🔲 geplant.

**1. Planen & Veröffentlichen** (das Fundament)
- ✅ Kalender, Multi-Plattform-Composer, alle Formate, Scheduler mit Retries
- ✅ Kanban-Board: Content-Pipeline (Entwurf → In Freigabe → Geplant →
  Veröffentlicht) mit Drag-and-drop; Freigeben/Zurückziehen per Ziehen,
  rollen-geprüft (ersetzt Trello im Workflow)
- 🔲 Drag & Drop im Kalender, Wochen-/Listenansicht
- 🔲 Serien & wiederkehrende Slots („jeden Di 9:00"), Kampagnen mit Farbe
- 🔲 Beste-Zeit-Vorschläge, Warteschlangen („Queue"-Modus wie Buffer)
- 🔲 Link-in-Bio-Seite, First-Comment (Hashtags in den ersten Kommentar)

**2. Engagement & Community** (Inbox)
- 🔶 Kommentare liken/antworten/löschen (lokal fertig, Plattform-Sync offen)
- 🔲 Zentrale Inbox für DMs + Kommentare aller Kanäle, Zuweisung im Team
- 🔲 Gespeicherte Antworten, Sentiment-Markierung, „erledigt"-Status

**3. KI-Unterstützung**
- ✅ Caption-Vorschläge (echt, Claude `claude-opus-4-8`, pro Plattform im Ton angepasst)
- ✅ Content-Ideen (mehrere Vorschläge zu einem Thema, echt via Claude)
- ✅ Bild-Generierung (echt, OpenAI `gpt-image-1`, landet in der Medienbibliothek)
- ✅ BYO-Key- **und** Plattform-Key-Modus; Credit-Abzug nur bei echtem Erfolg, BYO kostet keine Credits
- 🔲 Video-Generierung, Ton pro Marke, Monatsplan-Generator
- 🔲 Recycling von Top-Posts, Hashtag-Empfehlungen, Alt-Text automatisch

**4. Analytics & Reporting**
- 🔲 Organische Performance pro Post/Kanal (Reichweite, Engagement, Wachstum)
- 🔲 Individuelle Dashboards, PDF-/White-Label-Reports für Kunden
- 🔲 Wettbewerbs-/Benchmark-Vergleich, beste Posting-Zeiten aus echten Daten

**5. Team & Agentur-Workflow**
- ✅ Kunden-Ebene: eine Agentur = ein Arbeitsbereich, darin Kunden als Gruppen
  mit ihren Accounts; globaler Kunden-Filter über Planer/Board/Inbox; Kunden-
  Übersicht (wer hat welche Accounts). Skaliert auf 15+ Kunden × mehrere Accounts.
- ✅ Workspaces (Agentur-Konto), Nutzer in mehreren Workspaces, Wechsler
- ✅ Team-Mitglieder per Link einladen; Rollen owner/admin/editor/viewer mit
  serverseitig erzwungenen Rechten (`can(role, capability)`); Rolle ändern,
  entfernen, Workspace verlassen
- ✅ Freigabe-Workflow (Entwurf → zur Freigabe → freigegeben → geplant; oder
  „Änderungen erbeten" mit Kommentar zurück an den Ersteller)
- ✅ Kunden-Freigabelinks (`/review/<token>`: Kunde sieht Vorschau, gibt
  frei/bittet um Änderungen — ohne Konto)
- ✅ Aktivitätsprotokoll

**6. Werbeanzeigen (Ads)** — macht das Tool zum echten adhook-Ersatz
- 🔲 „Beitrag bewerben" (einfachster Einstieg, aus dem Planer heraus)
- 🔲 Meta-Kampagnen-Management (Marketing API: Kampagne → Anzeigengruppe → Anzeige)
- 🔲 Automatische Regeln (WENN CPC > x DANN Budget senken), Ad-Analytics/ROAS
- 🔲 Google Ads (eigene große Integration, deutlich später)

**7. Assets & Genehmigungen**
- ✅ Medien-Upload (lokal); 🔲 Cloud-Storage, Medienbibliothek mit Tags/Ordnern
- 🔲 Canva-/Adobe-Express-Integration, Marken-Kit (Logos, Farben, Schriften)

**8. Betrieb & Vertrauen**
- ✅ Sichere Auth, verschlüsselte Keys/Tokens, serverseitige Preise
- 🔲 Benachrichtigungen (E-Mail/Push bei Fehler/Freigabe), Mobile App
- 🔲 White-Label (eigene Domain/Logo für Agenturen), DSGVO-Exporte, 2FA

> **Strategie-Hinweis:** Nicht alles gleichzeitig. Der Weg zum All-in-One führt
> über zahlende Kunden — erst Kern + KI + Launch (Phasen 4–5), dann die Säulen,
> nach denen echte Kunden fragen (meist Analytics und Freigabe-Workflow vor Ads).

## 4. Preismodell (Entwurf)

Alle Tarife: **unbegrenzte Social Accounts**. Differenzierung über Workspaces,
Teammitglieder und inkludierte KI-Credits.

| | **Starter** 19 €/Monat | **Pro** 49 €/Monat | **Agency** 129 €/Monat |
|---|---|---|---|
| Workspaces | 1 | 3 | unbegrenzt |
| Teammitglieder | 1 | 5 | unbegrenzt |
| Social Accounts | ∞ | ∞ | ∞ |
| Planungshorizont | ∞ | ∞ | ∞ |
| KI-Credits inklusive / Monat | 100 | 500 | 2.000 |
| BYO-API-Key | ✓ | ✓ | ✓ |
| Freigabe-Workflow | – | ✓ | ✓ |
| White-Label | – | – | ✓ |

Jährliche Zahlung: 2 Monate geschenkt (≈ −17 %). 14 Tage kostenlos testen,
ohne Kreditkarte.

## 5. Monetarisierung & Billing

### 5.1 Stripe als Zahlungsanbieter

- **Stripe Billing** für Abos (monatlich/jährlich), Trial, Upgrades/Downgrades
  mit anteiliger Verrechnung (Proration).
- **Stripe Checkout + Customer Portal** — wir bauen keine eigene Karten-UI,
  damit minimaler PCI-Scope.
- **Webhooks** (`checkout.session.completed`, `invoice.paid`,
  `customer.subscription.updated/deleted`) halten den Abo-Status in unserer DB aktuell.
- Rechnungen, Steuern (OSS/VAT) über **Stripe Tax**.
- Alternative, falls „Merchant of Record" gewünscht (weniger Steuer-Aufwand):
  Paddle oder Lemon Squeezy — Entscheidung vor Launch.

### 5.2 Credit-Pakete (One-Time & Add-on)

| Paket | Credits | Preis |
|---|---|---|
| S | 500 | 9 € |
| M | 2.000 | 29 € |
| L | 10.000 | 119 € |

### 5.3 Margen-Kalkulation Credits

1 Credit = interne Verrechnungseinheit. Richtwert: 1 Credit ≈ 1 KI-Textaktion,
Bild ≈ 4–10 Credits (je nach Modell/Auflösung).

- Einkauf (API-Kosten) pro Credit: ~0,4–0,9 ct
- Verkauf pro Credit (Paket M): 1,45 ct
- **Brutto-Marge: ~40–70 %**, Puffer für Modellpreis-Schwankungen eingeplant.

Der Credit-Verbrauch wird pro Aktion in einer `CreditTransaction`-Tabelle
geloggt (Audit + Anzeige im UI).

## 6. Technische Architektur

### 6.1 Stack

| Ebene | Technologie | Warum |
|---|---|---|
| Frontend + Backend | **Next.js (App Router, TypeScript)** | Ein Codebase, SSR für Landingpage/SEO, API-Routes fürs Backend |
| Styling | **Tailwind CSS 4** | Schnell, konsistentes Design-System |
| Datenbank | **PostgreSQL + Prisma** | Relational, Mandantenfähigkeit, Migrations |
| Auth | **Auth.js (NextAuth)** oder Clerk | E-Mail + OAuth-Login |
| Jobs/Scheduler | **Worker + Queue (BullMQ/Redis)** oder Inngest/Trigger.dev | Zuverlässiges zeitgesteuertes Publishing, Retries |
| Zahlungen | **Stripe** | Abos + One-Time Credits, Webhooks |
| KI | **Anthropic / OpenAI / Fal (Bilder)** | BYO-Key oder Plattform-Key |
| Hosting | Vercel (App) + Railway/Fly (Worker + Postgres + Redis) | Einfacher Start, skaliert |
| Medien-Storage | S3-kompatibel (Cloudflare R2) | Günstig, CDN |

### 6.2 Publishing-Pipeline (der kritische Teil)

```
Post (geplant, 12.08. 09:00)
   └─> Scheduler (Cron, minütlich): fällige Posts holen
         └─> Queue-Job pro Post & Plattform
               └─> Publisher-Adapter (Instagram/TikTok/…)
                     ├─ Erfolg  → Status "veröffentlicht" + Plattform-Post-ID
                     └─ Fehler  → Retry (3×, exponentiell) → Status "Fehler" + Benachrichtigung
```

- **Adapter-Pattern:** pro Plattform ein Modul mit einheitlichem Interface
  (`validate(post)`, `publish(post, account)`), damit neue Plattformen leicht
  ergänzbar sind.
- OAuth-Tokens verschlüsselt, Refresh-Handling pro Plattform.
- **Wichtig:** Für Instagram/Facebook/TikTok/… sind App-Reviews der Plattformen
  nötig (Meta App Review, TikTok Developer). Früh beantragen — Vorlaufzeit Wochen.
  Bis dahin Entwicklung über Sandbox/Test-Accounts.

### 6.3 Mandantenfähigkeit

Alle Kern-Tabellen hängen an `workspaceId`. Zugriffskontrolle in einer
zentralen Service-Schicht (kein direkter Prisma-Zugriff aus Routen).
Details: `app/prisma/schema.prisma`.

## 7. UI/UX-Leitlinien

- **Der Kalender ist die App.** Planer als Startbildschirm nach Login,
  alles andere (Accounts, Billing, KI) ist Unterstützung.
- Composer als Overlay über dem Kalender — Kontext nie verlassen.
- Farbcodierung pro Plattform, konsistent in Kalender, Listen, Filtern.
- Leere Zustände verkaufen Features („Verbinde deinen ersten Account …").
- Ruhiges UI (Hell- und Dunkelmodus) mit einer blauen Akzentfarbe (#2563eb,
  WCAG-AA-geprüft), großzügiger Weißraum, Geist als Schrift. Landingpage nutzt
  dieselbe Designsprache.
- Tastatur-Shortcuts für Power-User (n = neuer Post, ←/→ = Monat wechseln).

## 8. Roadmap

| Phase | Inhalt | Status |
|---|---|---|
| **0 — Prototyp** | UI/UX komplett klickbar: Kalender, Composer (alle Formate), Accounts, KI, Billing, Landingpage, Mobile-Demo | ✅ fertig |
| **1 — Fundament** | SQLite/Prisma (lokal), Auth mit sicheren Sessions, echte Persistenz, Bild-Upload, Inbox (Kommentare) | ✅ fertig (Cloud: Provider-Wechsel auf Postgres) |
| **2 — Publishing** | Scheduler + Adapter-Pattern + Plattformregeln + Retries + Kunden-Freigabeseite `/connect` — läuft lokal im **Simulationsmodus** | ✅ Engine fertig · 🔲 2b: echte Plattform-APIs (Meta App Review!) |
| **3 — Billing** | Stripe Checkout (Abo mit 14-Tage-Trial, Credit-Pakete), Webhook, Customer Portal — env-gesteuert mit Demo-Fallback | ✅ Code fertig · 🔲 Stripe-Konto + Livemode |
| **4 — KI** | Echte Text-/Bild-Generierung (Claude + OpenAI), BYO-Key-Nutzung, Credit-Abrechnung gegen echte API-Kosten | ✅ fertig |
| **5 — Launch (v1)** | Name+Domain final, Landingpage live, Onboarding, E-Mails, Rechtstexte, erste zahlende Kunden | 🔲 offen |

**Ab hier: der Weg zum All-in-One (v2).** Reihenfolge bewusst nach Kunden-
nachfrage, nicht nach Feature-Liste — jede Phase ist einzeln verkaufbar:

| Phase | Inhalt | Warum in dieser Reihenfolge |
|---|---|---|
| **6 — Analytics** | ✅ Dashboard fertig (KPIs, Trend, Kanal-Vergleich, beste Zeiten, Top-Posts) mit Demo-Daten · 🔲 6b: echte Insights-Zahlen (Meta/TikTok/LinkedIn-APIs), PDF-/White-Label-Reports | Erstes, wonach Agenturen nach dem Planen fragen; nutzt vorhandene Plattform-Verbindungen |
| **7 — Freigabe & Team** | ✅ Freigabe-Workflow, Kunden-Freigabelinks, Aktivitätsprotokoll · ✅ 7b: Team-Mitglieder einladen, Rollen owner/admin/editor/viewer (serverseitig erzwungen), Multi-Workspace + Wechsler | Macht das Agency-Segment (129 €) rund; rein interne Logik, keine neuen Plattform-Reviews |
| **8 — Engagement-Ausbau** | Zentrale Inbox für DMs + Kommentare aller Kanäle, Team-Zuweisung, gespeicherte Antworten | Baut auf der vorhandenen Inbox auf; braucht erweiterte Plattform-Scopes |
| **9 — Ads** | „Beitrag bewerben" → Meta-Kampagnen (Marketing API) → Regeln/ROAS → Google Ads | Größter Brocken, höchstes Risiko (fremdes Budget); erst wenn Kern steht und Kunden fragen |
| **10 — Politur** | Mobile App, Canva/Adobe-Integration, Marken-Kit, 2FA, weitere Plattformen | Abrundung zum vollen adhook-Ersatz |

> Diese Reihenfolge hält dich verkaufsfähig, ohne dich zu verzetteln. Nach jeder
> Phase gibt es ein neues Verkaufsargument — statt zwei Jahre still zu bauen,
> bis „alles" da ist. Prioritäten sind verschiebbar, wenn Kundenfeedback etwas
> anderes zeigt (z. B. Ads vor Analytics, falls dein erstes Segment Ad-lastig ist).

## 9. Rechtliches (nicht vergessen)

- AGB, Datenschutzerklärung (DSGVO), AV-Vertrag für Agentur-Kunden
- Impressum auf der Landingpage
- Plattform-Richtlinien (Meta Platform Terms etc.)
- Bei Credit-Verkauf: klare Verbrauchsanzeige, keine Verfalls-Überraschungen

---

## Repo-Struktur

```
/
├── KONZEPT.md          ← dieses Dokument
└── app/                ← Next.js-App (Prototyp, lauffähig ohne externe Dienste)
    ├── prisma/schema.prisma   ← Ziel-Datenmodell für Produktion
    └── src/
        ├── app/               ← Landingpage (/) + App (/app/…)
        ├── components/        ← UI-Bausteine
        └── lib/               ← Typen, Demo-Daten, Store
```

**Prototyp starten:** `cd app && npm install && npm run dev` → http://localhost:3000
