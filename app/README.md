# Planbar — App (Phase 1)

Social-Media-Planungstool mit echter Datenbank, Login und Persistenz.
Produktkonzept & Roadmap: `../KONZEPT.md`.

## Lokal starten

Voraussetzung: Node.js 20+. Keine weitere Installation nötig (SQLite ist dateibasiert).

```bash
npm install
cp .env.example .env        # dann in .env ein eigenes APP_SECRET eintragen (openssl rand -hex 32)
npm run db:migrate          # legt die lokale Datenbank an (prisma/dev.db)
npm run db:seed             # optional: Demo-Daten
npm run dev                 # oder: npm run dev -- -p 3001, falls Port 3000 belegt
```

**Demo-Login** (nach `db:seed`): `demo@klassenmedia.de` / `demo1234` —
oder unter `/register` ein eigenes Konto anlegen.

## Was ist echt, was noch Demo?

| Bereich | Status |
|---|---|
| Login/Registrierung, Sessions | ✅ echt (bcrypt, serverseitige Sessions, httpOnly-Cookie) |
| Posts, Formate, Kalender | ✅ echt (SQLite, überlebt Neustart) |
| Kanban-Board (Pipeline: Entwurf → In Freigabe → Geplant → Veröffentlicht, Drag-and-drop) | ✅ echt — Verschieben/Freigeben rollen-geprüft |
| Kunden-Ebene + Kontext-Umschalter (Kunde wählen → alles zeigt nur ihn, übersteht Reloads) | ✅ echt — eine Agentur, ein Abo, viele Kunden sauber getrennt |
| CRM: Kunden-Profil (Stammdaten, Marke & Strategie, Ansprechpartner, Notizen, To-dos) | ✅ echt — schlankes CRM je Kunde, rollen-geprüft |
| Externer Medien-Link (großes Video per Dropbox/Drive-URL) | ✅ am Beitrag, im Composer & in der Freigabe direkt anklickbar |
| Karussell bis 20 Folien | ✅ (organisch; Ads-Hinweis: nur 10) |
| Bild-Upload im Composer | ✅ echt (lokales Dateisystem, `public/uploads/`) |
| Accounts & Verbindungslinks | ✅ persistiert — echte OAuth-Anbindung folgt in Phase 2 |
| Inbox (Kommentare liken/antworten/löschen) | ✅ persistiert — Sync mit Plattformen folgt in Phase 2 |
| Analytics-Dashboard (KPIs, Trend, Kanäle, beste Zeiten, Top-Posts) | ✅ mit deterministischen Demo-Daten — echte Insights-Zahlen mit der Plattform-Anbindung |
| Freigabe-Workflow (einreichen, freigeben, Änderungen erbeten) | ✅ echt, inkl. Aktivitätsprotokoll |
| Team & Rollen (Einladen per Link, Rollen owner/admin/editor/viewer, Workspace-Wechsel) | ✅ echt — Berechtigungen serverseitig in jeder Action erzwungen |
| Kunden-Freigabelinks (`/review/<token>`, ohne Login) | ✅ echt (Einmal-Token, 7 Tage gültig) |
| KI-Credits (Kauf/Verbrauch, serverseitige Preise) | ✅ persistiert, Abzug nur bei echtem KI-Erfolg |
| KI-Texte (Captions & Content-Ideen) | ✅ echt über Claude (`claude-opus-4-8`) — Demo-Platzhalter ohne Key |
| KI-Bilder (1024×1024) | ✅ echt über OpenAI (`gpt-image-1`), landen in der Medienbibliothek — Demo-Platzhalter ohne Key |
| BYO-API-Keys | ✅ verschlüsselt gespeichert (AES-256-GCM), werden für echte KI-Aufrufe genutzt |
| Publishing-Engine (Scheduler, Plattformregeln, Retries) | ✅ läuft lokal im Simulationsmodus — echte Plattform-APIs nach App-Review (`PUBLISH_MODE=live`) |
| Kunden-Freigabeseite `/connect/<token>` | ✅ funktioniert lokal (OAuth-Weiterleitung folgt in Phase 2b) |
| Stripe (Abo-Checkout, Credit-Kauf, Webhook, Kundenportal) | ✅ Code fertig — aktiviert sich mit `STRIPE_SECRET_KEY` in `.env`, sonst Demo-Modus |

## Sicherheit (Phase 1)

- Passwörter: bcrypt (Kostenfaktor 12), identische Fehlermeldung bei falscher
  E-Mail/Passwort (kein E-Mail-Enumerieren)
- Sessions: 32-Byte-Zufallstoken im httpOnly/SameSite-Cookie, in der DB nur der
  SHA-256-Hash, 30 Tage Laufzeit
- Autorisierung: jede Server Action lädt den Workspace aus der Session —
  fremde IDs aus dem Client werden immer gegen `workspaceId` geprüft
- Preise/Kosten für Credits stehen nur serverseitig
- Rollen & Rechte: jede mutierende Action prüft die Fähigkeit der Rolle erneut
  serverseitig (`can(role, capability)`) — die UI blendet Buttons nur zusätzlich
  aus. Der aktive Workspace steht in einem httpOnly-Cookie und wird bei jeder
  Anfrage gegen die Mitgliedschaft geprüft; Team-Einladungen sind Einmal-Links
  (7 Tage gültig)
- BYO-API-Keys: AES-256-GCM mit Schlüssel aus `APP_SECRET` (ENV, nicht im Repo)
- Uploads: MIME-Whitelist, 8-MB-Limit, zufällige Dateinamen

## Cloud-Deploy

**Schritt-für-Schritt-Anleitung: [`DEPLOY.md`](./DEPLOY.md)** (Railway oder Fly.io).

Kurz: Der Code ist deploy-fertig — DB und Uploads liegen per `DATABASE_URL` /
`UPLOADS_DIR` auf einem persistenten Volume, Migrationen laufen automatisch beim
Start (`npm run start:prod`), ein `Dockerfile` ist dabei. Läuft mit SQLite auf
**einer** Instanz (reicht für den Start); Postgres ist der spätere Skalierungsschritt.
