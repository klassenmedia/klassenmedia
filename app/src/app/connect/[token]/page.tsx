import { db } from "@/lib/db";
import { PLATFORMS, Platform } from "@/lib/types";
import { ConnectButton } from "./connect-button";

// Öffentliche Freigabe-Seite: Der Kunde öffnet den Verbindungslink,
// sieht wer was anfragt, und gibt sein Profil frei — ohne eigenes Konto.
export default async function ConnectPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const invite = await db.connectionInvite.findUnique({
    where: { token },
    include: { workspace: true },
  });

  const valid =
    invite && invite.status === "pending" && invite.expiresAt >= new Date();
  const platformLabel = invite
    ? PLATFORMS[invite.platform as Platform]?.label ?? invite.platform
    : "";

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center justify-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-sm font-bold text-accent-contrast">
            P
          </span>
          <span className="text-xl font-semibold tracking-tight">Planbar</span>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-6">
          {!valid ? (
            <>
              <h1 className="text-lg font-semibold">Link nicht mehr gültig</h1>
              <p className="mt-2 text-sm text-muted">
                {invite?.status === "accepted"
                  ? "Diese Freigabe wurde bereits erteilt — es ist nichts weiter zu tun."
                  : "Dieser Verbindungslink ist abgelaufen oder wurde zurückgezogen. Bitte fordere einen neuen Link an."}
              </p>
            </>
          ) : (
            <>
              <h1 className="text-lg font-semibold">Zugriff freigeben</h1>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                <strong className="text-foreground">{invite.workspace.name}</strong>{" "}
                möchte Beiträge für dein{" "}
                <strong className="text-foreground">{platformLabel}</strong>-Profil
                („{invite.clientName}“) planen und veröffentlichen.
              </p>
              <ul className="mt-4 flex flex-col gap-2 text-sm text-muted">
                <li className="flex gap-2">
                  <span className="text-success">✓</span> Du loggst dich direkt bei{" "}
                  {platformLabel} ein — dein Passwort sieht niemand
                </li>
                <li className="flex gap-2">
                  <span className="text-success">✓</span> Du kannst den Zugriff jederzeit
                  in den {platformLabel}-Einstellungen widerrufen
                </li>
              </ul>
              <ConnectButton token={token} platformLabel={platformLabel} />
              <p className="mt-3 text-center text-xs text-muted">
                Lokale Entwicklung: Die Freigabe wird simuliert — der echte{" "}
                {platformLabel}-Login folgt mit der Plattform-Anbindung.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
