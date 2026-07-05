"use client";

import Link from "next/link";
import { useActionState } from "react";
import { register } from "@/lib/auth-actions";
import { inputCls } from "@/components/ui";

export function RegisterForm({ invite }: { invite?: string }) {
  const [state, formAction, pending] = useActionState(register, {});
  const loginHref = invite ? `/login?invite=${invite}` : "/login";

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 flex items-center justify-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-sm font-bold text-accent-contrast">
          P
        </span>
        <span className="text-xl font-semibold tracking-tight">Planbar</span>
      </div>

      <form action={formAction} className="rounded-2xl border border-line bg-surface p-6">
        {invite && (
          <div className="mb-4 rounded-xl border border-accent/40 bg-accent-soft px-3 py-2 text-sm text-accent-fg">
            Du bist eingeladen — nach der Registrierung trittst du dem Team automatisch bei.
          </div>
        )}
        <h1 className="text-lg font-semibold">Konto erstellen</h1>
        <p className="mt-1 text-sm text-muted">Kostenlos, keine Kreditkarte nötig.</p>
        <div className="mt-4 flex flex-col gap-4">
          {invite && <input type="hidden" name="invite" value={invite} />}
          <div>
            <label htmlFor="name" className="mb-1.5 block text-sm font-medium">
              Dein Name
            </label>
            <input
              id="name"
              name="name"
              autoComplete="name"
              required
              minLength={2}
              className={inputCls}
              placeholder="z. B. Andreas Klassen"
            />
          </div>
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
              E-Mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className={inputCls}
              placeholder="du@firma.de"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium">
              Passwort
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              className={inputCls}
              placeholder="Mindestens 8 Zeichen"
            />
          </div>
          {state.error && (
            <p className="rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">{state.error}</p>
          )}
          <button
            type="submit"
            disabled={pending}
            className="rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-accent-contrast transition hover:brightness-110 disabled:opacity-50"
          >
            {pending ? "Einen Moment …" : "Konto erstellen"}
          </button>
        </div>
      </form>

      <p className="mt-4 text-center text-sm text-muted">
        Schon ein Konto?{" "}
        <Link href={loginHref} className="font-medium text-accent-fg hover:underline">
          Einloggen
        </Link>
      </p>
    </div>
  );
}
