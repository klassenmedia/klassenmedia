import { requireWorkspace } from "@/lib/auth";
import { getAnalytics } from "@/lib/analytics";
import { AnalyticsView } from "@/components/analytics-view";

// Server-Component: lädt die Standard-Analytics (30 Tage) und übergibt sie an
// die interaktive Client-Ansicht. Der Zeitraum-Umschalter lädt per Server
// Action nach.
export default async function AnalyticsPage() {
  const { workspace } = await requireWorkspace();
  const initial = await getAnalytics(workspace.id, 30);
  return <AnalyticsView initial={initial} />;
}
