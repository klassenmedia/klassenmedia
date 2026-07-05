// Demo-Daten: npm run db:seed
// Legt den Nutzer demo@klassenmedia.de (Passwort: demo1234) mit Accounts,
// Posts in allen Formaten, Kommentaren und Credit-Verlauf an.

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

function at(dayOffset, hour, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, minute, 0, 0);
  return d;
}

const CAPTIONS = {
  bts: "Behind the Scenes: So entsteht bei uns ein Kundenprojekt – vom ersten Call bis zum Launch. 🎬",
  fehler: "3 Fehler, die fast jedes Unternehmen auf Social Media macht – und wie du sie vermeidest. 🧵",
  reel: "Neues Reel: Unser Büro-Umbau im Zeitraffer ⏱️ #officemakeover",
  kunde: "Kundenstimme der Woche: „Endlich ein Partner, der mitdenkt.“ – Danke, Familie Berger! 💜",
  tutorial: "Tutorial: In 5 Minuten zum perfekten Content-Plan für einen ganzen Monat.",
  job: "Jobangebot: Wir suchen eine:n Mediengestalter:in (m/w/d) in Vollzeit. Jetzt bewerben!",
  story: "Freitags-Tipp: Die beste Posting-Zeit ist die, zu der DEINE Zielgruppe online ist. 📊",
  karussell: "Ideensammlung Sommer-Kampagne ☀️ (noch ohne Termin-Feinschliff)",
};

async function main() {
  const email = "demo@klassenmedia.de";
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    console.log("Demo-Nutzer existiert schon — nichts zu tun.");
    return;
  }

  const passwordHash = await bcrypt.hash("demo1234", 12);

  const user = await db.user.create({
    data: { email, name: "Andreas (Demo)", passwordHash },
  });

  const workspace = await db.workspace.create({
    data: {
      name: "Klassen Media",
      plan: "pro",
      creditBalance: 480,
      members: { create: { userId: user.id, role: "owner" } },
      creditTransactions: {
        create: [
          { type: "plan_grant", amount: 500, description: "Monatliches Kontingent (Pro)" },
          { type: "usage_text", amount: -1, description: "Caption-Vorschlag (Instagram)" },
          { type: "usage_image", amount: -6, description: "Bild generiert (1024×1024)" },
          { type: "usage_text", amount: -12, description: "Monatsplan-Entwurf (30 Ideen)" },
          { type: "usage_text", amount: -1, description: "Caption-Vorschlag (LinkedIn)" },
        ],
      },
    },
  });

  // Kunden (Mandanten der Agentur)
  const clientKM = await db.client.create({
    data: { workspaceId: workspace.id, name: "Klassen Media", color: "#2563eb" },
  });
  const clientBB = await db.client.create({
    data: { workspaceId: workspace.id, name: "Bäckerei Berger", color: "#f59e0b" },
  });

  const [ig, fb, tt, li, yt] = await Promise.all(
    [
      { platform: "instagram", displayName: "Klassen Media", handle: "@klassenmedia", clientId: clientKM.id },
      { platform: "facebook", displayName: "Bäckerei Berger", handle: "Bäckerei Berger", clientId: clientBB.id },
      { platform: "tiktok", displayName: "Bäckerei Berger", handle: "@baeckerei.berger", clientId: clientBB.id },
      { platform: "linkedin", displayName: "Andreas Klassen", handle: "andreas-klassen", clientId: clientKM.id },
      { platform: "youtube", displayName: "Klassen Media", handle: "@klassenmedia", clientId: clientKM.id },
    ].map((a) => db.socialAccount.create({ data: { workspaceId: workspace.id, ...a } }))
  );

  async function post(body, dayOffset, hour, minute, accounts, status, format, hues, clientId) {
    return db.post.create({
      data: {
        workspaceId: workspace.id,
        clientId,
        body,
        scheduledAt: at(dayOffset, hour, minute),
        status,
        format,
        accounts: { create: accounts.map((a) => ({ accountId: a.id })) },
        media: {
          create: hues.map((hue, i) => ({
            workspaceId: workspace.id,
            url: `placeholder:${hue}`,
            source: "placeholder",
            sortOrder: i,
          })),
        },
      },
    });
  }

  const p1 = await post(CAPTIONS.bts, -2, 9, 0, [ig], "published", "image", [210], clientKM.id);
  await post(CAPTIONS.fehler, -1, 18, 30, [li], "published", "text", [], clientKM.id);
  const p3 = await post(CAPTIONS.reel, 0, 12, 0, [ig], "scheduled", "video", [280], clientKM.id);
  await post(CAPTIONS.kunde, 1, 10, 0, [fb], "scheduled", "image", [30], clientBB.id);
  await post(CAPTIONS.tutorial, 3, 16, 0, [yt], "scheduled", "video", [150], clientKM.id);
  await post(CAPTIONS.job, 5, 8, 30, [li], "scheduled", "text", [], clientKM.id);
  await post(CAPTIONS.story, 8, 11, 15, [fb], "scheduled", "story", [330], clientBB.id);
  // ein Beitrag wartet auf Freigabe (Phase-7-Demo)
  const p8 = await post(CAPTIONS.karussell, 12, 9, 0, [tt, fb], "draft", "carousel", [45, 90, 200], clientBB.id);
  await db.post.update({
    where: { id: p8.id },
    data: { approval: "pending", submittedAt: new Date() },
  });

  await db.reviewLink.create({
    data: {
      workspaceId: workspace.id,
      clientName: "Bäckerei Berger",
      token: "reviewdemo0001abcd",
      expiresAt: at(7, 12),
    },
  });

  await db.activityLog.createMany({
    data: [
      { workspaceId: workspace.id, actor: "Andreas", action: "submitted", target: CAPTIONS.karussell },
      { workspaceId: workspace.id, actor: "System", action: "published", target: CAPTIONS.bts },
      { workspaceId: workspace.id, actor: "Andreas", action: "connected", target: "Instagram · @klassenmedia" },
    ],
  });

  await db.comment.createMany({
    data: [
      {
        workspaceId: workspace.id,
        postId: p1.id,
        author: "Julia M.",
        authorHandle: "@julia.macht.was",
        text: "Mega spannend! Wie lange dauert so ein Projekt bei euch im Schnitt? 🙌",
      },
      {
        workspaceId: workspace.id,
        postId: p1.id,
        author: "Bäckerei Berger",
        authorHandle: "@baeckerei.berger",
        text: "Können wir bestätigen — die Zusammenarbeit war top!",
        likedByUs: true,
      },
      {
        workspaceId: workspace.id,
        postId: p3.id,
        author: "Tom K.",
        authorHandle: "@tomk_media",
        text: "Welches Tool nutzt ihr für den Zeitraffer?",
      },
    ],
  });

  const invite = await db.connectionInvite.create({
    data: {
      workspaceId: workspace.id,
      clientId: clientBB.id,
      platform: "instagram",
      clientName: "Bäckerei Berger",
      token: "k3x9mq2vdemo0001",
      expiresAt: at(7, 12),
    },
  });

  // CRM-Demo für Bäckerei Berger (Stammdaten, Ansprechpartner, Aufgaben)
  await db.client.update({
    where: { id: clientBB.id },
    data: {
      company: "Bäckerei Berger GmbH",
      website: "https://baeckerei-berger.example",
      notes:
        "Fokus auf frische Backwaren & Regionalität. Keine Stockfotos – echte Bilder aus der Backstube. Beste Postingzeit morgens.",
      goals: "Mehr Laufkundschaft, Bekanntheit in der Region steigern.",
      audience: "Familien & Berufstätige aus der Umgebung, 25–55.",
      topics: "Frische Backwaren, Team hinter der Theke, saisonale Aktionen.",
      brandColors: "#8B5E34, #F5E9DA",
      fonts: "Playfair Display, Inter",
      hashtags: "#baeckereiberger #regional #frischgebacken #handwerk",
    },
  });
  await db.clientContact.create({
    data: {
      clientId: clientBB.id,
      name: "Familie Berger",
      role: "Inhaber",
      email: "kontakt@baeckerei-berger.example",
      phone: "+49 30 1234567",
    },
  });
  await db.clientTask.createMany({
    data: [
      { clientId: clientBB.id, title: "Fotoshooting Backstube planen", dueDate: at(5, 10) },
      { clientId: clientBB.id, title: "Sommer-Kampagne freigeben lassen", done: false },
      { clientId: clientBB.id, title: "Instagram-Account verbinden", done: true },
    ],
  });

  console.log("Demo-Daten angelegt:");
  console.log("  Login:    demo@klassenmedia.de");
  console.log("  Passwort: demo1234");
  console.log(`  (${[ig, fb, tt, li, yt].length} Accounts, 8 Posts, 3 Kommentare, 1 Einladung ${invite.token})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
