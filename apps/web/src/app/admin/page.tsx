import Link from "next/link";
import { prisma } from "@ten/database";

export const dynamic = "force-dynamic";

export default async function AdminOverview() {
  const [
    users, banned, matches, openReports, paidPurchases, refundedPurchases,
    todayUsage, pendingPhotos, paidSum, refundedSum,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isBanned: true } }),
    prisma.match.count({ where: { unmatchedAt: null } }),
    prisma.report.count({ where: { status: "open" } }),
    prisma.purchase.count({ where: { status: "paid" } }),
    prisma.purchase.count({ where: { status: "refunded" } }),
    prisma.dailySwipeUsage.aggregate({
      _sum: { freeSwipesUsed: true },
      where: { date: new Date().toISOString().slice(0, 10) },
    }),
    prisma.profilePhoto.count({ where: { moderationStatus: "pending" } }),
    prisma.purchase.aggregate({ _sum: { amount: true }, where: { status: "paid" } }),
    prisma.purchase.aggregate({ _sum: { amount: true }, where: { status: "refunded" } }),
  ]);

  const grossCents = paidSum._sum.amount ?? 0;
  const refundedCents = refundedSum._sum.amount ?? 0;
  const netUSD = `$${((grossCents - refundedCents) / 100).toFixed(2)}`;

  const tiles: Array<[string, string | number, string]> = [
    ["Users", users, "/admin/users"],
    ["Banned", banned, "/admin/users"],
    ["Active matches", matches, "/admin/users"],
    ["Open reports", openReports, "/admin/reports"],
    ["Pending photos", pendingPhotos, "/admin/moderation"],
    ["Net revenue", netUSD, "/admin/revenue"],
    ["Paid purchases", paidPurchases, "/admin/revenue"],
    ["Refunded", refundedPurchases, "/admin/revenue"],
    ["Swipes today", todayUsage._sum.freeSwipesUsed ?? 0, "/admin/users"],
  ];

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-semibold">Overview</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        {tiles.map(([k, v, href]) => (
          <Link key={k} href={href} className="card p-5 hover:border-ember transition">
            <div className="text-xs uppercase tracking-wider text-ink-500">{k}</div>
            <div className="font-display text-3xl font-semibold mt-1">{v}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
