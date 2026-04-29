"use client";

import Link from "next/link";
import Image from "next/image";
import type { FeedCard } from "@/lib/feed";

export function MatchModal({ card, onClose }: { card: FeedCard; onClose: () => void }) {
  const photo = card.photos[0]?.url;
  return (
    <div
      className="fixed inset-0 z-50 bg-ink/85 backdrop-blur-md flex items-center justify-center px-6 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="text-center text-white max-w-sm animate-match-pop"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-xs uppercase tracking-[0.3em] text-ember">It's a match</p>
        <h2 className="mt-3 font-display text-5xl font-semibold">
          You both chose each other.
        </h2>

        <div className="mt-8 flex justify-center">
          {photo ? (
            <div className="relative h-32 w-32 rounded-full overflow-hidden ring-4 ring-ember">
              <Image src={photo} alt={card.firstName} fill sizes="128px" className="object-cover" />
            </div>
          ) : null}
        </div>
        <p className="mt-4 font-display text-xl">{card.firstName}</p>
        <p className="text-sm text-ink-300">Hidden trait now visible. Make it count.</p>

        <div className="mt-8 flex flex-col gap-3">
          <Link href="/app/matches" className="btn-ember py-3 text-base">
            Send a message
          </Link>
          <button onClick={onClose} className="btn-ghost text-white py-3">
            Keep swiping
          </button>
        </div>
      </div>
    </div>
  );
}
