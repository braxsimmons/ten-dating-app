import Link from "next/link";
import Image from "next/image";
import { prisma } from "@ten/database";
import { ModerationActions } from "./ModerationActions";

export const dynamic = "force-dynamic";

export default async function AdminModerationPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const sp = await searchParams;
  const status = (sp.status as "pending" | "rejected" | "approved" | undefined) ?? "pending";

  const [photos, counts] = await Promise.all([
    prisma.profilePhoto.findMany({
      where: { moderationStatus: status },
      orderBy: { createdAt: "desc" },
      take: 60,
      include: { user: { select: { id: true, firstName: true, email: true, isBanned: true } } },
    }),
    prisma.profilePhoto.groupBy({
      by: ["moderationStatus"],
      _count: { _all: true },
    }),
  ]);

  const counter = (s: string) => counts.find((c) => c.moderationStatus === s)?._count._all ?? 0;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold">Moderation queue</h1>
          <p className="text-ink-500">New uploads land here for review before showing in the feed.</p>
        </div>
        <nav className="flex gap-1">
          {[
            ["pending", `Pending (${counter("pending")})`],
            ["rejected", `Rejected (${counter("rejected")})`],
            ["approved", `Approved (${counter("approved")})`],
          ].map(([s, label]) => (
            <Link
              key={s}
              href={`/admin/moderation?status=${s}`}
              className={`btn-ghost py-1.5 px-3 whitespace-nowrap ${s === status ? "bg-ink text-white" : ""}`}
            >
              {label}
            </Link>
          ))}
        </nav>
      </header>

      {photos.length === 0 ? (
        <div className="card p-10 text-center text-ink-500">Queue empty.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {photos.map((p) => (
            <div key={p.id} className="card overflow-hidden">
              <div className="relative aspect-[3/4] bg-ink-100">
                <Image src={p.url} alt="" fill sizes="400px" className="object-cover" unoptimized />
              </div>
              <div className="p-4">
                <Link href={`/admin/users/${p.user.id}`} className="font-medium hover:underline">
                  {p.user.firstName}
                </Link>
                <p className="text-xs text-ink-500">{p.user.email}</p>
                <p className="text-xs text-ink-500 mt-1">
                  Uploaded {p.createdAt.toLocaleString()}
                </p>
                <ModerationActions photoId={p.id} status={status} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
