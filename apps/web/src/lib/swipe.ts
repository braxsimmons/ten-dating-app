import { prisma } from "@ten/database";
import type { Prisma, User } from "@ten/database";
import { DEFAULT_DAILY_SWIPE_LIMIT } from "@ten/shared";

export function todayKey(date = new Date()): string {

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export async function getDailyLimit(): Promise<number> {
  const cfg = await prisma.appConfig.findUnique({ where: { key: "daily_free_swipe_limit" } });
  const v = cfg ? parseInt(cfg.value, 10) : DEFAULT_DAILY_SWIPE_LIMIT;
  return Number.isFinite(v) && v > 0 ? v : DEFAULT_DAILY_SWIPE_LIMIT;
}

export interface SwipeBudget {
  freeRemaining: number;
  freeLimit: number;
  freeUsed: number;
  extraSwipes: number;
  totalRemaining: number;
}

export async function getSwipeBudget(userId: string): Promise<SwipeBudget> {
  const [limit, usage, wallet] = await Promise.all([
    getDailyLimit(),
    prisma.dailySwipeUsage.findUnique({
      where: { userId_date: { userId, date: todayKey() } },
    }),
    prisma.creditWallet.findUnique({ where: { userId } }),
  ]);

  const freeUsed = usage?.freeSwipesUsed ?? 0;
  const freeRemaining = Math.max(0, limit - freeUsed);
  const extraSwipes = wallet?.extraSwipes ?? 0;

  return {
    freeRemaining,
    freeLimit: limit,
    freeUsed,
    extraSwipes,
    totalRemaining: freeRemaining + extraSwipes,
  };
}


export async function consumeSwipe(
  tx: Prisma.TransactionClient,
  userId: string,
): Promise<{ source: "free" | "extra" } | null> {
  const limit = await getDailyLimitTx(tx);
  const date = todayKey();


  const usage = await tx.dailySwipeUsage.upsert({
    where: { userId_date: { userId, date } },
    create: { userId, date, freeSwipesUsed: 0 },
    update: {},
  });

  if (usage.freeSwipesUsed < limit) {
    await tx.dailySwipeUsage.update({
      where: { id: usage.id },
      data: { freeSwipesUsed: { increment: 1 } },
    });
    return { source: "free" };
  }


  const wallet = await tx.creditWallet.findUnique({ where: { userId } });
  if (!wallet || wallet.extraSwipes <= 0) return null;

  await tx.creditWallet.update({
    where: { userId },
    data: { extraSwipes: { decrement: 1 } },
  });
  await tx.creditTransaction.create({
    data: {
      userId,
      type: "extraSwipes",
      amount: -1,
      source: "purchase",
    },
  });
  return { source: "extra" };
}

async function getDailyLimitTx(tx: Prisma.TransactionClient): Promise<number> {
  const cfg = await tx.appConfig.findUnique({ where: { key: "daily_free_swipe_limit" } });
  const v = cfg ? parseInt(cfg.value, 10) : DEFAULT_DAILY_SWIPE_LIMIT;
  return Number.isFinite(v) && v > 0 ? v : DEFAULT_DAILY_SWIPE_LIMIT;
}


export async function restoreSwipe(
  tx: Prisma.TransactionClient,
  userId: string,
): Promise<void> {
  const date = todayKey();
  const usage = await tx.dailySwipeUsage.findUnique({
    where: { userId_date: { userId, date } },
  });
  if (usage && usage.freeSwipesUsed > 0) {
    await tx.dailySwipeUsage.update({
      where: { id: usage.id },
      data: { freeSwipesUsed: { decrement: 1 } },
    });
    return;
  }

  await tx.creditWallet.upsert({
    where: { userId },
    create: { userId, extraSwipes: 1 },
    update: { extraSwipes: { increment: 1 } },
  });
  await tx.creditTransaction.create({
    data: { userId, type: "extraSwipes", amount: 1, source: "rewind_restore" },
  });
}


export function interestMatches(
  viewer: Pick<User, "interestedIn" | "gender">,
  candidate: Pick<User, "interestedIn" | "gender">,
): boolean {
  const viewerWants = (g: string) => {
    if (viewer.interestedIn === "everyone") return true;
    if (viewer.interestedIn === "women") return g === "woman";
    if (viewer.interestedIn === "men") return g === "man";
    return true;
  };
  const candidateWants = (g: string) => {
    if (candidate.interestedIn === "everyone") return true;
    if (candidate.interestedIn === "women") return g === "woman";
    if (candidate.interestedIn === "men") return g === "man";
    return true;
  };
  return viewerWants(candidate.gender) && candidateWants(viewer.gender);
}


export function matchPair(a: string, b: string): { userAId: string; userBId: string } {
  return a < b ? { userAId: a, userBId: b } : { userAId: b, userBId: a };
}
