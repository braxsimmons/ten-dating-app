import { prisma } from "@ten/database";
import { requireAdmin } from "@/lib/auth";
import { csvResponse, toCsv } from "@/lib/csv";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await requireAdmin();
  const reports = await prisma.report.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      reporter: { select: { id: true, email: true, firstName: true } },
      reportedUser: { select: { id: true, email: true, firstName: true, isBanned: true } },
      reviewedBy: { select: { id: true, email: true } },
    },
  });

  const rows = reports.map((r) => ({
    id: r.id,
    reason: r.reason,
    description: r.description ?? "",
    status: r.status,
    reporterId: r.reporter.id,
    reporterEmail: r.reporter.email,
    reportedUserId: r.reportedUser.id,
    reportedUserEmail: r.reportedUser.email,
    reportedUserFirstName: r.reportedUser.firstName,
    reportedUserBanned: r.reportedUser.isBanned,
    reviewedById: r.reviewedBy?.id ?? "",
    reviewedByEmail: r.reviewedBy?.email ?? "",
    createdAt: r.createdAt,
    reviewedAt: r.reviewedAt,
  }));

  await prisma.adminAction.create({
    data: { adminUserId: admin.id, action: "export_data", notes: `reports (${rows.length})` },
  });

  return csvResponse(`ten-reports-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(rows));
}
