"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@ten/database";
import { requireAdmin } from "@/lib/auth";

export async function approvePhotoAction(photoId: string) {
  const admin = await requireAdmin();
  const photo = await prisma.profilePhoto.findUnique({ where: { id: photoId } });
  if (!photo) return { ok: false as const, error: "Not found" };
  await prisma.profilePhoto.update({
    where: { id: photoId },
    data: { moderationStatus: "approved" },
  });
  await prisma.adminAction.create({
    data: { adminUserId: admin.id, targetUserId: photo.userId, action: "approve_photo", notes: photoId },
  });
  revalidatePath("/admin/moderation");
  revalidatePath(`/admin/users/${photo.userId}`);
  return { ok: true as const };
}

export async function rejectPhotoAction(input: { photoId: string; deleteFile?: boolean }) {
  const admin = await requireAdmin();
  const photo = await prisma.profilePhoto.findUnique({ where: { id: input.photoId } });
  if (!photo) return { ok: false as const, error: "Not found" };

  if (input.deleteFile) {
    await prisma.profilePhoto.delete({ where: { id: photo.id } });

    const remaining = await prisma.profilePhoto.findMany({
      where: { userId: photo.userId },
      orderBy: { order: "asc" },
    });
    for (let i = 0; i < remaining.length; i++) {
      await prisma.profilePhoto.update({
        where: { id: remaining[i].id },
        data: { order: i, isPrimary: i === 0 },
      });
    }
  } else {
    await prisma.profilePhoto.update({
      where: { id: photo.id },
      data: { moderationStatus: "rejected" },
    });
  }

  await prisma.adminAction.create({
    data: { adminUserId: admin.id, targetUserId: photo.userId, action: "reject_photo", notes: photo.id },
  });
  revalidatePath("/admin/moderation");
  revalidatePath(`/admin/users/${photo.userId}`);
  return { ok: true as const };
}
