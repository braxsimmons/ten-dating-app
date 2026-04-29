"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@ten/database";
import { messageSchema } from "@ten/shared";
import { requireUser } from "@/lib/auth";

export async function sendMessageAction(input: { matchId: string; body: string }) {
  const user = await requireUser();
  const parsed = messageSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid message" };

  const match = await prisma.match.findUnique({ where: { id: parsed.data.matchId } });
  if (!match) return { ok: false as const, error: "Match not found" };
  if (match.unmatchedAt) return { ok: false as const, error: "This conversation has ended." };
  if (match.userAId !== user.id && match.userBId !== user.id) {
    return { ok: false as const, error: "Forbidden" };
  }

  const otherId = match.userAId === user.id ? match.userBId : match.userAId;
  const blocked = await prisma.block.findFirst({
    where: {
      OR: [
        { blockerId: user.id, blockedUserId: otherId },
        { blockerId: otherId, blockedUserId: user.id },
      ],
    },
  });
  if (blocked) return { ok: false as const, error: "Messaging unavailable." };

  await prisma.message.create({
    data: {
      matchId: match.id,
      senderId: user.id,
      body: parsed.data.body.trim(),
    },
  });

  revalidatePath(`/app/matches/${match.id}`);
  revalidatePath("/app/matches");
  return { ok: true as const };
}

export async function markRead(matchId: string) {
  const user = await requireUser();
  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) return;
  if (match.userAId !== user.id && match.userBId !== user.id) return;

  await prisma.message.updateMany({
    where: { matchId, senderId: { not: user.id }, readAt: null },
    data: { readAt: new Date() },
  });
  revalidatePath(`/app/matches/${matchId}`);
}

export async function unmatchAction(matchId: string) {
  const user = await requireUser();
  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) return { ok: false as const, error: "Not found" };
  if (match.userAId !== user.id && match.userBId !== user.id) {
    return { ok: false as const, error: "Forbidden" };
  }

  await prisma.match.update({
    where: { id: matchId },
    data: { unmatchedAt: new Date(), unmatchedById: user.id },
  });
  revalidatePath("/app/matches");
  return { ok: true as const };
}
