import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@ten/database";
import { requireUser } from "@/lib/auth";
import { ageFromDob } from "@/lib/feed";
import { ChatThread } from "./ChatThread";
import { markRead } from "@/lib/actions/messages";

export const dynamic = "force-dynamic";

export default async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();

  const match = await prisma.match.findUnique({
    where: { id },
    include: {
      userA: { include: { photos: { orderBy: { order: "asc" } }, profile: true } },
      userB: { include: { photos: { orderBy: { order: "asc" } }, profile: true } },
      messages: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!match) notFound();
  if (match.userAId !== user.id && match.userBId !== user.id) redirect("/app/matches");

  const other = match.userAId === user.id ? match.userB : match.userA;

  await markRead(match.id);

  return (
    <div className="card overflow-hidden flex flex-col h-[calc(100svh-12rem)] md:h-[calc(100vh-9rem)]">
      <header className="flex items-center justify-between gap-3 border-b border-ink-100 px-4 py-3 bg-white">
        <Link href="/app/matches" className="btn-ghost px-2 py-1">←</Link>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="relative h-10 w-10 rounded-full overflow-hidden bg-ink-200">
            {other.photos[0] ? (
              <Image src={other.photos[0].url} alt={other.firstName} fill sizes="40px" className="object-cover" />
            ) : null}
          </div>
          <div className="min-w-0">
            <p className="font-medium truncate">{other.firstName}, {ageFromDob(other.dateOfBirth)}</p>
            {other.profile?.hiddenTrait ? (
              <p className="text-xs text-ember truncate">
                Hidden trait: {other.profile.hiddenTrait}
              </p>
            ) : null}
          </div>
        </div>
      </header>

      {match.unmatchedAt ? (
        <div className="bg-ink-100 text-ink-600 text-sm text-center py-3">
          This conversation has ended.
        </div>
      ) : null}

      <ChatThread
        matchId={match.id}
        currentUserId={user.id}
        otherFirstName={other.firstName}
        unmatched={!!match.unmatchedAt}
        initialMessages={match.messages.map((m) => ({
          id: m.id,
          body: m.body,
          senderId: m.senderId,
          createdAt: m.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
