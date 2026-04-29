"use client";

import { useState, useTransition } from "react";
import { PRODUCT_LIST, formatPrice, type Product } from "@ten/shared";
import { createCheckoutSession } from "@/lib/actions/purchases";

const CATEGORY_TITLES: Record<string, { title: string; subtitle: string }> = {
  swipes: {
    title: "Out of swipes?",
    subtitle: "Pick up where you left off.",
  },
  rewinds: {
    title: "Need a do-over?",
    subtitle: "Take back your last swipe.",
  },
  "double-downs": {
    title: "Double Down",
    subtitle: "Show them you're serious.",
  },
};

export function PurchaseModal({
  category,
  onClose,
}: {
  category: "swipes" | "rewinds" | "double-downs";
  onClose: () => void;
}) {
  const products = PRODUCT_LIST.filter((p) => p.category === category);
  const meta = CATEGORY_TITLES[category];
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function buy(p: Product) {
    setError(null);
    start(async () => {
      const r = await createCheckoutSession({ productId: p.id });
      if (!r.ok) {
        setError(r.error);
        return;
      }
      window.location.href = r.url;
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-lg sm:rounded-card rounded-t-card overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-ink-100 p-5">
          <p className="font-display text-2xl font-semibold">{meta.title}</p>
          <p className="text-sm text-ink-600">{meta.subtitle}</p>
        </div>
        <div className="p-5 space-y-3">
          {products.map((p) => (
            <button
              key={p.id}
              onClick={() => buy(p)}
              disabled={pending}
              className="card flex items-center justify-between w-full p-5 hover:border-ember transition text-left"
            >
              <div>
                <p className="font-display text-lg font-semibold">{p.name}</p>
                <p className="text-sm text-ink-500">{p.description}</p>
              </div>
              <span className="font-display text-xl font-semibold text-ember">
                {formatPrice(p.priceCents)}
              </span>
            </button>
          ))}
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </div>
        <div className="p-4 text-center">
          <button onClick={onClose} className="btn-ghost">No thanks</button>
        </div>
      </div>
    </div>
  );
}
