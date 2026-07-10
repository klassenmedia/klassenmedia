# Deployment — Planbar ins Netz bringen

Ziel: eine echte, öffentlich erreichbare URL, damit (a) Kunden das Tool nutzen
können und (b) die Plattform-App-Reviews (Meta usw.) starten können — die
verlangen eine erreichbare App + Datenschutzerklärung.

Der Code ist dafür fertig vorbereitet:
- **Datenbank & Uploads liegen auf einer persistenten Platte (Volume)** — per
  `DATABASE_URL` und `UPLOADS_DIR` konfigurierbar.
- **Migrationen laufen automatisch beim Start** (`npm run start:prod` →
  `prisma migrate deploy && next start`).
- Ein fertiges **`Dockerfile`** ist dabei.

> **Wichtig:** Läuft mit **SQLite** auf **genau EINER Instanz** (kein
> horizontales Skalieren) — das reicht locker für den Start (viele Kunden, ein
> Server). Der Umstieg auf Postgres ist der spätere Skalierungsschritt (siehe unten).

---

## Variante A — Railway (am einfachsten, empfohlen für den Start)

1. Konto auf **railway.app** anlegen, mit GitHub verbinden.
2. **New Project → Deploy from GitHub repo →** dieses Repo wählen.
3. In den Service-**Settings**:
   - **Root Directory:** `app`  (der Code liegt im Unterordner `app/`)
   - Railway erkennt das `Dockerfile` automatisch.
4. **Volume hinzufügen** (Service → *Volumes* → *New Volume*):
   - **Mount path:** `/data`
   - Darin liegen dauerhaft die SQLite-DB **und** die Uploads.
5. **Variables** (Environment) setzen:
   | Variable | Wert |
   |---|---|
   | `APP_SECRET` | 64 Hex-Zeichen — lokal erzeugen: `openssl rand -hex 32` |
   | `DATABASE_URL` | `file:/data/prod.db` |
   | `UPLOADS_DIR` | `/data/uploads` |
   | *(optional)* `ANTHROPIC_API_KEY` | für echte KI-Texte |
   | *(optional)* `OPENAI_API_KEY` | für echte KI-Bilder |
   | *(optional)* `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | für echte Zahlungen |
   | *(optional)* `PUBLIC_APP_URL` | öffentliche URL der App (z. B. `https://…up.railway.app`) — nötig fürs Live-Posten von Bildern/Videos |
   | *(optional)* `META_APP_ID` / `META_APP_SECRET` u. a. | Plattform-Logins (OAuth) — je Plattform siehe `.env.example`; Redirect-URI: `https://<domain>/api/oauth/<plattform>/callback` |
   | *(später)* `PUBLISH_MODE` | `live` — WordPress sofort, Social nach App-Review |

   `PORT` setzt Railway automatisch — nicht selbst setzen.
6. **Deploy.** Der erste Start legt über `migrate deploy` das Datenbankschema auf
   dem Volume an.
7. Unter **Settings → Networking → Generate Domain** bekommst du eine
   `…up.railway.app`-URL. (Eigene Domain später dort hinterlegbar.)

**Demo-Daten (optional):** Willst du den Demo-Login `demo@klassenmedia.de` auch
online, einmal im Railway-Service-Shell `node prisma/seed.mjs` ausführen.
Sonst registrieren sich echte Nutzer einfach unter `/register`.

---

## Variante B — Fly.io (ideal für SQLite + Volume)

```bash
cd app
fly launch            # erkennt Dockerfile; noch nicht deployen
fly volumes create data --size 1     # 1 GB Volume
# in fly.toml: [mounts] source="data" destination="/data"
fly secrets set APP_SECRET=$(openssl rand -hex 32) \
  DATABASE_URL="file:/data/prod.db" UPLOADS_DIR="/data/uploads"
fly deploy
```
Nur **eine** Maschine laufen lassen (`fly scale count 1`).

---

## Nach dem Deploy — für die App-Reviews nötig

- **Datenschutzerklärung + Impressum** als öffentliche Seiten (Meta/TikTok/… verlangen einen Privacy-Policy-Link). → sag Bescheid, dann baue ich `/datenschutz` und `/impressum`.
- **Business-Verifizierung** deiner Firma (Meta, LinkedIn).
- Developer-Apps anlegen und Reviews einreichen (Details in `../API_MOEGLICHKEITEN.md`).

## Später: Umstieg auf Postgres (Skalierung)

Nötig erst, wenn eine Instanz nicht mehr reicht oder du zeroständige Deploys
willst:
1. `prisma/schema.prisma`: `provider = "postgresql"`, String-Status-Felder zu
   echten Enums.
2. Managed Postgres beim Hoster anlegen, `DATABASE_URL` darauf zeigen.
3. Uploads bleiben auf dem Volume oder wandern auf S3/R2 (dann `UPLOADS_DIR`
   bzw. die Serve-Route auf Objektspeicher umstellen).

## Lokal testen (wie es in Prod läuft)

```bash
cd app
docker build -t planbar .
docker run -p 3000:3000 -v planbar_data:/data \
  -e APP_SECRET=$(openssl rand -hex 32) planbar
# → http://localhost:3000
```
