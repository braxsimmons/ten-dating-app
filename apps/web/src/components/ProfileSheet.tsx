"use client";

import { useState } from "react";
import Image from "next/image";
import type { FeedCard } from "@/lib/feed";
import { reportUserAction, blockUserAction } from "@/lib/actions/safety";
import { REPORT_REASONS } from "@ten/shared";

export function ProfileSheet({
  card,
  onClose,
  onLike,
  onPass,
  onDoubleDown,
  doubleDowns,
  disabled,
}: {
  card: FeedCard;
  onClose: () => void;
  onLike: () => void;
  onPass: () => void;
  onDoubleDown: () => void;
  doubleDowns: number;
  disabled: boolean;
}) {
  const [showReport, setShowReport] = useState(false);
  return (
    <div
      className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-2xl max-h-[90vh] sm:rounded-card rounded-t-card overflow-hidden flex flex-col animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-ink-100 px-5 py-3">
          <p className="font-display text-lg font-semibold">{card.firstName}, {card.age}</p>
          <button onClick={onClose} className="btn-ghost p-2" aria-label="Close">✕</button>
        </div>

        <div className="overflow-y-auto p-5 space-y-5">
          <div className="grid gap-3 sm:grid-cols-2">
            {card.photos.map((p, i) => (
              <div key={p.id} className="relative aspect-[3/4] rounded-card overflow-hidden bg-ink-100">
                <Image src={p.url} alt={`${card.firstName} ${i + 1}`} fill sizes="(max-width: 768px) 100vw, 400px" className="object-cover" unoptimized />
              </div>
            ))}
          </div>

          {card.bio ? (
            <section>
              <H3>About</H3>
              <p className="text-ink-700 leading-relaxed">{card.bio}</p>
            </section>
          ) : null}

          <Facts card={card} />

          {card.prompts.length ? (
            <section className="space-y-3">
              {card.prompts.map((p) => (
                <div key={p.promptId} className="card p-4">
                  <p className="text-xs uppercase tracking-wider text-ink-500">{p.text}</p>
                  <p className="mt-2 font-display text-lg leading-snug">{p.answer}</p>
                </div>
              ))}
            </section>
          ) : null}

          <p className="text-xs text-center text-ink-500">
            Hidden trait revealed after match.
          </p>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowReport((s) => !s)}
              className="btn-ghost text-xs"
            >
              Report or block {card.firstName}
            </button>
            {showReport ? (
              <ReportInline
                userId={card.id}
                onDone={() => setShowReport(false)}
              />
            ) : null}
          </div>
        </div>

        <div className="border-t border-ink-100 p-4 flex items-center gap-2 bg-white">
          <button onClick={onPass} disabled={disabled} className="btn-outline h-12 flex-1">Pass</button>
          <button onClick={onLike} disabled={disabled} className="btn-primary h-12 flex-1">Like</button>
          <button
            onClick={onDoubleDown}
            disabled={disabled}
            title={`${doubleDowns} Double Downs`}
            className="btn-ember h-12 px-4"
          >
            2× Down
          </button>
        </div>
      </div>
    </div>
  );
}

function H3({ children }: { children: React.ReactNode }) {
  return <p className="text-xs uppercase tracking-wider text-ink-500 mb-1.5">{children}</p>;
}

function Facts({ card }: { card: FeedCard }) {
  const items = [
    card.datingIntent ? ["Looking for", card.datingIntent.replace(/_/g, " ")] : null,
    card.height ? ["Height", `${card.height} cm`] : null,
    card.work ? ["Work", card.work] : null,
    card.education ? ["School", card.education] : null,
    card.religion ? ["Religion", card.religion] : null,
    card.lifestyle ? ["Lifestyle", card.lifestyle] : null,
  ].filter(Boolean) as [string, string][];
  if (!items.length) return null;
  return (
    <section className="grid gap-2 sm:grid-cols-2">
      {items.map(([k, v]) => (
        <div key={k} className="flex items-center justify-between rounded-xl bg-ink-50 px-3 py-2 text-sm">
          <span className="text-ink-500">{k}</span>
          <span className="font-medium capitalize">{v}</span>
        </div>
      ))}
    </section>
  );
}

function ReportInline({ userId, onDone }: { userId: string; onDone: () => void }) {
  const [reason, setReason] = useState<string>("");
  const [desc, setDesc] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  async function submit() {
    if (!reason) return;
    setBusy(true);
    const r = await reportUserAction({ reportedUserId: userId, reason, description: desc });
    setBusy(false);
    if (r.ok) {
      setDone("Reported. Thank you.");
      setTimeout(onDone, 1200);
    }
  }
  async function block() {
    setBusy(true);
    await blockUserAction(userId);
    setBusy(false);
    setDone("Blocked.");
    setTimeout(onDone, 800);
  }

  return (
    <div className="mt-3 card p-4 space-y-3">
      <select className="input" value={reason} onChange={(e) => setReason(e.target.value)}>
        <option value="">Pick a reason...</option>
        {REPORT_REASONS.map((r) => (
          <option key={r} value={r}>{r.replace(/-/g, " ")}</option>
        ))}
      </select>
      <textarea
        rows={3}
        placeholder="Anything else we should know? (optional)"
        className="input"
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
      />
      {done ? <p className="text-xs text-emerald-600">{done}</p> : null}
      <div className="flex gap-2">
        <button onClick={submit} disabled={busy || !reason} className="btn-primary flex-1 py-2">Report</button>
        <button onClick={block} disabled={busy} className="btn-outline flex-1 py-2">Block</button>
      </div>
    </div>
  );
}
