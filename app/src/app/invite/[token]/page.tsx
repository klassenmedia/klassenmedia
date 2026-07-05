import Link from "next/link";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { ROLE_HINTS, ROLE_LABELS, type Role } from "@/lib/permissions";
import { acceptInviteAction } from "./accept-action";

// Öffentliche Einladungsseite: Wer den Link öffnet, tritt (nach Login/
// Registrierung) dem Workspace mit der eingeladenen Rolle bei. Token = Zugang.
export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const invite = await db.teamInvite.findUnique({
    where: { token },
    include: { workspace: true },
  });

  const valid = invite && invite.status === "pending" && invite.expiresAt >= new Date();
  const user = await getSessionUser();
  const role = (invite?.role ?? "editor") as Role;

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
              <h1 className="text-lg font-semibold">Einladung nicht mehr gültig</h1>
              <p className="mt-2 text-sm text-muted">
                {invite?.status === "accepted"
                  ? "Diese Einladung wurde bereits angenommen."
                  : "Diese Einladung ist abgelaufen oder wurde zurückgezogen. Bitte fordere eine neue an."}
              </p>
              <Link
                href="/login"
                className="mt-5 block rounded-xl bg-accent px-4 py-2.5 text-center text-sm font-medium text-accent-contrast transition hover:brightness-110"
              >
                Zum Login
              </Link>
            </>
          ) : (
            <>
              <h1 className="text-lg font-semibold">Team-Einladung</h1>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                <strong className="text-foreground">{invite.invitedBy}</strong> lädt dich in den
                Workspace <strong className="text-foreground">{invite.workspace.name}</strong> ein.
              </p>
              <div className="mt-4 rounded-xl border border-line bg-surface-2 px-4 py-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted">Deine Rolle</span>
                  <span className="font-semibold text-accent-fg">{ROLE_LABELS[role]}</span>
                </div>
                <p className="mt-1.5 text-xs text-muted">{ROLE_HINTS[role]}</p>
              </div>

              {user ? (
                <form action={acceptInviteAction} className="mt-5">
                  <input type="hidden" name="token" value={token} />
                  <p className="mb-3 text-sm text-muted">
                    Eingeloggt als <strong className="text-foreground">{user.email}</strong>.
                  </p>
                  <button
                    type="submit"
                    className="block w-full rounded-xl bg-accent px-4 py-2.5 text-center text-sm font-medium text-accent-contrast transition hover:brightness-110"
                  >
                    Beitreten
                  </button>
                </form>
              ) : (
                <div className="mt-5 flex flex-col gap-2">
                  <Link
                    href={`/register?invite=${token}`}
                    className="block rounded-xl bg-accent px-4 py-2.5 text-center text-sm font-medium text-accent-contrast transition hover:brightness-110"
                  >
                    Konto erstellen & beitreten
                  </Link>
                  <Link
                    href={`/login?invite=${token}`}
                    className="block rounded-xl border border-line px-4 py-2.5 text-center text-sm font-medium transition hover:bg-surface-2"
                  >
                    Ich habe schon ein Konto
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
