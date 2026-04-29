"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@ten/database";
import type { Prisma } from "@ten/database";
import { swipeSchema } from "@ten/shared";
import { requireUser } from "@/lib/auth";
import {
  consumeSwipe,
  getSwipeBudget,
  matchPair,
  restoreSwipe,
} from "@/lib/swipe";

export type SwipeResult =
  | { ok: true; matchId?: string }
  | { ok: false; error: string };

export async function swipeAction(input: {
  targetUserId: string;
  action: "like" | "pass";
  isDoubleDown?: boolean;
}): Promise<SwipeResult> {
  const user = await requireUser();
  const parsed = swipeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };

  const { targetUserId, action, isDoubleDown } = parsed.data;
  if (targetUserId === user.id) return { ok: false, error: "You can't swipe on yourself." };


  const target = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { id: true, isBanned: true },
  });
  if (!target || target.isBanned) return { ok: false, error: "Profile unavailable." };


  const blocked = await prisma.block.findFirst({
    where: {
      OR: [
        { blockerId: user.id, blockedUserId: targetUserId },
        { blockerId: targetUserId, blockedUserId: user.id },
      ],
    },
  });
  if (blocked) return { ok: false, error: "Profile unavailable." };

  const existing = await prisma.swipeAction.findUnique({
    where: { swiperId_targetUserId: { swiperId: user.id, targetUserId } },
  });
  if (existing && !existing.isRewound) {
    return { ok: false, error: "Already decided on this profile." };
  }

  let matchId: string | undefined;

  try {
    matchId = await prisma.$transaction(async (tx) => {
      const consumed = await consumeSwipe(tx, user.id);
      if (!consumed) {
        throw new Error("OUT_OF_SWIPES");
      }

      let useDoubleDown = false;
      if (isDoubleDown && action === "like") {
        const wallet = await tx.creditWallet.findUnique({ where: { userId: user.id } });
        if (!wallet || wallet.doubleDowns <= 0) {
          throw new Error("NO_DOUBLE_DOWN");
        }
        await tx.creditWallet.update({
          where: { userId: user.id },
          data: { doubleDowns: { decrement: 1 } },
        });
        await tx.creditTransaction.create({
          data: { userId: user.id, type: "doubleDowns", amount: -1, source: "purchase" },
        });
        useDoubleDown = true;
      }

      if (existing) {
        await tx.swipeAction.update({
          where: { id: existing.id },
          data: {
            action,
            isDoubleDown: useDoubleDown,
            isRewound: false,
            createdAt: new Date(),
          },
        });
      } else {
        await tx.swipeAction.create({
          data: {
            swiperId: user.id,
            targetUserId,
            action,
            isDoubleDown: useDoubleDown,
          },
        });
      }

      if (action !== "like") return undefined;


      const reciprocal = await tx.swipeAction.findUnique({
        where: { swiperId_targetUserId: { swiperId: targetUserId, targetUserId: user.id } },
      });
      if (!reciprocal || reciprocal.action !== "like" || reciprocal.isRewound) {
        return undefined;
      }

      const pair = matchPair(user.id, targetUserId);
      const match = await tx.match.upsert({
        where: { userAId_userBId: pair },
        update: { unmatchedAt: null, unmatchedById: null },
        create: pair,
      });
      return match.id;
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "ERR";
    if (msg === "OUT_OF_SWIPES") return { ok: false, error: "OUT_OF_SWIPES" };
    if (msg === "NO_DOUBLE_DOWN") return { ok: false, error: "NO_DOUBLE_DOWN" };
    console.error("[swipeAction]", e);
    return { ok: false, error: "Something went wrong." };
  }

  revalidatePath("/app");
  if (matchId) revalidatePath("/app/matches");
  return { ok: true, matchId };
}

export async function rewindLastSwipe(): Promise<SwipeResult> {
  const user = await requireUser();
  const wallet = await prisma.creditWallet.findUnique({ where: { userId: user.id } });
  if (!wallet || wallet.rewinds <= 0) {
    return { ok: false, error: "NO_REWINDS" };
  }

  const last = await prisma.swipeAction.findFirst({
    where: { swiperId: user.id, isRewound: false },
    orderBy: { createdAt: "desc" },
  });
  if (!last) return { ok: false, error: "Nothing to rewind." };

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.swipeAction.update({
      where: { id: last.id },
      data: { isRewound: true },
    });

    await tx.creditWallet.update({
      where: { userId: user.id },
      data: { rewinds: { decrement: 1 } },
    });
    await tx.creditTransaction.create({
      data: { userId: user.id, type: "rewinds", amount: -1, source: "purchase" },
    });

    if (last.isDoubleDown) {
      await tx.creditWallet.update({
        where: { userId: user.id },
        data: { doubleDowns: { increment: 1 } },
      });
      await tx.creditTransaction.create({
        data: { userId: user.id, type: "doubleDowns", amount: 1, source: "rewind_restore" },
      });
    }


    await restoreSwipe(tx, user.id);


    if (last.action === "like") {
      const pair = matchPair(user.id, last.targetUserId);
      const match = await tx.match.findUnique({
        where: { userAId_userBId: pair },
      });
      if (match && !match.unmatchedAt) {
        await tx.match.update({
          where: { id: match.id },
          data: { unmatchedAt: new Date(), unmatchedById: user.id },
        });
      }
    }
  });

  revalidatePath("/app");
  revalidatePath("/app/matches");
  return { ok: true };
}

export async function getSwipeStats() {
  const user = await requireUser();
  return getSwipeBudget(user.id);
}
