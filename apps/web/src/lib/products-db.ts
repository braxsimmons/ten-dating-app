import { prisma } from "@ten/database";
import { PRODUCT_LIST as STATIC_PRODUCTS, type Product } from "@ten/shared";

export interface DbProduct extends Product {
  isActive: boolean;
  sortOrder: number;
}

export async function ensureProductCatalogSeeded() {
  const count = await prisma.productCatalog.count();
  if (count > 0) return;
  for (let i = 0; i < STATIC_PRODUCTS.length; i++) {
    const p = STATIC_PRODUCTS[i];
    await prisma.productCatalog.upsert({
      where: { id: p.id },
      update: {},
      create: {
        id: p.id,
        name: p.name,
        description: p.description,
        category: p.category,
        priceCents: p.priceCents,
        currency: p.currency,
        extraSwipes: p.credits.extraSwipes ?? 0,
        rewinds: p.credits.rewinds ?? 0,
        doubleDowns: p.credits.doubleDowns ?? 0,
        revealNowCredits: p.credits.revealNowCredits ?? 0,
        sortOrder: i,
      },
    });
  }
}

export async function getActiveProducts(): Promise<DbProduct[]> {
  await ensureProductCatalogSeeded();
  const rows = await prisma.productCatalog.findMany({
    where: { isActive: true },
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }, { priceCents: "asc" }],
  });
  return rows.map(rowToProduct);
}

export async function getAllProducts(): Promise<DbProduct[]> {
  await ensureProductCatalogSeeded();
  const rows = await prisma.productCatalog.findMany({
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }, { priceCents: "asc" }],
  });
  return rows.map(rowToProduct);
}

export async function getProductFromDb(id: string): Promise<DbProduct | null> {
  await ensureProductCatalogSeeded();
  const row = await prisma.productCatalog.findUnique({ where: { id } });
  return row ? rowToProduct(row) : null;
}

type Row = Awaited<ReturnType<typeof prisma.productCatalog.findUnique>>;

function rowToProduct(row: NonNullable<Row>): DbProduct {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    priceCents: row.priceCents,
    currency: "usd",
    category: row.category as Product["category"],
    credits: {
      extraSwipes: row.extraSwipes || undefined,
      rewinds: row.rewinds || undefined,
      doubleDowns: row.doubleDowns || undefined,
      revealNowCredits: row.revealNowCredits || undefined,
    },
    isActive: row.isActive,
    sortOrder: row.sortOrder,
  };
}
