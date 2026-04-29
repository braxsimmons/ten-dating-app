import { prisma } from "@ten/database";

export const dynamic = "force-dynamic";

export default async function AdminOverview() {
  const [users, banned, matches, openReports, purchases, todayUsage] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isBanned: true } }),
    prisma.match.count({ where: { unmatchedAt: null } }),
    prisma.report.count({ where: { status: "open" } }),
    prisma.purchase.count({ where: { status: "paid" } }),
    prisma.dailySwipeUsage.aggregate({
      _sum: { freeSwipesUsed: true },
      where: { date: new Date().toISOString().slice(0, 10) },
    }),
  ]);

  const stats = [
    ["Users", users],
    ["Banned", banned],
    ["Active matches", matches],
    ["Open reports", openReports],
    ["Paid purchases", purchases],
    ["Swipes today", todayUsage._sum.freeSwipesUsed ?? 0],
  ] as const;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-semibold">Overview</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map(([k, v]) => (
          <div key={k} className="card p-5">
            <div className="text-xs uppercase tracking-wider text-ink-500">{k}</div>
            <div className="font-display text-3xl font-semibold mt-1">{v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
