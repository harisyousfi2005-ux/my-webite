import { authedBackendFetch } from "@/lib/server/session";
import { CategoriesAdmin } from "@/components/admin/CategoriesAdmin";
import type { ApiCategory } from "@/types";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const categories = await authedBackendFetch<ApiCategory[]>("/categories");

  return (
    <div>
      <h2 className="font-display text-2xl uppercase text-ink">Categories</h2>
      <div className="mt-8">
        <CategoriesAdmin initialCategories={categories} />
      </div>
    </div>
  );
}
