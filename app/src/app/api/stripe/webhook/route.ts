import { NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/db";
import { CREDIT_PACKAGES_EUR } from "@/lib/billing-prices";

// Stripe-Webhook: die einzige Stelle, die nach Zahlung Abo-Status und Credits
// schreibt. Signaturprüfung ist Pflicht — ohne gültige Signatur passiert nichts.
// Lokal testbar mit: stripe listen --forward-to localhost:3000/api/stripe/webhook

const PLAN_CREDITS: Record<string, number> = { starter: 100, pro: 500, agency: 2000 };

export async function POST(request: Request) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secretKey || !webhookSecret) {
    return NextResponse.json({ error: "Stripe nicht konfiguriert" }, { status: 501 });
  }

  const stripe = new Stripe(secretKey);
  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Signatur fehlt" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(await request.text(), signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Ungültige Signatur" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const workspaceId = session.metadata?.workspaceId;
      if (!workspaceId) break;

      if (session.metadata?.kind === "credits") {
        const pkg = CREDIT_PACKAGES_EUR[session.metadata.pkg ?? ""];
        if (pkg && session.payment_status === "paid") {
          await db.workspace.update({
            where: { id: workspaceId },
            data: {
              creditBalance: { increment: pkg.credits },
              creditTransactions: {
                create: {
                  type: "purchase",
                  amount: pkg.credits,
                  description: `Credit-Paket ${session.metadata.pkg} gekauft`,
                },
              },
            },
          });
        }
      }
      if (session.metadata?.kind === "plan" && session.subscription) {
        await db.workspace.update({
          where: { id: workspaceId },
          data: {
            plan: session.metadata.tier ?? "starter",
            stripeSubscriptionId: String(session.subscription),
            subscriptionStatus: "trialing",
          },
        });
      }
      break;
    }

    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = event.data.object;
      const workspaceId = sub.metadata?.workspaceId;
      if (!workspaceId) break;

      const canceled = event.type === "customer.subscription.deleted" || sub.status === "canceled";
      await db.workspace.update({
        where: { id: workspaceId },
        data: {
          subscriptionStatus: canceled ? "canceled" : sub.status,
          ...(canceled ? { plan: "starter" } : {}),
          currentPeriodEnd: sub.items.data[0]?.current_period_end
            ? new Date(sub.items.data[0].current_period_end * 1000)
            : null,
        },
      });
      break;
    }

    case "invoice.paid": {
      // Abo-Verlängerung: monatliches Kontingent gutschreiben
      const invoice = event.data.object;
      const customerId = typeof invoice.customer === "string" ? invoice.customer : null;
      if (!customerId) break;
      const workspace = await db.workspace.findUnique({
        where: { stripeCustomerId: customerId },
      });
      if (!workspace) break;
      const credits = PLAN_CREDITS[workspace.plan] ?? 0;
      if (credits > 0) {
        await db.workspace.update({
          where: { id: workspace.id },
          data: {
            subscriptionStatus: "active",
            lastGrantAt: new Date(),
            creditBalance: { increment: credits },
            creditTransactions: {
              create: {
                type: "plan_grant",
                amount: credits,
                description: `Monatliches Kontingent (${workspace.plan})`,
              },
            },
          },
        });
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
