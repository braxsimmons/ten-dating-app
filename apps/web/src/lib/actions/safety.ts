"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@ten/database";
import { reportSchema } from "@ten/shared";
import { requireUser } from "@/lib/auth";

export async function reportUserAction(input: {
  reportedUserId: string;
  reason: string;
  description?: string;
}) {
  const user = await requireUser();
  const parsed = reportSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid report" };
  if (parsed.data.reportedUserId === user.id) return { ok: false as const, error: "Can't report yourself." };

  await prisma.report.create({
    data: {
      reporterId: user.id,
      reportedUserId: parsed.data.reportedUserId,
      reason: parsed.data.reason,
      description: parsed.data.description ?? null,
    },
  });
  return { ok: true as const };
}

export async function blockUserAction(blockedUserId: string) {
  const user = await requireUser();
  if (blockedUserId === user.id) return { ok: false as const, error: "Can't block yourself." };

  await prisma.block.upsert({
    where: { blockerId_blockedUserId: { blockerId: user.id, blockedUserId } },
    update: {},
    create: { blockerId: user.id, blockedUserId },
  });

  const pair =
    user.id < blockedUserId
      ? { userAId: user.id, userBId: blockedUserId }
      : { userAId: blockedUserId, userBId: user.id };
  const match = await prisma.match.findUnique({ where: { userAId_userBId: pair } });
  if (match && !match.unmatchedAt) {
    await prisma.match.update({
      where: { id: match.id },
      data: { unmatchedAt: new Date(), unmatchedById: user.id },
    });
  }

  revalidatePath("/app");
  revalidatePath("/app/matches");
  return { ok: true as const };
}
