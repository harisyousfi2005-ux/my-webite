import "server-only";
import { backendFetch } from "@/lib/server/backendFetch";
import type { ApiCategory, ApiProduct, PaginatedResult } from "@/types";

export interface ProductQuery {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  isFeatured?: boolean;
  sortBy?: "newest" | "price_asc" | "price_desc";
}

function toQueryString(params: object): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params as Record<string, unknown>)) {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, String(value));
    }
  }
  const query = search.toString();
  return query ? `?${query}` : "";
}

export function getCategories(): Promise<ApiCategory[]> {
  return backendFetch<ApiCategory[]>("/categories");
}

export function getCategoryBySlug(slug: string): Promise<ApiCategory> {
  return backendFetch<ApiCategory>(`/categories/slug/${encodeURIComponent(slug)}`);
}

export function getProducts(
  params: ProductQuery = {},
): Promise<PaginatedResult<ApiProduct>> {
  return backendFetch<PaginatedResult<ApiProduct>>(
    `/products${toQueryString(params)}`,
  );
}

export function getProductBySlug(slug: string): Promise<ApiProduct> {
  return backendFetch<ApiProduct>(`/products/slug/${encodeURIComponent(slug)}`);
}
