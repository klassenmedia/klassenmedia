"use client";

import { useStore } from "@/lib/store";
import { Button } from "@/components/ui";
import { PLANS, PlanTier } from "@/lib/types";

export default function BillingPage() {
  const { plan, setPlan } = useStore();

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Abo & Zahlung</h1>
        <p className="mt-1 text-sm text-muted">
          Alle Tarife mit unbegrenzten Social Accounts und unbegrenztem Planungshorizont.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {(Object.keys(PLANS) as PlanTier[]).map((tier) => {
          const p = PLANS[tier];
          const active = plan === tier;
          return (
            <div
              key={tier}
              className={`flex flex-col rounded-2xl border bg-surface p-6 ${
                active ? "border-accent" : "border-line"
              }`}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{p.name}</h3>
                {active && (
                  <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-contrast">
                    Aktueller Tarif
                  </span>
                )}
              </div>
              <div className="mt-3">
                <span className="text-3xl font-semibold">{p.price} €</span>
                <span className="text-sm text-muted"> / Monat</span>
              </div>
              <ul className="mt-4 flex flex-col gap-2 text-sm text-muted">
                <li className="flex gap-2"><span className="text-success">✓</span>{p.workspaces}</li>
                <li className="flex gap-2"><span className="text-success">✓</span>{p.members}</li>
                <li className="flex gap-2">
                  <span className="text-success">✓</span>
                  {p.credits.toLocaleString("de-DE")} KI-Credits / Monat
                </li>
                {p.extras.map((e) => (
                  <li key={e} className="flex gap-2">
                    <span className="text-success">✓</span>
                    {e}
                  </li>
                ))}
              </ul>
              <div className="mt-auto pt-5">
                <Button
                  className="w-full"
                  variant={active ? "ghost" : "primary"}
                  disabled={active}
                  onClick={() => setPlan(tier)}
                >
                  {active ? "Aktiv" : `Zu ${p.name} wechseln (Demo)`}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-line bg-surface p-6">
          <h3 className="font-semibold">Zahlungsmethode & Rechnungen</h3>
          <p className="mt-2 text-sm text-muted">
            Im fertigen Produkt öffnet sich hier das Stripe Customer Portal: Zahlungsmethode
            ändern, Rechnungen herunterladen, Abo kündigen — alles Self-Service, ohne Support-Ticket.
          </p>
          <Button variant="ghost" className="mt-4" disabled>
            Stripe Customer Portal (folgt in Phase 3)
          </Button>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-6">
          <h3 className="font-semibold">Jährlich zahlen & sparen</h3>
          <p className="mt-2 text-sm text-muted">
            Bei jährlicher Zahlung sind 2 Monate geschenkt (≈ −17 %). Umstellung jederzeit
            zum nächsten Abrechnungszeitraum möglich.
          </p>
          <Button variant="ghost" className="mt-4" disabled>
            Auf jährlich umstellen (Demo)
          </Button>
        </div>
      </div>
    </div>
  );
}
