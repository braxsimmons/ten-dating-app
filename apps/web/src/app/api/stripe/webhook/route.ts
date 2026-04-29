import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@ten/database";
import { getStripe } from "@/lib/stripe";
import { fulfillPurchase } from "@/lib/actions/purchases";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !secret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 400 });
  }

  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, secret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    return NextResponse.json({ error: `Invalid signature: ${msg}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const purchaseId = session.metadata?.purchaseId;
        if (purchaseId) {
          await fulfillPurchase(purchaseId);
        }
        break;
      }
      case "checkout.session.expired":
      case "checkout.session.async_payment_failed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const purchaseId = session.metadata?.purchaseId;
        if (purchaseId) {
          await prisma.purchase.update({
            where: { id: purchaseId },
            data: { status: "failed" },
          });
        }
        break;
      }
    }
  } catch (err) {
    console.error("[stripe webhook]", err);
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
