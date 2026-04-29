import Link from "next/link";
import { prisma } from "@ten/database";
import { ReportControls } from "./ReportControls";

export const dynamic = "force-dynamic";

export default async function AdminReportsPage() {
  const reports = await prisma.report.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: {
      reporter: { select: { id: true, firstName: true, email: true } },
      reportedUser: { select: { id: true, firstName: true, email: true, isBanned: true } },
    },
    take: 100,
  });

  return (
    <div className="space-y-4">
      <header className="flex items-center gap-3">
        <h1 className="font-display text-3xl font-semibold">Reports</h1>
        <a href="/api/admin/export/reports" className="btn-ghost py-1.5 px-3 text-sm">CSV</a>
      </header>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm min-w-[760px]">
          <thead className="bg-ink-50 text-ink-500 text-xs uppercase tracking-wider">
            <tr>
              <th className="px-4 py-2 text-left">Reason</th>
              <th className="px-4 py-2 text-left">Reporter</th>
              <th className="px-4 py-2 text-left">Reported</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Date</th>
              <th className="px-4 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((r) => (
              <tr key={r.id} className="border-t border-ink-100 align-top">
                <td className="px-4 py-3">
                  <p className="font-medium capitalize">{r.reason.replace(/-/g, " ")}</p>
                  {r.description ? <p className="mt-1 text-xs text-ink-500">{r.description}</p> : null}
                </td>
                <td className="px-4 py-3 text-ink-600">{r.reporter.firstName}</td>
                <td className="px-4 py-3">
                  <Link href={`/admin/users/${r.reportedUser.id}`} className="font-medium hover:underline">
                    {r.reportedUser.firstName}
                  </Link>
                  <div className="text-xs text-ink-500">{r.reportedUser.email}</div>
                </td>
                <td className="px-4 py-3">
                  <span className={statusClass(r.status)}>{r.status}</span>
                </td>
                <td className="px-4 py-3 text-ink-500 text-xs">
                  {r.createdAt.toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-right">
                  {r.status === "open" || r.status === "reviewing" ? (
                    <ReportControls reportId={r.id} reportedUserId={r.reportedUser.id} alreadyBanned={r.reportedUser.isBanned} />
                  ) : null}
                </td>
              </tr>
            ))}
            {reports.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-ink-500">No reports yet.</td></tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function statusClass(s: string): string {
  switch (s) {
    case "open": return "pill bg-yellow-100 text-yellow-700";
    case "reviewing": return "pill bg-blue-100 text-blue-700";
    case "resolved": return "pill bg-emerald-100 text-emerald-700";
    case "dismissed": return "pill";
    default: return "pill";
  }
}
