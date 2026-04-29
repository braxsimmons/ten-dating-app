"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { swipeAction, rewindLastSwipe } from "@/lib/actions/swipe";
import type { FeedCard } from "@/lib/feed";
import type { SwipeBudget } from "@/lib/swipe";
import { MatchModal } from "./MatchModal";
import { PurchaseModal } from "./PurchaseModal";
import { ProfileSheet } from "./ProfileSheet";
import { cn } from "@/lib/cn";

interface Wallet {
  extraSwipes: number;
  rewinds: number;
  doubleDowns: number;
}

export function SwipeDeck({
  initialCandidates,
  initialBudget,
  initialWallet,
}: {
  initialCandidates: FeedCard[];
  initialBudget: SwipeBudget;
  initialWallet: Wallet;
}) {
  const [cards, setCards] = useState(initialCandidates);
  const [budget, setBudget] = useState(initialBudget);
  const [wallet, setWallet] = useState(initialWallet);
  const [open, setOpen] = useState<FeedCard | null>(null);
  const [match, setMatch] = useState<FeedCard | null>(null);
  const [showPurchase, setShowPurchase] = useState<null | "swipes" | "rewinds" | "double-downs">(null);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [lastDecision, setLastDecision] = useState<{ card: FeedCard; usedDoubleDown: boolean } | null>(null);

  const top = cards[0];
  const next = cards[1];

  function decide(action: "like" | "pass", isDoubleDown = false) {
    if (!top) return;
    setError(null);

    if (budget.totalRemaining <= 0) {
      setShowPurchase("swipes");
      return;
    }
    if (isDoubleDown && wallet.doubleDowns <= 0) {
      setShowPurchase("double-downs");
      return;
    }

    start(async () => {
      const r = await swipeAction({
        targetUserId: top.id,
        action,
        isDoubleDown,
      });
      if (!r.ok) {
        if (r.error === "OUT_OF_SWIPES") {
          setShowPurchase("swipes");
          return;
        }
        if (r.error === "NO_DOUBLE_DOWN") {
          setShowPurchase("double-downs");
          return;
        }
        setError(r.error);
        return;
      }


      setBudget((b) => {
        const used = b.freeRemaining > 0;
        return {
          ...b,
          freeUsed: used ? b.freeUsed + 1 : b.freeUsed,
          freeRemaining: used ? b.freeRemaining - 1 : b.freeRemaining,
          extraSwipes: used ? b.extraSwipes : b.extraSwipes - 1,
          totalRemaining: b.totalRemaining - 1,
        };
      });
      if (isDoubleDown) {
        setWallet((w) => ({ ...w, doubleDowns: w.doubleDowns - 1 }));
      }

      setLastDecision({ card: top, usedDoubleDown: isDoubleDown });
      setCards((c) => c.slice(1));
      setOpen(null);

      if (r.matchId) setMatch(top);
    });
  }

  function rewind() {
    if (wallet.rewinds <= 0) {
      setShowPurchase("rewinds");
      return;
    }
    if (!lastDecision) return;
    setError(null);
    start(async () => {
      const r = await rewindLastSwipe();
      if (!r.ok) {
        if (r.error === "NO_REWINDS") setShowPurchase("rewinds");
        else setError(r.error);
        return;
      }
      setCards((c) => [lastDecision.card, ...c]);
      setBudget((b) => ({
        ...b,
        freeUsed: Math.max(0, b.freeUsed - 1),
        freeRemaining: Math.min(b.freeLimit, b.freeRemaining + 1),
        totalRemaining: b.totalRemaining + 1,
      }));
      setWallet((w) => ({
        ...w,
        rewinds: w.rewinds - 1,
        doubleDowns: w.doubleDowns + (lastDecision.usedDoubleDown ? 1 : 0),
      }));
      setLastDecision(null);
    });
  }

  return (
    <div className="space-y-4">
      <SwipeHeader budget={budget} wallet={wallet} />

      {!top ? (
        <EmptyState budget={budget} onBuyMore={() => setShowPurchase("swipes")} />
      ) : (
        <div className="relative">
          {next ? <Card card={next} compact /> : null}
          <Card
            card={top}
            onOpen={() => setOpen(top)}
            doubledDownByThem={top.doubledDownByThem}
          />
        </div>
      )}

      {top ? (
        <ActionBar
          disabled={pending}
          canRewind={!!lastDecision && wallet.rewinds > 0}
          doubleDowns={wallet.doubleDowns}
          onPass={() => decide("pass")}
          onLike={() => decide("like")}
          onDoubleDown={() => decide("like", true)}
          onView={() => setOpen(top)}
          onRewind={rewind}
        />
      ) : null}

      {error ? <p className="text-center text-sm text-red-600">{error}</p> : null}

      {open ? (
        <ProfileSheet
          card={open}
          onClose={() => setOpen(null)}
          onLike={() => decide("like")}
          onPass={() => decide("pass")}
          onDoubleDown={() => decide("like", true)}
          doubleDowns={wallet.doubleDowns}
          disabled={pending}
        />
      ) : null}

      {match ? (
        <MatchModal card={match} onClose={() => setMatch(null)} />
      ) : null}

      {showPurchase ? (
        <PurchaseModal
          category={showPurchase}
          onClose={() => setShowPurchase(null)}
        />
      ) : null}
    </div>
  );
}

function SwipeHeader({ budget, wallet }: { budget: SwipeBudget; wallet: Wallet }) {
  const pct = Math.min(100, (budget.freeUsed / budget.freeLimit) * 100);
  return (
    <div className="card p-3 md:p-4">
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] md:text-xs uppercase tracking-[0.2em] text-ink-500">Today's deck</p>
          <p className="font-display text-xl md:text-2xl font-semibold leading-tight">
            {budget.freeRemaining} of {budget.freeLimit} left
            {budget.extraSwipes > 0 ? (
              <span className="ml-2 text-xs md:text-sm font-medium text-ember">
                +{budget.extraSwipes} extra
              </span>
            ) : null}
          </p>
        </div>
        <div className="flex gap-3 text-xs shrink-0">
          <Stat label="Rewinds" value={wallet.rewinds} />
          <Stat label="2× Down" value={wallet.doubleDowns} />
        </div>
      </div>
      <div className="mt-2 md:mt-3 h-1.5 rounded-full bg-ink-100 overflow-hidden">
        <div
          className="h-full bg-ember transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-right">
      <div className="font-display text-base font-semibold">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-ink-500">{label}</div>
    </div>
  );
}

function Card({
  card,
  compact,
  onOpen,
  doubledDownByThem,
}: {
  card: FeedCard;
  compact?: boolean;
  onOpen?: () => void;
  doubledDownByThem?: boolean;
}) {
  const photo = card.photos[0]?.url;
  return (
    <div
      className={cn(
        "relative w-full rounded-card overflow-hidden bg-ink-200 shadow-card animate-fade-in",
        compact ? "absolute inset-0 scale-[0.97] -translate-y-2 opacity-60" : "",

        "aspect-[3/4] max-h-[58svh] md:max-h-none",
      )}
      onClick={onOpen}
      role={onOpen ? "button" : undefined}
    >
      {photo ? (

        <Image src={photo} alt={card.firstName} fill sizes="(max-width: 768px) 100vw, 600px" className="object-cover" priority={!compact} unoptimized />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-b from-ink-300 to-ink-500" />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/70" />
      {doubledDownByThem ? (
        <div className="absolute top-4 right-4 pill bg-ember text-white">
          <span className="h-1.5 w-1.5 rounded-full bg-white" />
          They doubled down
        </div>
      ) : null}
      <div className="absolute bottom-0 p-6 text-white">
        <p className="font-display text-3xl font-semibold leading-tight">
          {card.firstName}, {card.age}
        </p>
        <p className="text-sm opacity-90">
          {[card.locationCity, card.locationState].filter(Boolean).join(", ") || "Nearby"}
        </p>
        {card.bio && !compact ? (
          <p className="mt-2 text-sm opacity-90 line-clamp-2">{card.bio}</p>
        ) : null}
        {!compact ? (
          <button
            type="button"
            className="mt-3 inline-flex items-center gap-2 text-xs font-medium text-white/90 underline-offset-4 hover:underline"
          >
            View full profile →
          </button>
        ) : null}
      </div>
    </div>
  );
}

function ActionBar({
  disabled,
  canRewind,
  doubleDowns,
  onPass,
  onLike,
  onDoubleDown,
  onView,
  onRewind,
}: {
  disabled: boolean;
  canRewind: boolean;
  doubleDowns: number;
  onPass: () => void;
  onLike: () => void;
  onDoubleDown: () => void;
  onView: () => void;
  onRewind: () => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={onRewind}
          disabled={disabled || !canRewind}
          title="Rewind last swipe"
          className="btn-outline h-12 w-12 p-0 text-lg shrink-0"
          aria-label="Rewind"
        >
          ↶
        </button>
        <button
          onClick={onPass}
          disabled={disabled}
          className="btn-outline h-14 flex-1 text-base"
        >
          Pass
        </button>
        <button
          onClick={onLike}
          disabled={disabled}
          className="btn-primary h-14 flex-1 text-base"
        >
          Like
        </button>
        <button
          onClick={onView}
          disabled={disabled}
          className="btn-outline h-12 w-12 p-0 shrink-0"
          title="View profile"
          aria-label="View"
        >
          ↗
        </button>
      </div>
      <button
        onClick={onDoubleDown}
        disabled={disabled}
        title={`Double Down (${doubleDowns} left)`}
        className="btn-ember w-full h-12 text-sm"
      >
        2× Double Down{doubleDowns > 0 ? ` · ${doubleDowns} left` : ""}
      </button>
    </div>
  );
}

function EmptyState({
  budget,
  onBuyMore,
}: {
  budget: SwipeBudget;
  onBuyMore: () => void;
}) {
  if (budget.totalRemaining <= 0) {
    return (
      <div className="card p-10 text-center animate-slide-up">
        <p className="font-display text-3xl font-semibold">You're out of today's picks.</p>
        <p className="mt-2 text-ink-600">Come back tomorrow or unlock more chances.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button onClick={onBuyMore} className="btn-ember">Buy more swipes</button>
          <Link href="/app/matches" className="btn-outline">See your matches</Link>
        </div>
      </div>
    );
  }
  return (
    <div className="card p-10 text-center animate-slide-up">
      <p className="font-display text-3xl font-semibold">No new profiles right now.</p>
      <p className="mt-2 text-ink-600">We're curating tomorrow's deck. Check back soon.</p>
      <Link href="/app/matches" className="btn-outline mt-6 inline-flex">See your matches</Link>
    </div>
  );
}
