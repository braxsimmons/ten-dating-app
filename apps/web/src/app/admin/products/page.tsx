import { getAllProducts } from "@/lib/products-db";
import { ProductsClient } from "./ProductsClient";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const products = await getAllProducts();
  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-semibold">Pricing</h1>
      <p className="text-ink-600 max-w-xl">
        Edit prices, copy, and credit amounts. Changes take effect immediately for new checkouts.
        Archive (don't delete) products you've stopped selling so historical purchases keep their
        names.
      </p>
      <ProductsClient products={products} />
    </div>
  );
}
