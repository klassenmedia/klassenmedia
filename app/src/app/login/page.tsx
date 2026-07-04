"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login } from "@/lib/auth-actions";
import { inputCls } from "@/components/ui";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, {});

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center justify-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-sm font-bold text-accent-contrast">
            P
          </span>
          <span className="text-xl font-semibold tracking-tight">Planbar</span>
        </div>

        <form
          action={formAction}
          className="rounded-2xl border border-line bg-surface p-6"
        >
          <h1 className="text-lg font-semibold">Einloggen</h1>
          <div className="mt-4 flex flex-col gap-4">
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
                autoComplete="current-password"
                required
                className={inputCls}
                placeholder="••••••••"
              />
            </div>
            {state.error && (
              <p className="rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">
                {state.error}
              </p>
            )}
            <button
              type="submit"
              disabled={pending}
              className="rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-accent-contrast transition hover:brightness-110 disabled:opacity-50"
            >
              {pending ? "Einen Moment …" : "Einloggen"}
            </button>
          </div>
        </form>

        <p className="mt-4 text-center text-sm text-muted">
          Noch kein Konto?{" "}
          <Link href="/register" className="font-medium text-accent-fg hover:underline">
            Kostenlos registrieren
          </Link>
        </p>
      </div>
    </div>
  );
}
