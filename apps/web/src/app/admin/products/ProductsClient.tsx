"use client";

import { useState, useTransition } from "react";
import { archiveProductAction, createProductAction, updateProductAction } from "@/lib/actions/admin-products";
import { formatPrice } from "@ten/shared";

interface DbProduct {
  id: string;
  name: string;
  description: string;
  category: "swipes" | "rewinds" | "double-downs" | "reveal";
  priceCents: number;
  credits: { extraSwipes?: number; rewinds?: number; doubleDowns?: number; revealNowCredits?: number };
  isActive: boolean;
  sortOrder: number;
}

const CATEGORIES: DbProduct["category"][] = ["swipes", "rewinds", "double-downs", "reveal"];

export function ProductsClient({ products }: { products: DbProduct[] }) {
  const [showNew, setShowNew] = useState(false);
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setShowNew((s) => !s)} className="btn-primary">
          {showNew ? "Cancel" : "+ New product"}
        </button>
      </div>

      {showNew ? <NewProductForm onDone={() => setShowNew(false)} /> : null}

      {CATEGORIES.map((cat) => {
        const items = products.filter((p) => p.category === cat);
        if (items.length === 0) return null;
        return (
          <section key={cat} className="card overflow-hidden">
            <header className="px-5 py-3 border-b border-ink-100 bg-ink-50">
              <p className="font-display text-lg font-semibold capitalize">{cat.replace(/-/g, " ")}</p>
            </header>
            <ul>
              {items.map((p) => (
                <ProductRow key={p.id} product={p} />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

function ProductRow({ product }: { product: DbProduct }) {
  const [editing, setEditing] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const credit = creditSummary(product);

  return (
    <li className={`px-5 py-4 border-b border-ink-100 last:border-0 ${product.isActive ? "" : "opacity-50"}`}>
      {!editing ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium">{product.name}</p>
              {!product.isActive ? <span className="pill bg-ink-100 text-ink-600">Archived</span> : null}
              <code className="text-xs text-ink-500">{product.id}</code>
            </div>
            <p className="text-sm text-ink-500">{product.description}</p>
            <p className="text-xs text-ink-500 mt-1">{credit}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-display text-xl font-semibold text-ember">{formatPrice(product.priceCents)}</span>
            <button onClick={() => setEditing(true)} className="btn-ghost py-1.5 px-3">Edit</button>
            {product.isActive ? (
              <button
                disabled={pending}
                onClick={() => start(async () => {
                  if (!confirm(`Archive "${product.name}"? Existing purchases keep their data.`)) return;
                  await archiveProductAction(product.id);
                })}
                className="btn-ghost py-1.5 px-3 text-red-600"
              >
                Archive
              </button>
            ) : (
              <button
                disabled={pending}
                onClick={() => start(async () => { await updateProductAction({ id: product.id, isActive: true }); })}
                className="btn-ghost py-1.5 px-3"
              >
                Restore
              </button>
            )}
          </div>
        </div>
      ) : (
        <EditProductForm
          product={product}
          onCancel={() => setEditing(false)}
          onSave={(input) =>
            start(async () => {
              setError(null);
              const r = await updateProductAction(input);
              if (!r.ok) setError(r.error);
              else setEditing(false);
            })
          }
          pending={pending}
          error={error}
        />
      )}
    </li>
  );
}

function EditProductForm({
  product,
  onCancel,
  onSave,
  pending,
  error,
}: {
  product: DbProduct;
  onCancel: () => void;
  onSave: (i: Parameters<typeof updateProductAction>[0]) => void;
  pending: boolean;
  error: string | null;
}) {
  const [name, setName] = useState(product.name);
  const [description, setDescription] = useState(product.description);
  const [priceDollars, setPriceDollars] = useState((product.priceCents / 100).toFixed(2));
  const [extraSwipes, setExtraSwipes] = useState(String(product.credits.extraSwipes ?? 0));
  const [rewinds, setRewinds] = useState(String(product.credits.rewinds ?? 0));
  const [doubleDowns, setDoubleDowns] = useState(String(product.credits.doubleDowns ?? 0));

  return (
    <div className="space-y-3">
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Name" value={name} onChange={setName} />
        <Field label="Price (USD)" value={priceDollars} onChange={setPriceDollars} type="number" step="0.01" />
      </div>
      <Field label="Description" value={description} onChange={setDescription} />
      <div className="grid grid-cols-3 gap-3">
        <Field label="Extra swipes" value={extraSwipes} onChange={setExtraSwipes} type="number" />
        <Field label="Rewinds" value={rewinds} onChange={setRewinds} type="number" />
        <Field label="Double Downs" value={doubleDowns} onChange={setDoubleDowns} type="number" />
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="flex gap-2">
        <button
          disabled={pending}
          onClick={() =>
            onSave({
              id: product.id,
              name,
              description,
              priceCents: Math.round(parseFloat(priceDollars || "0") * 100),
              extraSwipes: parseInt(extraSwipes || "0", 10),
              rewinds: parseInt(rewinds || "0", 10),
              doubleDowns: parseInt(doubleDowns || "0", 10),
            })
          }
          className="btn-primary"
        >
          {pending ? "Saving..." : "Save"}
        </button>
        <button onClick={onCancel} className="btn-ghost">Cancel</button>
      </div>
    </div>
  );
}

function NewProductForm({ onDone }: { onDone: () => void }) {
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<DbProduct["category"]>("swipes");
  const [priceDollars, setPriceDollars] = useState("0.99");
  const [extraSwipes, setExtraSwipes] = useState("0");
  const [rewinds, setRewinds] = useState("0");
  const [doubleDowns, setDoubleDowns] = useState("0");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="card p-5 space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          setError(null);
          const r = await createProductAction({
            id,
            name,
            description,
            category,
            priceCents: Math.round(parseFloat(priceDollars || "0") * 100),
            extraSwipes: parseInt(extraSwipes || "0", 10),
            rewinds: parseInt(rewinds || "0", 10),
            doubleDowns: parseInt(doubleDowns || "0", 10),
          });
          if (!r.ok) setError(r.error);
          else onDone();
        });
      }}
    >
      <p className="font-display text-lg font-semibold">New product</p>
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="ID (lowercase_underscore)" value={id} onChange={setId} placeholder="extra_swipes_25" />
        <div>
          <label className="label">Category</label>
          <select className="input" value={category} onChange={(e) => setCategory(e.target.value as DbProduct["category"])}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <Field label="Name" value={name} onChange={setName} />
        <Field label="Price (USD)" value={priceDollars} onChange={setPriceDollars} type="number" step="0.01" />
      </div>
      <Field label="Description" value={description} onChange={setDescription} />
      <div className="grid grid-cols-3 gap-3">
        <Field label="Extra swipes" value={extraSwipes} onChange={setExtraSwipes} type="number" />
        <Field label="Rewinds" value={rewinds} onChange={setRewinds} type="number" />
        <Field label="Double Downs" value={doubleDowns} onChange={setDoubleDowns} type="number" />
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="flex gap-2">
        <button disabled={pending} className="btn-primary">{pending ? "Creating..." : "Create"}</button>
        <button type="button" onClick={onDone} className="btn-ghost">Cancel</button>
      </div>
    </form>
  );
}

function Field({
  label, value, onChange, type, step, placeholder,
}: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; step?: string; placeholder?: string;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <input className="input" type={type} step={step} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function creditSummary(p: DbProduct): string {
  const parts: string[] = [];
  if (p.credits.extraSwipes) parts.push(`+${p.credits.extraSwipes} swipes`);
  if (p.credits.rewinds) parts.push(`+${p.credits.rewinds} rewinds`);
  if (p.credits.doubleDowns) parts.push(`+${p.credits.doubleDowns} double downs`);
  if (p.credits.revealNowCredits) parts.push(`+${p.credits.revealNowCredits} reveals`);
  return parts.length ? `Grants: ${parts.join(", ")}` : "No credits granted";
}
