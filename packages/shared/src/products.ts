export type CreditKind = "extraSwipes" | "rewinds" | "doubleDowns" | "revealNowCredits";

export interface Product {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  currency: "usd";
  credits: Partial<Record<CreditKind, number>>;
  category: "swipes" | "rewinds" | "double-downs" | "reveal";
}

export const PRODUCTS: Record<string, Product> = {
  extra_swipes_5: {
    id: "extra_swipes_5",
    name: "5 Extra Swipes",
    description: "Five more chances today.",
    priceCents: 99,
    currency: "usd",
    credits: { extraSwipes: 5 },
    category: "swipes",
  },
  extra_swipes_15: {
    id: "extra_swipes_15",
    name: "15 Extra Swipes",
    description: "Best for when 10 isn't enough.",
    priceCents: 299,
    currency: "usd",
    credits: { extraSwipes: 15 },
    category: "swipes",
  },
  extra_swipes_40: {
    id: "extra_swipes_40",
    name: "40 Extra Swipes",
    description: "For the truly indecisive.",
    priceCents: 699,
    currency: "usd",
    credits: { extraSwipes: 40 },
    category: "swipes",
  },
  rewinds_5: {
    id: "rewinds_5",
    name: "5 Rewinds",
    description: "Take back accidental passes.",
    priceCents: 199,
    currency: "usd",
    credits: { rewinds: 5 },
    category: "rewinds",
  },
  rewinds_15: {
    id: "rewinds_15",
    name: "15 Rewinds",
    description: "For frequent second-guessers.",
    priceCents: 499,
    currency: "usd",
    credits: { rewinds: 15 },
    category: "rewinds",
  },
  double_downs_5: {
    id: "double_downs_5",
    name: "5 Double Downs",
    description: "Show them you're serious.",
    priceCents: 399,
    currency: "usd",
    credits: { doubleDowns: 5 },
    category: "double-downs",
  },
  double_downs_15: {
    id: "double_downs_15",
    name: "15 Double Downs",
    description: "For the high-intent dater.",
    priceCents: 999,
    currency: "usd",
    credits: { doubleDowns: 15 },
    category: "double-downs",
  },
  reveal_now_1: {
    id: "reveal_now_1",
    name: "Reveal Now",
    description: "See your matches early.",
    priceCents: 99,
    currency: "usd",
    credits: { revealNowCredits: 1 },
    category: "reveal",
  },
};

export const PRODUCT_LIST = Object.values(PRODUCTS);

export function getProduct(id: string): Product | undefined {
  return PRODUCTS[id];
}

export function formatPrice(cents: number, currency: string = "usd"): string {
  const value = (cents / 100).toFixed(2);
  return currency === "usd" ? `$${value}` : `${value} ${currency.toUpperCase()}`;
}
