"use server";

import { prisma } from "@ten/database";
import { getProduct as getStaticProduct } from "@ten/shared";
import { requireUser } from "@/lib/auth";
import { getStripe, STRIPE_CONFIGURED } from "@/lib/stripe";
import { getProductFromDb } from "@/lib/products-db";

export async function createCheckoutSession(input: { productId: string }) {
  const user = await requireUser();
  const product = (await getProductFromDb(input.productId)) ?? getStaticProduct(input.productId);
  if (!product) return { ok: false as const, error: "Unknown product" };

  const purchase = await prisma.purchase.create({
    data: {
      userId: user.id,
      provider: STRIPE_CONFIGURED ? "stripe" : "dev",
      productType: product.category,
      productId: product.id,
      amount: product.priceCents,
      currency: product.currency,
      status: "pending",
    },
  });


  if (!STRIPE_CONFIGURED) {
    await fulfillPurchase(purchase.id);
    return { ok: true as const, url: "/app?purchase=success" };
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: user.email,
    line_items: [
      {
        price_data: {
          currency: product.currency,
          unit_amount: product.priceCents,
          product_data: { name: product.name, description: product.description },
        },
        quantity: 1,
      },
    ],
    success_url: `${baseUrl}/app?purchase=success`,
    cancel_url: `${baseUrl}/app?purchase=cancelled`,
    metadata: {
      purchaseId: purchase.id,
      userId: user.id,
      productId: product.id,
    },
  });

  await prisma.purchase.update({
    where: { id: purchase.id },
    data: { providerSessionId: session.id },
  });

  return { ok: true as const, url: session.url ?? "" };
}


export async function fulfillPurchase(purchaseId: string) {
  const purchase = await prisma.purchase.findUnique({ where: { id: purchaseId } });
  if (!purchase) return;
  if (purchase.status === "paid") return;

  const product = (await getProductFromDb(purchase.productId)) ?? getStaticProduct(purchase.productId);
  if (!product) return;

  await prisma.$transaction(async (tx) => {
    await tx.purchase.update({
      where: { id: purchase.id },
      data: { status: "paid" },
    });

    const data: Record<string, { increment: number }> = {};
    for (const [k, v] of Object.entries(product.credits)) {
      if (v) data[k] = { increment: v };
    }

    await tx.creditWallet.upsert({
      where: { userId: purchase.userId },
      create: {
        userId: purchase.userId,
        extraSwipes: product.credits.extraSwipes ?? 0,
        rewinds: product.credits.rewinds ?? 0,
        doubleDowns: product.credits.doubleDowns ?? 0,
        revealNowCredits: product.credits.revealNowCredits ?? 0,
      },
      update: data,
    });

    for (const [k, v] of Object.entries(product.credits)) {
      if (v && v > 0) {
        await tx.creditTransaction.create({
          data: {
            userId: purchase.userId,
            type: k as "extraSwipes" | "rewinds" | "doubleDowns" | "revealNowCredits",
            amount: v,
            source: "purchase",
            purchaseId: purchase.id,
          },
        });
      }
    }
  });
}
