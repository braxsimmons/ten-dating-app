import { prisma } from "@ten/database";
import { requireAdmin } from "@/lib/auth";
import { csvResponse, toCsv } from "@/lib/csv";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await requireAdmin();
  const actions = await prisma.adminAction.findMany({
    orderBy: { createdAt: "desc" },
    take: 5000,
    include: {
      adminUser: { select: { id: true, email: true, firstName: true } },
      targetUser: { select: { id: true, email: true, firstName: true } },
    },
  });

  const rows = actions.map((a) => ({
    id: a.id,
    adminId: a.adminUser.id,
    adminEmail: a.adminUser.email,
    adminFirstName: a.adminUser.firstName,
    action: a.action,
    targetUserId: a.targetUser?.id ?? "",
    targetUserEmail: a.targetUser?.email ?? "",
    notes: a.notes ?? "",
    createdAt: a.createdAt,
  }));

  await prisma.adminAction.create({
    data: { adminUserId: admin.id, action: "export_data", notes: `audit (${rows.length})` },
  });

  return csvResponse(`ten-audit-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(rows));
}
