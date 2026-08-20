import { authedBackendFetch } from "@/lib/server/session";
import { ProductsAdmin } from "@/components/admin/ProductsAdmin";
import type { ApiCategory, ApiProduct, PaginatedResult } from "@/types";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const [products, categories] = await Promise.all([
    authedBackendFetch<PaginatedResult<ApiProduct>>("/products/admin/all?limit=100"),
    authedBackendFetch<ApiCategory[]>("/categories"),
  ]);

  return (
    <div>
      <h2 className="font-display text-2xl uppercase text-ink">Products</h2>
      <div className="mt-8">
        <ProductsAdmin initialProducts={products.items} categories={categories} />
      </div>
    </div>
  );
}
