import "server-only";

import { db } from "./db";

/** Ein Ereignis ins Aktivitätsprotokoll schreiben (fehlertolerant). */
export async function logActivity(
  workspaceId: string,
  actor: string,
  action: string,
  target?: string | null
): Promise<void> {
  await db.activityLog
    .create({
      data: {
        workspaceId,
        actor,
        action,
        target: target ? target.slice(0, 120) : null,
      },
    })
    .catch(() => {});
}
