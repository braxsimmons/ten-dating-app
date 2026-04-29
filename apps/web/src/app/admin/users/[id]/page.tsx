import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@ten/database";
import { GrantCreditsForm, RemovePhotoButton } from "./Controls";

export const dynamic = "force-dynamic";

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      profile: true,
      photos: { orderBy: { order: "asc" } },
      promptAnswers: { include: { prompt: true } },
      wallet: true,
      purchases: { orderBy: { createdAt: "desc" }, take: 10 },
      reportsReceived: { take: 10, orderBy: { createdAt: "desc" } },
    },
  });
  if (!user) notFound();

  return (
    <div className="space-y-6">
      <Link href="/admin/users" className="text-sm text-ink-500 hover:underline">← Users</Link>
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold">{user.firstName}</h1>
          <p className="text-ink-500">{user.email}</p>
        </div>
        <div className="text-right text-xs text-ink-500">
          <div>Joined {user.createdAt.toLocaleDateString()}</div>
          <div>Last active {user.lastActiveAt.toLocaleDateString()}</div>
        </div>
      </header>

      <section className="card p-5">
        <p className="font-display text-lg font-semibold">Wallet</p>
        <div className="mt-3 grid grid-cols-4 gap-4 text-center">
          {(["extraSwipes", "rewinds", "doubleDowns", "revealNowCredits"] as const).map((k) => (
            <div key={k}>
              <div className="font-display text-2xl font-semibold">{user.wallet?.[k] ?? 0}</div>
              <div className="text-xs uppercase tracking-wider text-ink-500">{k}</div>
            </div>
          ))}
        </div>
        <GrantCreditsForm userId={user.id} />
      </section>

      <section className="card p-5">
        <p className="font-display text-lg font-semibold">Photos</p>
        <div className="mt-3 grid grid-cols-3 sm:grid-cols-5 gap-2">
          {user.photos.map((p) => (
            <div key={p.id} className="relative aspect-[3/4] rounded-xl overflow-hidden bg-ink-100 group">
              <Image src={p.url} alt="" fill sizes="200px" className="object-cover" unoptimized />
              <RemovePhotoButton photoId={p.id} />
            </div>
          ))}
        </div>
      </section>

      <section className="card p-5">
        <p className="font-display text-lg font-semibold">Recent purchases</p>
        <ul className="mt-3 divide-y divide-ink-100">
          {user.purchases.map((p) => (
            <li key={p.id} className="py-2 flex items-center justify-between text-sm">
              <span>{p.productId}</span>
              <span className="text-ink-500">
                {p.status} · ${(p.amount / 100).toFixed(2)} · {p.createdAt.toLocaleDateString()}
              </span>
            </li>
          ))}
          {user.purchases.length === 0 ? (
            <li className="py-2 text-sm text-ink-500">No purchases.</li>
          ) : null}
        </ul>
      </section>

      <section className="card p-5">
        <p className="font-display text-lg font-semibold">Reports filed against {user.firstName}</p>
        <ul className="mt-3 divide-y divide-ink-100">
          {user.reportsReceived.map((r) => (
            <li key={r.id} className="py-2 text-sm">
              <span className="capitalize">{r.reason.replace(/-/g, " ")}</span>
              <span className="text-ink-500"> · {r.status} · {r.createdAt.toLocaleDateString()}</span>
              {r.description ? <p className="text-ink-500 text-xs mt-0.5">{r.description}</p> : null}
            </li>
          ))}
          {user.reportsReceived.length === 0 ? (
            <li className="py-2 text-sm text-ink-500">No reports.</li>
          ) : null}
        </ul>
      </section>
    </div>
  );
}
