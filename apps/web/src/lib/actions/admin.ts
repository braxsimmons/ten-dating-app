"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@ten/database";
import type { CreditKind } from "@ten/database";
import { requireAdmin } from "@/lib/auth";

export async function setBanAction(userId: string, isBanned: boolean) {
  const admin = await requireAdmin();
  await prisma.user.update({ where: { id: userId }, data: { isBanned } });
  await prisma.adminAction.create({
    data: {
      adminUserId: admin.id,
      targetUserId: userId,
      action: isBanned ? "ban_user" : "unban_user",
    },
  });
  revalidatePath("/admin/users");
  return { ok: true as const };
}

export async function setShadowBanAction(userId: string, isShadowBanned: boolean) {
  const admin = await requireAdmin();
  await prisma.user.update({ where: { id: userId }, data: { isShadowBanned } });
  await prisma.adminAction.create({
    data: {
      adminUserId: admin.id,
      targetUserId: userId,
      action: isShadowBanned ? "shadow_ban" : "unshadow_ban",
    },
  });
  revalidatePath("/admin/users");
  return { ok: true as const };
}

export async function removePhotoAction(photoId: string) {
  const admin = await requireAdmin();
  const photo = await prisma.profilePhoto.findUnique({ where: { id: photoId } });
  if (!photo) return { ok: false as const, error: "Not found" };
  await prisma.profilePhoto.delete({ where: { id: photoId } });
  await prisma.adminAction.create({
    data: {
      adminUserId: admin.id,
      targetUserId: photo.userId,
      action: "remove_photo",
      notes: photoId,
    },
  });
  revalidatePath(`/admin/users/${photo.userId}`);
  return { ok: true as const };
}

export async function grantCreditsAction(input: {
  userId: string;
  kind: CreditKind;
  amount: number;
  notes?: string;
}) {
  const admin = await requireAdmin();
  if (!Number.isFinite(input.amount) || input.amount === 0) {
    return { ok: false as const, error: "Invalid amount" };
  }
  await prisma.$transaction(async (tx) => {
    await tx.creditWallet.upsert({
      where: { userId: input.userId },
      create: {
        userId: input.userId,
        extraSwipes: input.kind === "extraSwipes" ? input.amount : 0,
        rewinds: input.kind === "rewinds" ? input.amount : 0,
        doubleDowns: input.kind === "doubleDowns" ? input.amount : 0,
        revealNowCredits: input.kind === "revealNowCredits" ? input.amount : 0,
      },
      update: { [input.kind]: { increment: input.amount } },
    });
    await tx.creditTransaction.create({
      data: {
        userId: input.userId,
        type: input.kind,
        amount: input.amount,
        source: "admin_grant",
      },
    });
    await tx.adminAction.create({
      data: {
        adminUserId: admin.id,
        targetUserId: input.userId,
        action: "grant_credit",
        notes: `${input.kind} +${input.amount}${input.notes ? ` — ${input.notes}` : ""}`,
      },
    });
  });
  revalidatePath(`/admin/users/${input.userId}`);
  return { ok: true as const };
}

export async function resolveReportAction(input: {
  reportId: string;
  status: "resolved" | "dismissed";
}) {
  const admin = await requireAdmin();
  await prisma.report.update({
    where: { id: input.reportId },
    data: {
      status: input.status,
      reviewedAt: new Date(),
      reviewedById: admin.id,
    },
  });
  await prisma.adminAction.create({
    data: {
      adminUserId: admin.id,
      action: "resolve_report",
      notes: `${input.reportId}:${input.status}`,
    },
  });
  revalidatePath("/admin/reports");
  return { ok: true as const };
}

export async function setConfigAction(input: { key: string; value: string }) {
  await requireAdmin();
  await prisma.appConfig.upsert({
    where: { key: input.key },
    update: { value: input.value },
    create: { key: input.key, value: input.value },
  });
  revalidatePath("/admin/config");
  return { ok: true as const };
}

export async function setFeatureFlagAction(input: { key: string; value: boolean }) {
  await requireAdmin();
  await prisma.featureFlag.upsert({
    where: { key: input.key },
    update: { value: input.value },
    create: { key: input.key, value: input.value },
  });
  revalidatePath("/admin/config");
  return { ok: true as const };
}
