"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@ten/database";
import {
  profileUpdateSchema,
  promptAnswerSchema,
  MIN_PHOTOS,
  MAX_PHOTOS,
  REQUIRED_PROMPT_ANSWERS,
} from "@ten/shared";
import { requireUser } from "@/lib/auth";
import { getStorage } from "@/lib/storage";

const ALLOWED_MIME = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);
const MAX_PHOTO_BYTES = 6 * 1024 * 1024;

export async function updateProfileAction(formData: FormData) {
  const user = await requireUser();

  const raw = {
    bio: formData.get("bio") ? String(formData.get("bio")) : undefined,
    datingIntent: formData.get("datingIntent") || undefined,
    height: formData.get("height") ? Number(formData.get("height")) : undefined,
    education: stringOrNull(formData.get("education")),
    work: stringOrNull(formData.get("work")),
    religion: stringOrNull(formData.get("religion")),
    lifestyle: stringOrNull(formData.get("lifestyle")),
    hiddenTrait: stringOrNull(formData.get("hiddenTrait")),
    locationCity: stringOrNull(formData.get("locationCity")) ?? undefined,
    locationState: stringOrNull(formData.get("locationState")) ?? undefined,
  };

  const parsed = profileUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { locationCity, locationState, ...profileFields } = parsed.data;
  const profileData: Record<string, unknown> = { ...profileFields };

  await prisma.profile.upsert({
    where: { userId: user.id },
    update: profileData,
    create: { userId: user.id, ...profileData },
  });

  if (locationCity !== undefined || locationState !== undefined) {
    await prisma.user.update({
      where: { id: user.id },
      data: { locationCity, locationState },
    });
  }

  await maybeMarkComplete(user.id);
  revalidatePath("/profile");
  return { ok: true };
}

export async function uploadPhotoAction(formData: FormData) {
  const user = await requireUser();

  const file = formData.get("file");
  if (!(file instanceof File)) return { error: "No file uploaded" };
  if (!ALLOWED_MIME.has(file.type)) return { error: "Use JPG, PNG, or WebP" };
  if (file.size > MAX_PHOTO_BYTES) return { error: "Photo must be under 6MB" };

  const existing = await prisma.profilePhoto.count({ where: { userId: user.id } });
  if (existing >= MAX_PHOTOS) return { error: `Max ${MAX_PHOTOS} photos.` };

  const buffer = Buffer.from(await file.arrayBuffer());
  const stored = await getStorage().put({ buffer, mimeType: file.type }, user.id);

  await prisma.profilePhoto.create({
    data: {
      userId: user.id,
      url: stored.url,
      storageKey: stored.storageKey,
      order: existing,
      isPrimary: existing === 0,
      moderationStatus: "pending",
    },
  });

  await maybeMarkComplete(user.id);
  revalidatePath("/profile");
  revalidatePath("/onboarding");
  return { ok: true };
}

export async function deletePhotoAction(photoId: string) {
  const user = await requireUser();
  const photo = await prisma.profilePhoto.findUnique({ where: { id: photoId } });
  if (!photo || photo.userId !== user.id) return { error: "Not found" };

  await prisma.$transaction(async (tx) => {
    await tx.profilePhoto.delete({ where: { id: photoId } });
    const remaining = await tx.profilePhoto.findMany({
      where: { userId: user.id },
      orderBy: { order: "asc" },
    });
    for (let i = 0; i < remaining.length; i++) {
      await tx.profilePhoto.update({
        where: { id: remaining[i].id },
        data: { order: i, isPrimary: i === 0 },
      });
    }
  });

  await maybeMarkComplete(user.id);
  revalidatePath("/profile");
  return { ok: true };
}

export async function reorderPhotosAction(orderedIds: string[]) {
  const user = await requireUser();
  const photos = await prisma.profilePhoto.findMany({ where: { userId: user.id } });
  const validIds = new Set(photos.map((p) => p.id));
  if (orderedIds.some((id) => !validIds.has(id))) return { error: "Invalid order" };

  await prisma.$transaction(
    orderedIds.map((id, i) =>
      prisma.profilePhoto.update({
        where: { id },
        data: { order: i, isPrimary: i === 0 },
      }),
    ),
  );
  revalidatePath("/profile");
  return { ok: true };
}

export async function answerPromptAction(formData: FormData) {
  const user = await requireUser();
  const parsed = promptAnswerSchema.safeParse({
    promptId: formData.get("promptId"),
    answer: formData.get("answer"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid" };

  const prompt = await prisma.prompt.findUnique({ where: { id: parsed.data.promptId } });
  if (!prompt || !prompt.isActive) return { error: "Prompt unavailable" };

  await prisma.promptAnswer.upsert({
    where: { userId_promptId: { userId: user.id, promptId: parsed.data.promptId } },
    update: { answer: parsed.data.answer },
    create: { userId: user.id, promptId: parsed.data.promptId, answer: parsed.data.answer },
  });

  await maybeMarkComplete(user.id);
  revalidatePath("/profile");
  revalidatePath("/onboarding");
  return { ok: true };
}

export async function deletePromptAnswerAction(promptId: string) {
  const user = await requireUser();
  await prisma.promptAnswer.deleteMany({ where: { userId: user.id, promptId } });
  await maybeMarkComplete(user.id);
  revalidatePath("/profile");
  return { ok: true };
}

async function maybeMarkComplete(userId: string) {
  const [photoCount, answerCount, profile] = await Promise.all([
    prisma.profilePhoto.count({ where: { userId } }),
    prisma.promptAnswer.count({ where: { userId } }),
    prisma.profile.findUnique({ where: { userId } }),
  ]);

  const isComplete =
    photoCount >= MIN_PHOTOS &&
    answerCount >= REQUIRED_PROMPT_ANSWERS &&
    !!profile?.bio;

  if (profile && profile.isComplete !== isComplete) {
    await prisma.profile.update({
      where: { userId },
      data: { isComplete },
    });
  }
}

function stringOrNull(v: FormDataEntryValue | null): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s.length === 0 ? null : s;
}
