import Link from "next/link";
import { prisma } from "@ten/database";
import { UserRow } from "./UserRow";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";

  const users = await prisma.user.findMany({
    where: q
      ? {
          OR: [
            { email: { contains: q, mode: "insensitive" } },
            { firstName: { contains: q, mode: "insensitive" } },
            { id: q },
          ],
        }
      : {},
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-4">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-2xl sm:text-3xl font-semibold">Users</h1>
          <a href="/api/admin/export/users" className="btn-ghost py-1.5 px-3 text-sm">CSV</a>
        </div>
        <form action="/admin/users" className="flex gap-2">
          <input name="q" defaultValue={q} placeholder="Search email, name..." className="input flex-1 sm:w-72" />
          <button className="btn-primary">Search</button>
        </form>
      </header>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead className="bg-ink-50 text-ink-500 text-xs uppercase tracking-wider">
            <tr>
              <th className="px-4 py-2 text-left">User</th>
              <th className="px-4 py-2 text-left">Role</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Joined</th>
              <th className="px-4 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <UserRow
                key={u.id}
                user={{
                  id: u.id,
                  email: u.email,
                  firstName: u.firstName,
                  role: u.role,
                  isBanned: u.isBanned,
                  isShadowBanned: u.isShadowBanned,
                  createdAt: u.createdAt.toISOString(),
                }}
              />
            ))}
            {users.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-ink-500">No users found.</td></tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
