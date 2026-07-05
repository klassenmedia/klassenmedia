"use server";

import { z } from "zod";
import { requireWorkspace } from "./auth";
import { getAnalytics, Analytics } from "./analytics";

/** Analytics für einen Zeitraum laden (7 / 30 / 90 Tage). */
export async function getAnalyticsAction(rangeDays: unknown): Promise<Analytics> {
  const { workspace } = await requireWorkspace();
  const range = z.coerce.number().int().refine((n) => [7, 30, 90].includes(n), "range")
    .catch(30)
    .parse(rangeDays);
  return getAnalytics(workspace.id, range);
}
