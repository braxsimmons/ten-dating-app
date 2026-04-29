import { requireUser } from "@/lib/auth";
import { formatPrice } from "@ten/shared";
import { getActiveProducts } from "@/lib/products-db";
import { StoreItem } from "./StoreItem";

export const dynamic = "force-dynamic";

export default async function StorePage() {
  const user = await requireUser();
  const products = await getActiveProducts();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-semibold">Store</h1>
        <p className="text-ink-600">Microtransactions only. Cancel? There's nothing to cancel.</p>
      </header>

      <section className="card p-5 grid grid-cols-3 gap-4">
        <Wallet label="Extra swipes" value={user.wallet?.extraSwipes ?? 0} />
        <Wallet label="Rewinds" value={user.wallet?.rewinds ?? 0} />
        <Wallet label="Double Downs" value={user.wallet?.doubleDowns ?? 0} />
      </section>

      {[
        { id: "swipes" as const, title: "Extra swipes" },
        { id: "rewinds" as const, title: "Rewinds" },
        { id: "double-downs" as const, title: "Double Downs" },
      ].map((cat) => {
        const items = products.filter((p) => p.category === cat.id);
        if (items.length === 0) return null;
        return (
          <section key={cat.id}>
            <h2 className="font-display text-xl font-semibold mb-3">{cat.title}</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              {items.map((p) => (
                <StoreItem key={p.id} product={{ ...p, priceLabel: formatPrice(p.priceCents) }} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function Wallet({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <div className="font-display text-3xl font-semibold">{value}</div>
      <div className="text-xs uppercase tracking-wider text-ink-500">{label}</div>
    </div>
  );
}
