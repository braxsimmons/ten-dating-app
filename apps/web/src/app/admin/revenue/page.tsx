import Link from "next/link";
import { prisma } from "@ten/database";
import { RefundButton } from "./RefundButton";

export const dynamic = "force-dynamic";

export default async function AdminRevenuePage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const sp = await searchParams;
  const windowDays = Math.max(1, Math.min(365, parseInt(sp.days ?? "30", 10) || 30));
  const since = new Date(Date.now() - windowDays * 24 * 3600 * 1000);

  const [paid, refunded, byDay, byProduct, recent] = await Promise.all([
    prisma.purchase.aggregate({
      where: { status: "paid", createdAt: { gte: since } },
      _sum: { amount: true },
      _count: { _all: true },
    }),
    prisma.purchase.aggregate({
      where: { status: "refunded", refundedAt: { gte: since } },
      _sum: { amount: true },
      _count: { _all: true },
    }),
    prisma.purchase.findMany({
      where: { status: "paid", createdAt: { gte: since } },
      select: { createdAt: true, amount: true },
    }),
    prisma.purchase.groupBy({
      by: ["productId"],
      where: { status: "paid", createdAt: { gte: since } },
      _sum: { amount: true },
      _count: { _all: true },
      orderBy: { _sum: { amount: "desc" } },
      take: 20,
    }),
    prisma.purchase.findMany({
      where: { createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { user: { select: { id: true, email: true, firstName: true } } },
    }),
  ]);

  const grossCents = paid._sum.amount ?? 0;
  const refundedCents = refunded._sum.amount ?? 0;
  const netCents = grossCents - refundedCents;
  const aovCents = paid._count._all ? Math.round(grossCents / paid._count._all) : 0;


  const dayBuckets = bucketByDay(byDay, windowDays);
  const maxBucket = Math.max(1, ...dayBuckets.map((b) => b.amount));


  const productMaxCents = Math.max(1, ...byProduct.map((b) => b._sum.amount ?? 0));

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold">Revenue</h1>
          <p className="text-ink-500">Last {windowDays} days · billed in USD.</p>
        </div>
        <nav className="flex gap-1">
          {[7, 30, 90, 365].map((d) => (
            <Link
              key={d}
              href={`/admin/revenue?days=${d}`}
              className={`btn-ghost py-1.5 px-3 ${d === windowDays ? "bg-ink text-white" : ""}`}
            >
              {d}d
            </Link>
          ))}
        </nav>
      </header>

      <section className="grid gap-3 grid-cols-2 md:grid-cols-4">
        <Stat label="Gross revenue" value={`$${(grossCents / 100).toFixed(2)}`} />
        <Stat label="Refunded" value={`-$${(refundedCents / 100).toFixed(2)}`} />
        <Stat label="Net revenue" value={`$${(netCents / 100).toFixed(2)}`} highlight />
        <Stat label="Avg order" value={`$${(aovCents / 100).toFixed(2)}`} />
        <Stat label="Paid orders" value={String(paid._count._all)} />
        <Stat label="Refunded orders" value={String(refunded._count._all)} />
        <Stat label="Refund rate" value={paid._count._all ? `${Math.round((refunded._count._all / paid._count._all) * 100)}%` : "—"} />
        <Stat label="Window" value={`${windowDays}d`} />
      </section>

      <section className="card p-5">
        <p className="font-display text-lg font-semibold">Daily revenue</p>
        <div className="mt-4 flex items-end gap-1 h-40">
          {dayBuckets.map((b) => (
            <div key={b.date} className="flex-1 flex flex-col items-stretch justify-end" title={`${b.date}: $${(b.amount / 100).toFixed(2)}`}>
              <div
                className="bg-ember rounded-t"
                style={{ height: `${(b.amount / maxBucket) * 100}%`, minHeight: b.amount > 0 ? "2px" : "0" }}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xs text-ink-500 mt-2">
          <span>{dayBuckets[0]?.date}</span>
          <span>{dayBuckets[dayBuckets.length - 1]?.date}</span>
        </div>
      </section>

      <section className="card p-5">
        <p className="font-display text-lg font-semibold">By product</p>
        <div className="mt-3 space-y-2">
          {byProduct.length === 0 ? (
            <p className="text-sm text-ink-500">No paid purchases yet in this window.</p>
          ) : (
            byProduct.map((b) => {
              const cents = b._sum.amount ?? 0;
              return (
                <div key={b.productId}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{b.productId}</span>
                    <span className="text-ink-500">{b._count._all} sold · ${(cents / 100).toFixed(2)}</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-ink-100 overflow-hidden">
                    <div className="h-full bg-ember" style={{ width: `${(cents / productMaxCents) * 100}%` }} />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      <section className="card overflow-x-auto">
        <header className="px-5 py-3 border-b border-ink-100 flex items-center justify-between">
          <p className="font-display text-lg font-semibold">Recent purchases</p>
          <a href="/api/admin/export/purchases" className="btn-ghost py-1.5 px-3 text-sm">Download CSV</a>
        </header>
        <table className="w-full text-sm min-w-[760px]">
          <thead className="text-xs uppercase tracking-wider text-ink-500 bg-ink-50">
            <tr>
              <th className="px-4 py-2 text-left">Date</th>
              <th className="px-4 py-2 text-left">User</th>
              <th className="px-4 py-2 text-left">Product</th>
              <th className="px-4 py-2 text-right">Amount</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {recent.map((p) => (
              <tr key={p.id} className="border-t border-ink-100">
                <td className="px-4 py-3 text-ink-500 text-xs">{p.createdAt.toLocaleString()}</td>
                <td className="px-4 py-3">
                  <Link href={`/admin/users/${p.user.id}`} className="hover:underline">{p.user.firstName}</Link>
                  <div className="text-xs text-ink-500">{p.user.email}</div>
                </td>
                <td className="px-4 py-3">{p.productId}</td>
                <td className="px-4 py-3 text-right">${(p.amount / 100).toFixed(2)}</td>
                <td className="px-4 py-3">
                  <span className={statusClass(p.status)}>{p.status}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  {p.status === "paid" ? <RefundButton purchaseId={p.id} /> : null}
                </td>
              </tr>
            ))}
            {recent.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-ink-500">No purchases in window.</td></tr>
            ) : null}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`card p-4 ${highlight ? "border-ember" : ""}`}>
      <div className="text-xs uppercase tracking-wider text-ink-500">{label}</div>
      <div className={`font-display text-2xl font-semibold mt-1 ${highlight ? "text-ember" : ""}`}>{value}</div>
    </div>
  );
}

function bucketByDay(rows: { createdAt: Date; amount: number }[], windowDays: number) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const buckets: { date: string; amount: number }[] = [];
  for (let i = windowDays - 1; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 24 * 3600 * 1000);
    buckets.push({ date: keyOf(d), amount: 0 });
  }
  const idx = new Map(buckets.map((b, i) => [b.date, i]));
  for (const r of rows) {
    const k = keyOf(r.createdAt);
    const i = idx.get(k);
    if (i !== undefined) buckets[i].amount += r.amount;
  }
  return buckets;
}

function keyOf(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function statusClass(s: string): string {
  switch (s) {
    case "paid": return "pill bg-emerald-100 text-emerald-700";
    case "refunded": return "pill bg-yellow-100 text-yellow-700";
    case "failed": return "pill bg-red-100 text-red-700";
    case "pending": return "pill bg-blue-100 text-blue-700";
    default: return "pill";
  }
}
