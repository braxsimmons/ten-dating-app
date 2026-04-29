"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@ten/database";
import { requireAdmin } from "@/lib/auth";

export async function createPromptAction(text: string) {
  const admin = await requireAdmin();
  const t = text.trim();
  if (t.length < 4 || t.length > 140) return { ok: false as const, error: "Prompt must be 4-140 chars." };
  const existing = await prisma.prompt.findUnique({ where: { text: t } });
  if (existing) return { ok: false as const, error: "Already exists." };
  const p = await prisma.prompt.create({ data: { text: t } });
  await prisma.adminAction.create({
    data: { adminUserId: admin.id, action: "prompt_create", notes: p.id },
  });
  revalidatePath("/admin/prompts");
  return { ok: true as const };
}

export async function updatePromptAction(input: { id: string; text?: string; isActive?: boolean }) {
  const admin = await requireAdmin();
  const data: Record<string, unknown> = {};
  if (input.text !== undefined) data.text = input.text.trim();
  if (input.isActive !== undefined) data.isActive = input.isActive;
  await prisma.prompt.update({ where: { id: input.id }, data });
  await prisma.adminAction.create({
    data: { adminUserId: admin.id, action: input.isActive === false ? "prompt_archive" : "prompt_update", notes: input.id },
  });
  revalidatePath("/admin/prompts");
  return { ok: true as const };
}
