# Was geht über die Plattform-APIs? (Recherche-Stand Juli 2026)

Referenz für den Bau der echten Plattform-Anbindung (Publishing, Insights, Inbox,
Ads). Quellen: offizielle Developer-Doku von Meta, TikTok, LinkedIn, Google/YouTube,
Pinterest und X. Werte mit **⚠** vor Produktivstart in der jeweiligen Developer-Console
gegenprüfen — mehrere Plattformen haben 2025/2026 Regeln und Preise geändert.

## Grundmuster (gilt für alle)

- **Eine App/ein Projekt bei der Agentur** — jeder Kunde verbindet sein eigenes Konto per **OAuth**. Es gibt **keine harte Obergrenze** an Kunden; der Engpass sind **Rate-Limits/Quota** und **Freigaben**.
- **Fast überall App-Review + oft Firmen-/Business-Verifizierung nötig**, weil wir *fremde* Kundenkonten verwalten. Das ist der eigentliche Zeitfaktor (Tage bis Monate).
- **Geplantes Veröffentlichen (Scheduling)** ist bei den meisten **nicht** nativ — wir bauen den Scheduler selbst (haben wir schon). Ausnahmen: Facebook, YouTube, Pinterest können nativ planen.
- **Kein Cross-Posting-Wunder:** jede Plattform hat eigene Formate, Limits und Eigenheiten.

## Übersichts-Matrix

| Fähigkeit | Instagram | Facebook | TikTok | LinkedIn (Seite) | LinkedIn (Profil) | YouTube | Pinterest | X |
|---|---|---|---|---|---|---|---|---|
| Posten (Bild/Video) | ✅ | ✅ | ✅ (Audit) | ✅ | ✅ (nur eigenes) | ✅ | ✅ | ✅ |
| Karussell | ✅ (10) | ✅ | ✅ (Foto-Mode) | ❌ organisch | ❌ | – | ✅ | – |
| Stories/Reels/Shorts | ✅ | ✅ | ✅ | – | – | ✅ Shorts | – | – |
| Natives Scheduling | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |
| Insights/Analytics | ✅ | ✅ | ✅ (Business) | ✅ | ❌ faktisch dicht | ✅ | ✅ | ✅ (teuer) |
| Kommentare verwalten | ✅ | ✅ | ✅ (Business) | ✅ | ✅* | ✅ | ❌ | ✅ |
| DMs | ✅ (24h-Fenster) | ✅ | ✅ (Business) | ❌ | ❌ | – | – | ✅ (sehr limitiert) |
| Echtzeit-Webhooks | ✅ | ✅ | teils | ✅ (Seite) | ❌ | ❌ (Polling) | ❌ | nur Enterprise |
| Ads programmatisch | ✅ | ✅ | ✅ | ✅ | – | ✅ (Google Ads) | ✅ | ✅ (separat) |
| Freigabe-Aufwand | hoch | hoch | hoch (2 Portale) | **sehr hoch** (Partner) | niedrig | mittel (Quota-Audit) | mittel (Trial→Standard) | **teuer statt Review** |

\* LinkedIn-Kommentare auf Personen-Posts hängen an `r_member_social` (geschlossen).

---

## Meta — Instagram & Facebook

**Der wichtigste Kanal für unsere Zielgruppe.** Für Ads + Facebook-Seiten immer der
Weg „Facebook Login for Business" (IG-Konto mit FB-Seite verknüpft).

- **Posten:** Bild, Karussell (max. 10), Reels, Stories. IG-Publishing ist 2-stufig (Medien müssen als öffentliche HTTPS-URL bereitliegen). **IG-Scheduling selbst bauen; Facebook plant nativ** (`scheduled_publish_time`).
- **Nicht möglich:** IG-**Musikbibliothek/Trending Sounds** (Musik muss ins Video eingebettet sein; nur eigene Tonspur benennbar), **Story-Sticker/Links/Umfragen**, Kommentare **liken**, **Cold-DMs** (Kunde muss zuerst schreiben → 24-h-Antwortfenster, per „Human Agent"-Tag auf 7 Tage verlängerbar).
- **Limits:** ⚠ IG-Publishing **50–100 Posts/24 h pro Konto** (Doku widersprüchlich, live per `content_publishing_limit` prüfen).
- **Insights:** Reichweite, Engagement, Saves, Shares, Follower-Demografie, „beste Zeiten" (Näherung), Reel-/Story-Insights. ⚠ 2025 wurden viele Metriken umbenannt (`impressions` → `views`) — Datenmodell darauf auslegen.
- **Inbox:** Kommentare lesen/antworten/verbergen/löschen (nur eigene löschen), DMs lesen/senden, **Echtzeit-Webhooks** für neue Kommentare/DMs.
- **Ads:** voll programmatisch (Business Manager → Ad Account → Campaign → Ad Set → Ad), bestehenden Post **boosten**, ROAS/Insights auslesen. Kundenzugriff sauber über **System User + Business-Manager-Asset-Sharing**. ⚠ Marketing API v25 bringt Anfang 2026 einen Umbau (Advantage+).
- **Zugang:** Business-App, **App Review** für jeden produktiven Scope (`instagram_content_publish`, `..._manage_comments/messages/insights`, `pages_manage_posts`, `ads_management`, `business_management` …) + **Business-Verifizierung**. Review-Dauer typ. 2–7 Tage je Runde; jede Ablehnung +Tage. Häufigster Ablehnungsgrund: **Feature nicht gebaut / Screencast zeigt Permission nicht in Nutzung**.

## TikTok

Zwei getrennte Welten/Apps: **TikTok for Developers** (Login, Content Posting, Display)
und **TikTok API for Business** (Ads, Kommentare, tiefe Insights, DMs).

- **Posten:** Video **und** Foto/Karussell. „Direct Post" (direkt aufs Profil) oder „Upload to Draft". **Vor Audit sind alle Posts privat (SELF_ONLY) und max. 5 Nutzer/24 h** — der **Audit** schaltet öffentliches Posten frei. Pflicht-Vorschritt „Query Creator Info". ⚠ ~15 Posts/24 h pro Konto. Kein natives Scheduling.
- **Insights:** Basis (Follower, Likes, Views je Video) über Display API; **tiefe Analytics nur mit Business-Account** (Accounts/Video/Audience Insights).
- **Inbox:** Kommentare lesen/antworten/liken/verbergen/löschen **nur über Business-API + Business-Account**. DMs über „Business Messaging API" (separates Onboarding).
- **Ads:** voll über Marketing API + **Business Center**, inkl. **Spark Ads** (organische Posts bewerben).
- **Zugang:** zwei Apps/Portale, mehrere Audit-/Approval-Stufen, Business-Center-Verknüpfung je Kunde. Skaliert über Per-Token-Limits (Video-Init 6/min pro Konto).

## LinkedIn — der restriktivste Kanal

Zwei Welten: **selbstbedienbar** (Login, „Share on LinkedIn") und **gated Partner-Programme**
(Community Management API, Marketing/Advertising API) mit **manueller Freigabe**.

- **Ohne Partnerstatus geht nur:** Login + **Posten auf das persönliche Profil des eingeloggten Nutzers**. Keine Personen-Analytics.
- **Unternehmensseiten** (Posten, Analytics, Kommentare, Webhooks) brauchen die **Community Management API** (gated). **Persönliche Profile sind der Schwachpunkt:** Personen-Analytics/-Kommentar-Lesen hängen an `r_member_social`, das **für neue Apps geschlossen** ist.
- **Kein Karussell organisch** (nur als Ad), **kein API-Scheduling**, **kein Member-Messaging**.
- **Ads:** volle Advertising API (nach Freigabe); Dev-Tier auf 5 Ad Accounts begrenzt.
- **Zugang:** verifizierte App (eigene Firmenseite), Partner-Antrag. ⚠ **Freigabe dauert ~1–4 Monate**, kein SLA, Ablehnungen kommen vor. Token: 60 Tage (Access) / 12 Monate (Refresh) — Auto-Refresh je Kunde nötig.

## YouTube

- **Posten:** Video-Upload (Shorts = vertikales Video, kein eigener Endpoint). **Natives Scheduling** via `publishAt`.
- **Insights:** sehr reichhaltig (Views, Watchtime, Retention, Abo-Zuwachs, Traffic-Quellen, Demografie) über die YouTube Analytics API.
- **Inbox:** Kommentare voll verwaltbar (lesen/antworten/moderieren/löschen). **Keine Webhooks → Polling** (kostet Quota).
- **Ads:** nicht über die YouTube-API, sondern **Google Ads API** (eigener Developer-Token, MCC-Konto).
- **Zugang / Haupt-Engpass:** **10.000 Quota-Units/Tag pro Projekt — geteilt über ALLE Kunden.** ⚠ `videos.insert` kostete ~1.600 Units, evtl. Ende 2025 auf ~100 gesenkt (live prüfen). Höhere Quota nur über **Audit + Extension** (Wochen–Monate). OAuth-App-Verification bei >100 Nutzern.

## Pinterest

- **Posten:** Pins (Bild/Video/Karussell), Boards. **Natives Scheduling** via `publish_at` (geplante Pins sind aber nicht mehr editierbar).
- **Insights:** Pin-/Board-/Account-Analytics (Impressions, Saves, Outbound-Clicks), ~90 Tage rückwirkend.
- **Inbox:** **Kein Community-Management-API** (keine Kommentarverwaltung, keine Webhooks). Schwachpunkt.
- **Ads:** volle Ads-API (Kampagnen, Reporting) — Schreibzugriff erst mit Standard Access.
- **Zugang:** **Trial** (Sandbox, nur für Ersteller sichtbar, 1.000 Req/Tag) → **Standard Access** per Antrag + **Video-Demo**; Review Wochen, relevante Ablehnungsquote.

## X (Twitter) — wirtschaftlich heikel

- **Posten:** Tweets, Threads, Medien. Kein natives Scheduling.
- **Insights:** öffentliche Metriken breit; detaillierte nur für eigene Posts. Massen-Analytics vieler Konten wird schnell **teuer** (Reads kosten).
- **Inbox:** Replies/Mentions lesbar, DMs stark limitiert; **Echtzeit (Account Activity API) nur Enterprise**.
- **Ads:** eigene Ads-API (separater Antrag).
- **Zugang / Kosten (Feb. 2026 umgestellt):** neuer **Pay-per-use**-Default. ⚠ grob **0,015 $/Post**, **0,20 $/Post mit Link** (!), **0,005 $/gelesenem Post**; Legacy-Tarife Basic **200 $/Mon**, Pro **5.000 $/Mon**, Enterprise **ab ~50.000 $/Mon**. Der **Link-Aufschlag** trifft Agenturen hart (Social-Posts haben fast immer Links). **X ist der teuerste/heikelste Kanal.**

---

## Was heißt das für Planbar (Bau-Reihenfolge)

1. **Meta zuerst (Instagram + Facebook).** Größter Nutzen für die Zielgruppe, alle vier Bausteine (Publishing, Insights, Inbox, Ads) vorhanden. Deckt Fraukes Kernbedarf.
2. **TikTok als zweites.** Wichtig für die Zielgruppe; Aufwand durch zwei Portale + Audit, aber machbar.
3. **YouTube & Pinterest** danach — technisch okay, YouTube-Quota früh beantragen.
4. **LinkedIn** parallel früh **beantragen** (lange Wartezeit), aber realistisch nur **Unternehmensseiten**.
5. **X vorerst optional/abwarten** — Kosten prüfen; für viele Agenturen nicht wirtschaftlich.

**Technisch bei uns schon vorbereitet:** Adapter-Muster + Scheduler (Simulationsmodus),
Kunden-Verbindungslinks (OAuth-Platzhalter), Inbox, Analytics-UI. Es fehlt jeweils
die **echte OAuth-Anbindung + der freigegebene API-Zugang**.

## Was DU (Andreas) besorgen/anstoßen musst

- **Firma + Firmen-Nachweis** für Business-Verifizierung (Meta, LinkedIn).
- **Öffentlich erreichbare App + Datenschutzerklärung + Impressum** → dafür muss das Tool **deployed** sein (hängt zusammen mit der Deployment-Frage).
- **Developer-Apps anlegen** je Plattform (Meta, TikTok ×2, LinkedIn, Google Cloud, Pinterest).
- **Reviews/Audits einreichen** — Meta App Review, TikTok Content-Audit, LinkedIn Partner-Antrag (früh!), YouTube Quota-Extension, Pinterest Standard Access.
- Diese Freigaben laufen **Wochen bis Monate** — parallel starten, während wir die Anbindung technisch fertig bauen (im Simulationsmodus testbar).
