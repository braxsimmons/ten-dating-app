"use server";

import { redirect } from "next/navigation";
import { prisma } from "@ten/database";
import { requireAdmin, startImpersonation, stopImpersonation } from "@/lib/auth";

export async function startImpersonationAction(targetUserId: string) {
  const admin = await requireAdmin();
  if (targetUserId === admin.id) return { ok: false as const, error: "Pick a different user." };
  const target = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!target) return { ok: false as const, error: "Not found" };
  if (target.role === "admin") return { ok: false as const, error: "Cannot impersonate admins." };

  await startImpersonation(target.id);
  await prisma.adminAction.create({
    data: { adminUserId: admin.id, targetUserId: target.id, action: "impersonate_start" },
  });
  redirect("/app");
}

export async function stopImpersonationAction() {
  const admin = await requireAdmin();
  await stopImpersonation();
  await prisma.adminAction.create({
    data: { adminUserId: admin.id, action: "impersonate_stop" },
  });
  redirect("/admin");
}
