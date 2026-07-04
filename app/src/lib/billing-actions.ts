"use server";

// Stripe-Billing (Phase 3). Env-gesteuert:
//   STRIPE_SECRET_KEY gesetzt   → echter Stripe Checkout + Customer Portal
//   nicht gesetzt (lokal)       → sauberer Demo-Fallback ohne Zahlung
// Preise stehen NUR hier serverseitig; der Webhook (api/stripe/webhook)
// schreibt Abo-Status und Credits erst nach bestätigter Zahlung.

import Stripe from "stripe";
import { z } from "zod";
import { headers } from "next/headers";
import { db } from "./db";
import { requireWorkspace } from "./auth";
import { buyCreditsAction, setPlanAction, ActionResult } from "./actions";
import { CREDIT_PACKAGES_EUR, PLAN_PRICES_EUR } from "./billing-prices";

function stripeClient(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  return key ? new Stripe(key) : null;
}

async function origin(): Promise<string> {
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

async function ensureCustomer(stripe: Stripe): Promise<{ workspaceId: string; customerId: string }> {
  const { user, workspace } = await requireWorkspace();
  if (workspace.stripeCustomerId) {
    return { workspaceId: workspace.id, customerId: workspace.stripeCustomerId };
  }
  const customer = await stripe.customers.create({
    email: user.email,
    name: workspace.name,
    metadata: { workspaceId: workspace.id },
  });
  await db.workspace.update({
    where: { id: workspace.id },
    data: { stripeCustomerId: customer.id },
  });
  return { workspaceId: workspace.id, customerId: customer.id };
}

export type CheckoutResult = ActionResult & { url?: string };

/** Abo abschließen/wechseln — Stripe Checkout oder Demo-Fallback. */
export async function checkoutPlanAction(tier: unknown): Promise<CheckoutResult> {
  const parsed = z.enum(["starter", "pro", "agency"]).safeParse(tier);
  if (!parsed.success) return { ok: false, error: "Ungültiger Tarif" };

  const stripe = stripeClient();
  if (!stripe) return setPlanAction(parsed.data); // Demo-Fallback ohne Stripe

  const { workspaceId, customerId } = await ensureCustomer(stripe);
  const base = await origin();
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: PLAN_PRICES_EUR[parsed.data] * 100,
          recurring: { interval: "month" },
          product_data: { name: `Planbar ${parsed.data} (monatlich)` },
        },
      },
    ],
    subscription_data: {
      trial_period_days: 14,
      metadata: { workspaceId, tier: parsed.data },
    },
    metadata: { workspaceId, kind: "plan", tier: parsed.data },
    success_url: `${base}/app/billing?checkout=success`,
    cancel_url: `${base}/app/billing?checkout=cancel`,
  });
  return { ok: true, url: session.url ?? undefined };
}

/** Credit-Paket kaufen — Stripe Checkout (Einmalzahlung) oder Demo-Fallback. */
export async function checkoutCreditsAction(pkgId: unknown): Promise<CheckoutResult> {
  const parsed = z.enum(["S", "M", "L"]).safeParse(pkgId);
  if (!parsed.success) return { ok: false, error: "Unbekanntes Paket" };

  const stripe = stripeClient();
  if (!stripe) return buyCreditsAction(parsed.data); // Demo-Fallback ohne Stripe

  const pkg = CREDIT_PACKAGES_EUR[parsed.data];
  const { workspaceId, customerId } = await ensureCustomer(stripe);
  const base = await origin();
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer: customerId,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: pkg.price * 100,
          product_data: { name: `${pkg.credits.toLocaleString("de-DE")} KI-Credits` },
        },
      },
    ],
    metadata: { workspaceId, kind: "credits", pkg: parsed.data },
    success_url: `${base}/app/ai?checkout=success`,
    cancel_url: `${base}/app/ai?checkout=cancel`,
  });
  return { ok: true, url: session.url ?? undefined };
}

/** Stripe Customer Portal (Zahlungsmethode, Rechnungen, Kündigung). */
export async function customerPortalAction(): Promise<CheckoutResult> {
  const stripe = stripeClient();
  if (!stripe) {
    return {
      ok: false,
      error: "Stripe ist lokal nicht konfiguriert (STRIPE_SECRET_KEY in .env setzen).",
    };
  }
  const { customerId } = await ensureCustomer(stripe);
  const base = await origin();
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${base}/app/billing`,
  });
  return { ok: true, url: session.url };
}
