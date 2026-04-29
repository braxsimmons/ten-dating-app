"use client";

import { useState, useTransition } from "react";
import { refundPurchaseAction } from "@/lib/actions/admin-refunds";

export function RefundButton({ purchaseId }: { purchaseId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [clawback, setClawback] = useState(true);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-ghost py-1.5 px-3 text-red-600">Refund</button>
    );
  }
  return (
    <div className="card p-3 text-left space-y-2 max-w-xs">
      <input
        className="input"
        placeholder="Reason (optional)"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
      />
      <label className="flex items-center gap-2 text-xs">
        <input type="checkbox" checked={clawback} onChange={(e) => setClawback(e.target.checked)} />
        Clawback granted credits if still in wallet
      </label>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
      <div className="flex gap-2">
        <button
          disabled={pending}
          onClick={() =>
            start(async () => {
              setError(null);
              const r = await refundPurchaseAction({ purchaseId, reason, clawback });
              if (!r.ok) setError(r.error);
              else setOpen(false);
            })
          }
          className="btn-primary py-1.5 flex-1"
        >
          {pending ? "Refunding..." : "Confirm refund"}
        </button>
        <button onClick={() => setOpen(false)} className="btn-ghost py-1.5">Cancel</button>
      </div>
    </div>
  );
}
