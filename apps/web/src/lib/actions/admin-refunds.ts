"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@ten/database";
import { requireAdmin } from "@/lib/auth";
import { getStripe, STRIPE_CONFIGURED } from "@/lib/stripe";

export async function refundPurchaseAction(input: {
  purchaseId: string;
  reason?: string;
  clawback: boolean;
}) {
  const admin = await requireAdmin();
  const purchase = await prisma.purchase.findUnique({ where: { id: input.purchaseId } });
  if (!purchase) return { ok: false as const, error: "Not found" };
  if (purchase.status !== "paid") return { ok: false as const, error: "Only paid purchases can be refunded." };


  if (STRIPE_CONFIGURED && purchase.provider === "stripe" && purchase.providerSessionId) {
    try {
      const stripe = getStripe();
      const session = await stripe.checkout.sessions.retrieve(purchase.providerSessionId);
      const paymentIntentId = typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id;
      if (paymentIntentId) {
        await stripe.refunds.create({ payment_intent: paymentIntentId });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Stripe error";
      return { ok: false as const, error: `Stripe refund failed: ${msg}` };
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.purchase.update({
      where: { id: purchase.id },
      data: { status: "refunded", refundedAt: new Date(), refundedById: admin.id },
    });

    if (input.clawback) {

      const txns = await tx.creditTransaction.findMany({
        where: { purchaseId: purchase.id, amount: { gt: 0 } },
      });
      const wallet = await tx.creditWallet.findUnique({ where: { userId: purchase.userId } });
      if (wallet) {
        const updates: Record<string, { decrement: number }> = {};
        for (const t of txns) {

          const current = (wallet[t.type] as number) ?? 0;
          const dec = Math.min(current, t.amount);
          if (dec > 0) {
            updates[t.type] = { decrement: dec };
            await tx.creditTransaction.create({
              data: { userId: purchase.userId, type: t.type, amount: -dec, source: "refund", purchaseId: purchase.id },
            });
          }
        }
        if (Object.keys(updates).length) {
          await tx.creditWallet.update({ where: { userId: purchase.userId }, data: updates });
        }
      }
    }

    await tx.adminAction.create({
      data: {
        adminUserId: admin.id,
        targetUserId: purchase.userId,
        action: "refund_purchase",
        notes: `${purchase.id} ($${(purchase.amount / 100).toFixed(2)}) clawback=${input.clawback}${input.reason ? " — " + input.reason : ""}`,
      },
    });
  });

  revalidatePath("/admin/revenue");
  revalidatePath(`/admin/users/${purchase.userId}`);
  return { ok: true as const };
}
