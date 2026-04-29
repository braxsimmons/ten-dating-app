"use client";

import { useState, useTransition } from "react";
import { createCheckoutSession } from "@/lib/actions/purchases";

export function StoreItem({
  product,
}: {
  product: { id: string; name: string; description: string; priceLabel: string };
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <button
      onClick={() =>
        start(async () => {
          setError(null);
          const r = await createCheckoutSession({ productId: product.id });
          if (!r.ok) setError(r.error);
          else window.location.href = r.url;
        })
      }
      disabled={pending}
      className="card p-5 text-left hover:border-ember transition disabled:opacity-50"
    >
      <p className="font-display text-lg font-semibold">{product.name}</p>
      <p className="text-sm text-ink-500">{product.description}</p>
      <p className="mt-3 font-display text-2xl font-semibold text-ember">{product.priceLabel}</p>
      {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
    </button>
  );
}
