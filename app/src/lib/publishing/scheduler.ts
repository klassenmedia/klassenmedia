// Der Scheduler: verarbeitet fällige Posts und vergibt monatliche
// Credit-Kontingente. Läuft lokal als Intervall im Next-Server-Prozess
// (gestartet über src/instrumentation.ts); in der Cloud später als
// eigener Worker/Cron mit derselben processDuePosts()-Funktion.

import { db } from "../db";
import { getAdapter } from "./adapters";
import { logActivity } from "../activity";

const MAX_ATTEMPTS = 3;
const PLAN_CREDITS: Record<string, number> = { starter: 100, pro: 500, agency: 2000 };

export async function processDuePosts(): Promise<void> {
  const due = await db.post.findMany({
    where: {
      status: "scheduled",
      scheduledAt: { lte: new Date() },
      // Erinnerungs-Posts nur EINMAL einsammeln (reminderSentAt noch leer) —
      // danach warten sie auf die manuelle Bestätigung, nicht auf den Scheduler.
      OR: [{ reminderMode: false }, { reminderSentAt: null }],
    },
    include: {
      accounts: { include: { account: true } },
      media: true,
    },
    take: 20,
  });

  for (const post of due) {
    if (post.reminderMode) {
      const claimed = await db.post.updateMany({
        where: { id: post.id, status: "scheduled", reminderSentAt: null },
        data: { reminderSentAt: new Date() },
      });
      if (claimed.count === 0) continue;
      await logActivity(post.workspaceId, "System", "reminder_due", post.title || post.body);
      continue;
    }

    // Doppelverarbeitung verhindern (z. B. bei überlappenden Läufen):
    // nur weitermachen, wenn wir den Status exklusiv umsetzen konnten
    const claimed = await db.post.updateMany({
      where: { id: post.id, status: "scheduled" },
      data: { status: "publishing" },
    });
    if (claimed.count === 0) continue;

    let anyFailed = false;
    for (const target of post.accounts) {
      if (target.publishedAt) continue; // bereits erfolgreich (Retry-Lauf)

      try {
        const media = [...post.media].sort((a, b) => a.sortOrder - b.sortOrder);
        const result = await getAdapter(target.account.platform).publish(
          {
            body: post.body,
            format: post.format,
            mediaCount: post.media.length,
            title: post.title,
            mediaUrls: media.map((m) => m.url),
          },
          {
            platform: target.account.platform,
            handle: target.account.handle,
            accessTokenEnc: target.account.accessTokenEnc,
            externalId: target.account.externalId,
          }
        );
        await db.postAccount.update({
          where: { id: target.id },
          data: {
            publishedPostId: result.externalId,
            publishedAt: new Date(),
            error: null,
            attemptCount: target.attemptCount + 1,
          },
        });
      } catch (e) {
        anyFailed = true;
        await db.postAccount.update({
          where: { id: target.id },
          data: {
            error: e instanceof Error ? e.message : "Unbekannter Fehler",
            attemptCount: target.attemptCount + 1,
          },
        });
      }
    }

    if (!anyFailed) {
      await db.post.update({ where: { id: post.id }, data: { status: "published" } });
      await logActivity(post.workspaceId, "System", "published", post.body);
      continue;
    }

    // Retry-Logik: Validierungsfehler ändern sich nicht von allein — aber
    // transiente API-Fehler (Phase 2b) schon. Bis MAX_ATTEMPTS zurück in
    // die Warteschlange, danach endgültig "failed".
    const targets = await db.postAccount.findMany({ where: { postId: post.id } });
    const retryable = targets.some(
      (t) => !t.publishedAt && t.attemptCount < MAX_ATTEMPTS
    );
    await db.post.update({
      where: { id: post.id },
      data: { status: retryable ? "scheduled" : "failed" },
    });
  }
}

/** Monatliches Credit-Kontingent des Tarifs gutschreiben (alle 30 Tage). */
export async function grantMonthlyCredits(): Promise<void> {
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const dueWorkspaces = await db.workspace.findMany({
    where: {
      OR: [{ lastGrantAt: null }, { lastGrantAt: { lt: cutoff } }],
    },
    take: 50,
  });

  for (const ws of dueWorkspaces) {
    const credits = PLAN_CREDITS[ws.plan] ?? 0;
    if (!credits) continue;
    // lastGrantAt zuerst exklusiv setzen — verhindert Doppel-Gutschrift
    const claimed = await db.workspace.updateMany({
      where: { id: ws.id, lastGrantAt: ws.lastGrantAt },
      data: { lastGrantAt: new Date() },
    });
    if (claimed.count === 0) continue;
    await db.workspace.update({
      where: { id: ws.id },
      data: {
        creditBalance: { increment: credits },
        creditTransactions: {
          create: {
            type: "plan_grant",
            amount: credits,
            description: `Monatliches Kontingent (${ws.plan})`,
          },
        },
      },
    });
  }
}

const globalScheduler = globalThis as unknown as { schedulerStarted?: boolean };

/** Startet den lokalen Scheduler-Loop genau einmal pro Prozess. */
export function startScheduler(): void {
  if (globalScheduler.schedulerStarted) return;
  globalScheduler.schedulerStarted = true;

  const tick = async () => {
    try {
      await grantMonthlyCredits();
      await processDuePosts();
    } catch (e) {
      console.error("[scheduler]", e);
    }
  };
  void tick();
  setInterval(tick, 20_000); // lokal alle 20s; Cloud-Cron später minütlich
  console.log("[scheduler] gestartet (Intervall 20s, Modus: " +
    (process.env.PUBLISH_MODE === "live" ? "LIVE" : "Simulation") + ")");
}
