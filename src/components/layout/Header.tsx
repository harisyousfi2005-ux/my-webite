import { getCategories } from "@/lib/server/catalog";
import { serializeCategory } from "@/lib/adapters";
import { HeaderNav } from "@/components/layout/HeaderNav";
import type { CategoryDisplay } from "@/types";

export async function Header() {
  // The header renders on every page, including Next's built-in error
  // pages — a backend hiccup shouldn't take the whole site's chrome down
  // with it, so fall back to an empty category list instead of throwing.
  let categories: CategoryDisplay[];
  try {
    categories = (await getCategories()).map(serializeCategory);
  } catch {
    categories = [];
  }
  return <HeaderNav categories={categories} />;
}
