import Link from "next/link";
import Image from "next/image";
import { prisma } from "@ten/database";
import { requireUser } from "@/lib/auth";
import { ageFromDob } from "@/lib/feed";

export const dynamic = "force-dynamic";

export default async function MatchesPage() {
  const user = await requireUser();

  const matches = await prisma.match.findMany({
    where: {
      OR: [{ userAId: user.id }, { userBId: user.id }],
      unmatchedAt: null,
    },
    include: {
      userA: { include: { photos: { orderBy: { order: "asc" }, take: 1 } } },
      userB: { include: { photos: { orderBy: { order: "asc" }, take: 1 } } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
  });

  if (matches.length === 0) {
    return (
      <div className="card p-10 text-center animate-slide-up">
        <p className="font-display text-2xl font-semibold">No matches yet.</p>
        <p className="mt-2 text-ink-600">Use your daily 10 wisely — first impressions count.</p>
        <Link href="/app" className="btn-ember mt-6 inline-flex">Back to your deck</Link>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h1 className="font-display text-3xl font-semibold mb-4">Your matches</h1>
      {matches.map((m) => {
        const other = m.userAId === user.id ? m.userB : m.userA;
        const photo = other.photos[0]?.url;
        const last = m.messages[0];
        return (
          <Link
            key={m.id}
            href={`/app/matches/${m.id}`}
            className="card flex items-center gap-4 p-4 hover:border-ember transition"
          >
            <div className="relative h-14 w-14 rounded-full overflow-hidden bg-ink-200 shrink-0">
              {photo ? <Image src={photo} alt={other.firstName} fill sizes="56px" className="object-cover" /> : null}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium">
                {other.firstName}, {ageFromDob(other.dateOfBirth)}
              </p>
              <p className="truncate text-sm text-ink-500">
                {last
                  ? `${last.senderId === user.id ? "You: " : ""}${last.body}`
                  : "Say hello — first impressions count."}
              </p>
            </div>
            <div className="text-xs text-ink-400">
              {new Date(last?.createdAt ?? m.createdAt).toLocaleDateString()}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
