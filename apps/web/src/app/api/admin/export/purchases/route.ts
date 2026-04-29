import { prisma } from "@ten/database";
import { requireAdmin } from "@/lib/auth";
import { csvResponse, toCsv } from "@/lib/csv";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await requireAdmin();
  const purchases = await prisma.purchase.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: { select: { id: true, email: true, firstName: true } } },
  });

  const rows = purchases.map((p) => ({
    id: p.id,
    userId: p.user.id,
    userEmail: p.user.email,
    userFirstName: p.user.firstName,
    productId: p.productId,
    productType: p.productType,
    provider: p.provider,
    amountCents: p.amount,
    amountUSD: (p.amount / 100).toFixed(2),
    currency: p.currency,
    status: p.status,
    providerSessionId: p.providerSessionId ?? "",
    refundedAt: p.refundedAt,
    refundedById: p.refundedById ?? "",
    createdAt: p.createdAt,
  }));

  await prisma.adminAction.create({
    data: { adminUserId: admin.id, action: "export_data", notes: `purchases (${rows.length})` },
  });

  return csvResponse(`ten-purchases-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(rows));
}
