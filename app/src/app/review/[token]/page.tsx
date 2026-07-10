import { getReviewData } from "@/lib/review-actions";
import { ReviewClient } from "./review-client";

// Öffentliche Kunden-Freigabeseite: der Kunde sieht die eingereichten Beiträge
// und gibt sie frei / bittet um Änderungen — ohne eigenes Konto.
export default async function ReviewPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const data = await getReviewData(token);

  return (
    <div className="mx-auto min-h-screen max-w-2xl px-4 py-10">
      <div className="mb-8 flex items-center justify-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-sm font-bold text-accent-contrast">
          P
        </span>
        <span className="text-xl font-semibold tracking-tight">Planbar</span>
      </div>

      {!data.valid ? (
        <div className="rounded-2xl border border-line bg-surface p-6 text-center">
          <h1 className="text-lg font-semibold">Link nicht mehr gültig</h1>
          <p className="mt-2 text-sm text-muted">
            Dieser Freigabe-Link ist abgelaufen oder wurde zurückgezogen. Bitte fordere einen neuen
            an.
          </p>
        </div>
      ) : (
        <ReviewClient token={token} initial={data} />
      )}
    </div>
  );
}
