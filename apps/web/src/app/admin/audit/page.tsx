import Link from "next/link";
import { prisma } from "@ten/database";

export const dynamic = "force-dynamic";

const LIMIT = 200;

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ admin?: string; user?: string; action?: string }>;
}) {
  const sp = await searchParams;
  const where: Record<string, unknown> = {};
  if (sp.admin) where.adminUserId = sp.admin;
  if (sp.user) where.targetUserId = sp.user;
  if (sp.action) where.action = sp.action;

  const [actions, admins, types] = await Promise.all([
    prisma.adminAction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: LIMIT,
      include: {
        adminUser: { select: { id: true, email: true, firstName: true } },
        targetUser: { select: { id: true, email: true, firstName: true } },
      },
    }),
    prisma.user.findMany({ where: { role: "admin" }, select: { id: true, firstName: true, email: true } }),
    prisma.adminAction.groupBy({ by: ["action"], _count: { _all: true }, orderBy: { _count: { id: "desc" } } }),
  ]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold">Audit log</h1>
          <p className="text-ink-500">Last {LIMIT} actions taken by admins. Append-only.</p>
        </div>
        <a href="/api/admin/export/audit" className="btn-ghost py-1.5 px-3">Download CSV</a>
      </header>

      <form action="/admin/audit" className="card p-4 grid gap-3 sm:grid-cols-3">
        <select name="admin" defaultValue={sp.admin ?? ""} className="input">
          <option value="">All admins</option>
          {admins.map((a) => (
            <option key={a.id} value={a.id}>{a.firstName} ({a.email})</option>
          ))}
        </select>
        <select name="action" defaultValue={sp.action ?? ""} className="input">
          <option value="">All actions</option>
          {types.map((t) => (
            <option key={t.action} value={t.action}>{t.action} ({t._count._all})</option>
          ))}
        </select>
        <div className="flex gap-2">
          <input name="user" defaultValue={sp.user ?? ""} placeholder="Target user id" className="input flex-1" />
          <button className="btn-primary">Filter</button>
        </div>
      </form>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm min-w-[760px]">
          <thead className="text-xs uppercase tracking-wider text-ink-500 bg-ink-50">
            <tr>
              <th className="px-4 py-2 text-left">When</th>
              <th className="px-4 py-2 text-left">Admin</th>
              <th className="px-4 py-2 text-left">Action</th>
              <th className="px-4 py-2 text-left">Target</th>
              <th className="px-4 py-2 text-left">Notes</th>
            </tr>
          </thead>
          <tbody>
            {actions.map((a) => (
              <tr key={a.id} className="border-t border-ink-100 align-top">
                <td className="px-4 py-3 text-xs text-ink-500 whitespace-nowrap">
                  {a.createdAt.toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium">{a.adminUser.firstName}</div>
                  <div className="text-xs text-ink-500">{a.adminUser.email}</div>
                </td>
                <td className="px-4 py-3">
                  <span className="pill bg-ink-100">{a.action}</span>
                </td>
                <td className="px-4 py-3">
                  {a.targetUser ? (
                    <Link href={`/admin/users/${a.targetUser.id}`} className="hover:underline">
                      {a.targetUser.firstName}
                    </Link>
                  ) : <span className="text-ink-400">—</span>}
                </td>
                <td className="px-4 py-3 text-xs text-ink-500 break-all">{a.notes ?? ""}</td>
              </tr>
            ))}
            {actions.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-ink-500">No actions match.</td></tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
