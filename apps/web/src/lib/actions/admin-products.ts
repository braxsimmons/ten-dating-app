"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@ten/database";
import { requireAdmin } from "@/lib/auth";
import { ensureProductCatalogSeeded } from "@/lib/products-db";

export async function createProductAction(input: {
  id: string;
  name: string;
  description: string;
  category: "swipes" | "rewinds" | "double-downs" | "reveal";
  priceCents: number;
  extraSwipes?: number;
  rewinds?: number;
  doubleDowns?: number;
  revealNowCredits?: number;
}) {
  const admin = await requireAdmin();
  await ensureProductCatalogSeeded();

  if (!input.id || !/^[a-z0-9_]+$/.test(input.id)) {
    return { ok: false as const, error: "id must be lowercase letters/numbers/underscores" };
  }
  if (input.priceCents < 50) {
    return { ok: false as const, error: "Min price is 50¢ (Stripe minimum)" };
  }

  await prisma.productCatalog.create({
    data: {
      id: input.id,
      name: input.name,
      description: input.description,
      category: input.category,
      priceCents: input.priceCents,
      extraSwipes: input.extraSwipes ?? 0,
      rewinds: input.rewinds ?? 0,
      doubleDowns: input.doubleDowns ?? 0,
      revealNowCredits: input.revealNowCredits ?? 0,
    },
  });
  await prisma.adminAction.create({
    data: { adminUserId: admin.id, action: "product_create", notes: input.id },
  });
  revalidatePath("/admin/products");
  revalidatePath("/app/store");
  return { ok: true as const };
}

export async function updateProductAction(input: {
  id: string;
  name?: string;
  description?: string;
  priceCents?: number;
  extraSwipes?: number;
  rewinds?: number;
  doubleDowns?: number;
  revealNowCredits?: number;
  isActive?: boolean;
  sortOrder?: number;
}) {
  const admin = await requireAdmin();
  const data: Record<string, unknown> = {};
  for (const k of ["name", "description", "priceCents", "extraSwipes", "rewinds", "doubleDowns", "revealNowCredits", "isActive", "sortOrder"] as const) {
    if (input[k] !== undefined) data[k] = input[k];
  }
  if ("priceCents" in data && (data.priceCents as number) < 50) {
    return { ok: false as const, error: "Min price is 50¢" };
  }
  await prisma.productCatalog.update({ where: { id: input.id }, data });
  await prisma.adminAction.create({
    data: { adminUserId: admin.id, action: "product_update", notes: `${input.id}:${JSON.stringify(data)}` },
  });
  revalidatePath("/admin/products");
  revalidatePath("/app/store");
  return { ok: true as const };
}

export async function archiveProductAction(id: string) {
  const admin = await requireAdmin();
  await prisma.productCatalog.update({ where: { id }, data: { isActive: false } });
  await prisma.adminAction.create({
    data: { adminUserId: admin.id, action: "product_archive", notes: id },
  });
  revalidatePath("/admin/products");
  revalidatePath("/app/store");
  return { ok: true as const };
}
