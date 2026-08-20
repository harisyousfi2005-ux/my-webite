import { apiFetch } from "@/lib/api";
import { unwrapEnvelope, type ApiEnvelope } from "@/lib/apiError";
import type {
  ApiCategory,
  ApiProduct,
  ContactMessage,
  Order,
  OrderStatus,
  PaginatedResult,
  User,
} from "@/types";

// --- Products ---

export function adminListProducts(page = 1, limit = 50): Promise<PaginatedResult<ApiProduct>> {
  return apiFetch(`/products/admin/all?page=${page}&limit=${limit}`);
}

export interface ProductInput {
  name: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  sizes: string[];
  colors?: string[];
  stock?: number;
  sku?: string;
  isFeatured?: boolean;
  isActive?: boolean;
  categoryId: string;
}

export function createProduct(input: ProductInput): Promise<ApiProduct> {
  return apiFetch("/products", { method: "POST", body: input });
}

export function updateProduct(id: string, input: Partial<ProductInput>): Promise<ApiProduct> {
  return apiFetch(`/products/${id}`, { method: "PATCH", body: input });
}

export function deleteProduct(id: string): Promise<unknown> {
  return apiFetch(`/products/${id}`, { method: "DELETE" });
}

/**
 * Uses a plain `fetch` (not `apiFetch`) because this sends a FormData body —
 * the browser needs to set its own multipart Content-Type with the correct
 * boundary, which JSON.stringify would break.
 */
export async function uploadProductImages(id: string, files: File[]): Promise<ApiProduct> {
  const formData = new FormData();
  for (const file of files) formData.append("files", file);
  const res = await fetch(`/api/backend/products/${id}/images`, {
    method: "POST",
    body: formData,
    cache: "no-store",
  });
  const json = (await res.json()) as ApiEnvelope<ApiProduct>;
  return unwrapEnvelope(json);
}

export function deleteProductImage(id: string, imageId: string): Promise<unknown> {
  return apiFetch(`/products/${id}/images/${imageId}`, { method: "DELETE" });
}

export function setPrimaryProductImage(id: string, imageId: string): Promise<unknown> {
  return apiFetch(`/products/${id}/images/${imageId}/primary`, { method: "PATCH" });
}

// --- Categories ---

export function adminListCategories(): Promise<ApiCategory[]> {
  return apiFetch("/categories");
}

export interface CategoryInput {
  name: string;
  description?: string;
  imageUrl?: string;
  isActive?: boolean;
}

export function createCategory(input: CategoryInput): Promise<ApiCategory> {
  return apiFetch("/categories", { method: "POST", body: input });
}

export function updateCategory(id: string, input: Partial<CategoryInput>): Promise<ApiCategory> {
  return apiFetch(`/categories/${id}`, { method: "PATCH", body: input });
}

export function deleteCategory(id: string): Promise<unknown> {
  return apiFetch(`/categories/${id}`, { method: "DELETE" });
}

// --- Orders ---

export function adminListOrders(
  page = 1,
  limit = 20,
  status?: OrderStatus,
): Promise<PaginatedResult<Order>> {
  const statusParam = status ? `&status=${status}` : "";
  return apiFetch(`/orders?page=${page}&limit=${limit}${statusParam}`);
}

export function adminGetOrder(id: string): Promise<Order> {
  return apiFetch(`/orders/${id}`);
}

export function updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
  return apiFetch(`/orders/${id}/status`, { method: "PATCH", body: { status } });
}

export function verifyPayment(
  paymentId: string,
  approve: boolean,
  notes?: string,
): Promise<unknown> {
  return apiFetch(`/payments/${paymentId}/verify`, { method: "PATCH", body: { approve, notes } });
}

// --- Contact messages ---

export function adminListContactMessages(
  page = 1,
  limit = 20,
): Promise<PaginatedResult<ContactMessage>> {
  return apiFetch(`/contact?page=${page}&limit=${limit}`);
}

export function markContactMessageRead(id: string): Promise<ContactMessage> {
  return apiFetch(`/contact/${id}/read`, { method: "PATCH" });
}

export function deleteContactMessage(id: string): Promise<unknown> {
  return apiFetch(`/contact/${id}`, { method: "DELETE" });
}

// --- Users ---

export function adminListUsers(page = 1, limit = 50): Promise<PaginatedResult<User>> {
  return apiFetch(`/users?page=${page}&limit=${limit}`);
}

export function activateUser(id: string): Promise<User> {
  return apiFetch(`/users/${id}/activate`, { method: "PATCH" });
}

export function deactivateUser(id: string): Promise<User> {
  return apiFetch(`/users/${id}/deactivate`, { method: "PATCH" });
}

export function updateUserRole(id: string, role: "SUPER_ADMIN" | "USER"): Promise<User> {
  return apiFetch(`/users/${id}/role`, { method: "PATCH", body: { role } });
}
