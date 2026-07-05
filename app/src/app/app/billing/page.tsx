"use client";

import { useStore } from "@/lib/store";
import { Button } from "@/components/ui";

const STATUS_LABELS: Record<string, string> = {
  trialing: "Testphase",
  active: "Aktiv",
  past_due: "Zahlung überfällig",
  canceled: "Gekündigt",
};

const PRICE = 79;

const FEATURES = [
  "Unbegrenzte Kunden",
  "Unbegrenzte Social Accounts",
  "Unbegrenzter Planungshorizont",
  "Alle Formate (Text, Bild, Video, Karussell, Story)",
  "Kalender & Kanban-Board",
  "Team & Rollen (Redakteur:in, Admin …)",
  "Freigabe-Workflow + Kunden-Freigabelinks",
  "Inbox (Kommentare beantworten)",
  "Analytics & Reporting",
  "KI für Texte & Bilder inklusive",
];

export default function BillingPage() {
  const { billing, openCustomerPortal, checkoutPlan } = useStore();
  const active = billing.subscriptionStatus === "active" || billing.subscriptionStatus === "trialing";

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Abo & Zahlung</h1>
        <p className="mt-1 text-sm text-muted">
          Ein Plan, alles drin. Keine Staffelung, keine Limits.
        </p>
      </div>

      <div className="rounded-2xl border border-accent bg-surface p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Komplett</h2>
            <p className="mt-1 text-sm text-muted">Alles, was eine Social-Media-Agentur braucht.</p>
          </div>
          {active && (
            <span className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-contrast">
              Aktiv
            </span>
          )}
        </div>

        <div className="mt-5">
          <span className="text-4xl font-semibold">{PRICE} €</span>
          <span className="text-sm text-muted"> / Monat · monatlich kündbar</span>
        </div>

        <ul className="mt-6 grid gap-2 text-sm sm:grid-cols-2">
          {FEATURES.map((f) => (
            <li key={f} className="flex gap-2">
              <span className="text-success">✓</span>
              <span className="text-muted">{f}</span>
            </li>
          ))}
        </ul>

        <div className="mt-7">
          {active ? (
            <Button variant="ghost" disabled className="w-full sm:w-auto">
              Dein aktiver Plan
            </Button>
          ) : (
            <Button className="w-full sm:w-auto" onClick={() => checkoutPlan("agency")}>
              {billing.stripeConfigured ? "Jetzt abonnieren" : "Abonnieren (Demo)"}
            </Button>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-line bg-surface p-6">
        <h3 className="font-semibold">Zahlungsmethode & Rechnungen</h3>
        {billing.subscriptionStatus && (
          <p className="mt-2 text-sm">
            Abo-Status:{" "}
            <span className="font-medium text-accent-fg">
              {STATUS_LABELS[billing.subscriptionStatus] ?? billing.subscriptionStatus}
            </span>
            {billing.currentPeriodEnd && (
              <span className="text-muted"> · verlängert sich am {billing.currentPeriodEnd}</span>
            )}
          </p>
        )}
        <p className="mt-2 text-sm text-muted">
          {billing.stripeConfigured
            ? "Zahlungsmethode ändern, Rechnungen herunterladen, Abo kündigen — alles Self-Service im Stripe-Kundenportal."
            : "Stripe ist lokal noch nicht konfiguriert — mit STRIPE_SECRET_KEY in der .env läuft der Checkout über echten Stripe (14 Tage Trial inklusive). Ohne Key gilt der Demo-Modus."}
        </p>
        <Button
          variant="ghost"
          className="mt-4"
          disabled={!billing.stripeConfigured}
          onClick={openCustomerPortal}
        >
          Stripe-Kundenportal öffnen
        </Button>
      </div>
    </div>
  );
}
