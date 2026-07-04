import { CreditEntry, Post, SocialAccount, toDateKey } from "./types";

// Demo-Daten für den Prototyp. In Phase 1 (KONZEPT.md) wird das durch
// Postgres/Prisma ersetzt — die Struktur entspricht bereits dem Schema.

export const DEMO_ACCOUNTS: SocialAccount[] = [
  { id: "acc-ig-1", platform: "instagram", displayName: "Klassen Media", handle: "@klassenmedia" },
  { id: "acc-fb-1", platform: "facebook", displayName: "Klassen Media", handle: "Klassen Media GmbH" },
  { id: "acc-tt-1", platform: "tiktok", displayName: "Klassen Media", handle: "@klassenmedia" },
  { id: "acc-li-1", platform: "linkedin", displayName: "Andreas Klassen", handle: "andreas-klassen" },
  { id: "acc-yt-1", platform: "youtube", displayName: "Klassen Media", handle: "@klassenmedia" },
];

function day(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return toDateKey(d);
}

export function buildDemoPosts(): Post[] {
  return [
    {
      id: "post-1",
      body: "Behind the Scenes: So entsteht bei uns ein Kundenprojekt – vom ersten Call bis zum Launch. 🎬",
      date: day(-2),
      time: "09:00",
      accountIds: ["acc-ig-1", "acc-fb-1"],
      status: "published",
      hasImage: true,
    },
    {
      id: "post-2",
      body: "3 Fehler, die fast jedes Unternehmen auf Social Media macht – und wie du sie vermeidest. 🧵",
      date: day(-1),
      time: "18:30",
      accountIds: ["acc-li-1"],
      status: "published",
    },
    {
      id: "post-3",
      body: "Neues Reel: Unser Büro-Umbau im Zeitraffer ⏱️ #officemakeover",
      date: day(0),
      time: "12:00",
      accountIds: ["acc-ig-1", "acc-tt-1"],
      status: "scheduled",
      hasImage: true,
    },
    {
      id: "post-4",
      body: "Kundenstimme der Woche: „Endlich ein Partner, der mitdenkt.“ – Danke, Familie Berger! 💜",
      date: day(1),
      time: "10:00",
      accountIds: ["acc-fb-1", "acc-ig-1"],
      status: "scheduled",
    },
    {
      id: "post-5",
      body: "Tutorial: In 5 Minuten zum perfekten Content-Plan für einen ganzen Monat.",
      date: day(3),
      time: "16:00",
      accountIds: ["acc-yt-1"],
      status: "scheduled",
      hasImage: true,
    },
    {
      id: "post-6",
      body: "Jobangebot: Wir suchen eine:n Mediengestalter:in (m/w/d) in Vollzeit. Jetzt bewerben!",
      date: day(5),
      time: "08:30",
      accountIds: ["acc-li-1", "acc-fb-1"],
      status: "scheduled",
    },
    {
      id: "post-7",
      body: "Freitags-Tipp: Die beste Posting-Zeit ist die, zu der DEINE Zielgruppe online ist – nicht die aus dem Blog-Artikel. 📊",
      date: day(8),
      time: "11:15",
      accountIds: ["acc-ig-1"],
      status: "scheduled",
    },
    {
      id: "post-8",
      body: "Ideensammlung Sommer-Kampagne ☀️ (noch ohne Termin-Feinschliff)",
      date: day(12),
      time: "09:00",
      accountIds: ["acc-ig-1", "acc-tt-1", "acc-fb-1"],
      status: "draft",
    },
  ];
}

export const DEMO_CREDIT_LOG: CreditEntry[] = [
  { id: "ct-1", label: "Monatliches Kontingent (Pro)", amount: 500, when: "01.07.2026" },
  { id: "ct-2", label: "Caption-Vorschlag (Instagram)", amount: -1, when: "01.07.2026" },
  { id: "ct-3", label: "Bild generiert (1024×1024)", amount: -6, when: "02.07.2026" },
  { id: "ct-4", label: "Monatsplan-Entwurf (30 Ideen)", amount: -12, when: "02.07.2026" },
  { id: "ct-5", label: "Caption-Vorschlag (LinkedIn)", amount: -1, when: "03.07.2026" },
];

export const AI_CAPTION_IDEAS: string[] = [
  "Stell dir vor, dein Content plant sich fast von selbst. 💡 Genau daran arbeiten wir gerade – mehr dazu diese Woche!",
  "Konsistenz schlägt Perfektion. Lieber 3 gute Posts pro Woche als 1 perfekter pro Monat. Wer's fühlt: 🙋",
  "Wir haben unsere Content-Planung komplett umgestellt – und sparen jetzt 6 Stunden pro Woche. So geht's: 🧵",
  "Der Sommer ist da ☀️ Zeit für frischen Content: Heute zeigen wir euch, was hinter den Kulissen passiert.",
  "Frage an euch: Welches Thema sollen wir als Nächstes aufgreifen? Schreibt's in die Kommentare! 👇",
];
