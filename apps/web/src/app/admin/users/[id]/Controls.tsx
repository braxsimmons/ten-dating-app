"use client";

import { useState, useTransition } from "react";
import { grantCreditsAction, removePhotoAction } from "@/lib/actions/admin";

const KINDS = ["extraSwipes", "rewinds", "doubleDowns", "revealNowCredits"] as const;

export function GrantCreditsForm({ userId }: { userId: string }) {
  const [kind, setKind] = useState<typeof KINDS[number]>("extraSwipes");
  const [amount, setAmount] = useState("5");
  const [pending, start] = useTransition();
  const [done, setDone] = useState<string | null>(null);

  return (
    <form
      className="mt-4 flex flex-wrap items-end gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        const n = parseInt(amount, 10);
        if (!Number.isFinite(n)) return;
        setDone(null);
        start(async () => {
          await grantCreditsAction({ userId, kind, amount: n });
          setDone("Granted.");
          setTimeout(() => setDone(null), 1500);
        });
      }}
    >
      <div>
        <label className="label">Kind</label>
        <select className="input" value={kind} onChange={(e) => setKind(e.target.value as typeof KINDS[number])}>
          {KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
        </select>
      </div>
      <div>
        <label className="label">Amount</label>
        <input type="number" className="input w-28" value={amount} onChange={(e) => setAmount(e.target.value)} />
      </div>
      <button className="btn-primary" disabled={pending}>Grant</button>
      {done ? <span className="text-sm text-emerald-600">{done}</span> : null}
    </form>
  );
}

export function RemovePhotoButton({ photoId }: { photoId: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      onClick={() => start(async () => { await removePhotoAction(photoId); })}
      disabled={pending}
      className="absolute top-2 right-2 rounded-full bg-black/60 text-white text-xs px-2 py-1 opacity-0 group-hover:opacity-100 transition"
    >
      Remove
    </button>
  );
}
