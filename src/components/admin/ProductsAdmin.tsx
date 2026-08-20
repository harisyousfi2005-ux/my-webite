"use client";

import { useState } from "react";
import {
  createProduct,
  deleteProduct,
  deleteProductImage,
  setPrimaryProductImage,
  updateProduct,
  uploadProductImages,
  type ProductInput,
} from "@/lib/admin";
import { ApiError } from "@/lib/api";
import type { ApiCategory, ApiProduct } from "@/types";

const inputClass =
  "w-full border border-ink/20 bg-transparent px-3 py-2 text-sm text-ink placeholder:text-ink-soft/50 focus:border-ink focus:outline-none";
const labelClass = "font-mono text-xs uppercase tracking-[0.1em] text-ink-soft";
const buttonClass =
  "border border-ink bg-ink px-4 py-2 font-mono text-xs uppercase tracking-[0.1em] text-paper transition-opacity hover:opacity-80 disabled:opacity-50";
const ghostButtonClass =
  "border border-ink/20 px-4 py-2 font-mono text-xs uppercase tracking-[0.1em] text-ink transition-opacity hover:opacity-70 disabled:opacity-50";

function toCsv(values?: string[]): string {
  return (values ?? []).join(", ");
}

function fromCsv(value: string): string[] {
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

function ProductForm({
  initial,
  categories,
  onSubmit,
  onCancel,
  submitLabel,
}: {
  initial?: ApiProduct;
  categories: ApiCategory[];
  onSubmit: (input: ProductInput) => Promise<void>;
  onCancel?: () => void;
  submitLabel: string;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [price, setPrice] = useState(initial?.price?.toString() ?? "");
  const [compareAtPrice, setCompareAtPrice] = useState(initial?.compareAtPrice?.toString() ?? "");
  const [sizes, setSizes] = useState(toCsv(initial?.sizes));
  const [colors, setColors] = useState(toCsv(initial?.colors));
  const [stock, setStock] = useState(initial?.stock?.toString() ?? "0");
  const [sku, setSku] = useState(initial?.sku ?? "");
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? categories[0]?.id ?? "");
  const [isFeatured, setIsFeatured] = useState(initial?.isFeatured ?? false);
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!name.trim() || !description.trim() || !price || !categoryId || fromCsv(sizes).length === 0) {
      setError("Name, description, price, category, and at least one size are required");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim(),
        price: Number(price),
        compareAtPrice: compareAtPrice ? Number(compareAtPrice) : undefined,
        sizes: fromCsv(sizes),
        colors: fromCsv(colors),
        stock: stock ? Number(stock) : 0,
        sku: sku.trim() || undefined,
        categoryId,
        isFeatured,
        isActive,
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 border border-line p-4">
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1">
          <span className={labelClass}>Name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1">
          <span className={labelClass}>Category</span>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className={inputClass}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="flex flex-col gap-1">
        <span className={labelClass}>Description</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className={inputClass}
        />
      </label>
      <div className="grid grid-cols-3 gap-3">
        <label className="flex flex-col gap-1">
          <span className={labelClass}>Price</span>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className={labelClass}>Compare-at Price</span>
          <input
            type="number"
            value={compareAtPrice}
            onChange={(e) => setCompareAtPrice(e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className={labelClass}>Stock</span>
          <input
            type="number"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            className={inputClass}
          />
        </label>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1">
          <span className={labelClass}>Sizes (comma-separated)</span>
          <input
            value={sizes}
            onChange={(e) => setSizes(e.target.value)}
            placeholder="S, M, L, XL"
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className={labelClass}>Colors (comma-separated, optional)</span>
          <input value={colors} onChange={(e) => setColors(e.target.value)} className={inputClass} />
        </label>
      </div>
      <label className="flex flex-col gap-1">
        <span className={labelClass}>SKU (optional)</span>
        <input value={sku} onChange={(e) => setSku(e.target.value)} className={inputClass} />
      </label>
      <div className="flex gap-6">
        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={isFeatured}
            onChange={(e) => setIsFeatured(e.target.checked)}
            className="accent-ink"
          />
          Featured
        </label>
        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="accent-ink"
          />
          Active — visible to customers
        </label>
      </div>
      {error && <p className="font-mono text-xs text-clay">{error}</p>}
      <div className="flex gap-3">
        <button type="button" onClick={handleSubmit} disabled={busy} className={buttonClass}>
          {submitLabel}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className={ghostButtonClass}>
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

function ProductImagesPanel({
  product,
  onChange,
}: {
  product: ApiProduct;
  onChange: (updated: ApiProduct) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy(true);
    setError("");
    try {
      const updated = await uploadProductImages(product.id, Array.from(files));
      onChange(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteImage(imageId: string) {
    setBusy(true);
    setError("");
    try {
      await deleteProductImage(product.id, imageId);
      onChange({ ...product, images: product.images.filter((img) => img.id !== imageId) });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not delete image");
    } finally {
      setBusy(false);
    }
  }

  async function handleSetPrimary(imageId: string) {
    setBusy(true);
    setError("");
    try {
      await setPrimaryProductImage(product.id, imageId);
      onChange({
        ...product,
        images: product.images.map((img) => ({ ...img, isPrimary: img.id === imageId })),
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not set primary image");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="border-t border-line/60 pt-3">
      <p className={labelClass}>Images</p>
      <div className="mt-2 flex flex-wrap gap-3">
        {product.images.map((img) => (
          <div key={img.id} className="relative w-24">
            {/* eslint-disable-next-line @next/next/no-img-element -- admin tool, arbitrary Cloudinary/local URLs */}
            <img
              src={img.url}
              alt=""
              className={`h-24 w-24 object-cover ${img.isPrimary ? "ring-2 ring-ink" : ""}`}
            />
            <div className="mt-1 flex flex-col gap-1">
              {!img.isPrimary && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => handleSetPrimary(img.id)}
                  className="font-mono text-[10px] uppercase text-ink-soft underline hover:text-ink"
                >
                  Set primary
                </button>
              )}
              <button
                type="button"
                disabled={busy}
                onClick={() => handleDeleteImage(img.id)}
                className="font-mono text-[10px] uppercase text-ink-soft underline hover:text-ink"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
      <label className="mt-3 inline-block cursor-pointer font-mono text-xs uppercase tracking-[0.1em] text-ink underline underline-offset-4">
        {busy ? "Working…" : "+ Upload images"}
        <input
          type="file"
          accept="image/*"
          multiple
          disabled={busy}
          className="hidden"
          onChange={(e) => handleUpload(e.target.files)}
        />
      </label>
      {error && <p className="mt-2 font-mono text-xs text-clay">{error}</p>}
    </div>
  );
}

export function ProductsAdmin({
  initialProducts,
  categories,
}: {
  initialProducts: ApiProduct[];
  categories: ApiCategory[];
}) {
  const [products, setProducts] = useState(initialProducts);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState("");

  async function handleCreate(input: ProductInput) {
    const created = await createProduct(input);
    setProducts((prev) => [created, ...prev]);
    setCreating(false);
    // Image upload needs a real product id (POST /products/:id/images), so
    // it only exists in the edit view — drop straight into it after
    // creating instead of leaving the admin to go hunt for an Edit button.
    setEditingId(created.id);
  }

  async function handleUpdate(id: string, input: ProductInput) {
    const updated = await updateProduct(id, input);
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...updated } : p)));
    setEditingId(null);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this product? This cannot be undone.")) return;
    setDeletingId(id);
    setDeleteError("");
    try {
      await deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : "Could not delete product");
    } finally {
      setDeletingId(null);
    }
  }

  if (categories.length === 0) {
    return (
      <p className="text-sm text-ink-soft">
        Create a category first — products need one to belong to.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {deleteError && <p className="font-mono text-xs text-clay">{deleteError}</p>}

      <div className="flex flex-col gap-3">
        {products.map((product) =>
          editingId === product.id ? (
            <div key={product.id} className="flex flex-col gap-3">
              <ProductForm
                initial={product}
                categories={categories}
                submitLabel="Save"
                onCancel={() => setEditingId(null)}
                onSubmit={(input) => handleUpdate(product.id, input)}
              />
              <ProductImagesPanel
                product={product}
                onChange={(updated) =>
                  setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
                }
              />
            </div>
          ) : (
            <div
              key={product.id}
              className="flex items-center justify-between border border-line p-4"
            >
              <div>
                <p className="text-sm text-ink">
                  {product.name}{" "}
                  {!product.isActive && (
                    <span className="font-mono text-[10px] uppercase text-ink-soft">
                      [ inactive ]
                    </span>
                  )}
                </p>
                <p className="mt-1 text-xs text-ink-soft">
                  {product.category.name} · Rs. {product.price} · Stock {product.stock}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditingId(product.id)}
                  className={ghostButtonClass}
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(product.id)}
                  disabled={deletingId === product.id}
                  className={ghostButtonClass}
                >
                  Delete
                </button>
              </div>
            </div>
          ),
        )}
      </div>

      {creating ? (
        <ProductForm
          categories={categories}
          submitLabel="Create"
          onCancel={() => setCreating(false)}
          onSubmit={handleCreate}
        />
      ) : (
        <button type="button" onClick={() => setCreating(true)} className={buttonClass}>
          + Add Product
        </button>
      )}
    </div>
  );
}
