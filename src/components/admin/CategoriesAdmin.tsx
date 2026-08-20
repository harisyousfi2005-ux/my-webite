"use client";

import { useState } from "react";
import { createCategory, deleteCategory, updateCategory } from "@/lib/admin";
import { ApiError } from "@/lib/api";
import type { ApiCategory } from "@/types";

const inputClass =
  "w-full border border-ink/20 bg-transparent px-3 py-2 text-sm text-ink placeholder:text-ink-soft/50 focus:border-ink focus:outline-none";
const labelClass = "font-mono text-xs uppercase tracking-[0.1em] text-ink-soft";
const buttonClass =
  "border border-ink bg-ink px-4 py-2 font-mono text-xs uppercase tracking-[0.1em] text-paper transition-opacity hover:opacity-80 disabled:opacity-50";
const ghostButtonClass =
  "border border-ink/20 px-4 py-2 font-mono text-xs uppercase tracking-[0.1em] text-ink transition-opacity hover:opacity-70 disabled:opacity-50";

function CategoryForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel,
}: {
  initial?: Partial<ApiCategory>;
  onSubmit: (input: { name: string; description?: string; isActive?: boolean }) => Promise<void>;
  onCancel?: () => void;
  submitLabel: string;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await onSubmit({ name: name.trim(), description: description.trim() || undefined, isActive });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 border border-line p-4">
      <label className="flex flex-col gap-1">
        <span className={labelClass}>Name</span>
        <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
      </label>
      <label className="flex flex-col gap-1">
        <span className={labelClass}>Description</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className={inputClass}
        />
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

export function CategoriesAdmin({ initialCategories }: { initialCategories: ApiCategory[] }) {
  const [categories, setCategories] = useState(initialCategories);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState("");

  async function handleCreate(input: { name: string; description?: string; isActive?: boolean }) {
    const created = await createCategory(input);
    setCategories((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
    setCreating(false);
  }

  async function handleUpdate(
    id: string,
    input: { name: string; description?: string; isActive?: boolean },
  ) {
    const updated = await updateCategory(id, input);
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, ...updated } : c)));
    setEditingId(null);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this category? Products in it will need to be reassigned.")) return;
    setDeletingId(id);
    setDeleteError("");
    try {
      await deleteCategory(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : "Could not delete category");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {deleteError && <p className="font-mono text-xs text-clay">{deleteError}</p>}

      <div className="flex flex-col gap-3">
        {categories.map((category) =>
          editingId === category.id ? (
            <CategoryForm
              key={category.id}
              initial={category}
              submitLabel="Save"
              onCancel={() => setEditingId(null)}
              onSubmit={(input) => handleUpdate(category.id, input)}
            />
          ) : (
            <div
              key={category.id}
              className="flex items-center justify-between border border-line p-4"
            >
              <div>
                <p className="text-sm text-ink">
                  {category.name}{" "}
                  {!category.isActive && (
                    <span className="font-mono text-[10px] uppercase text-ink-soft">
                      [ inactive ]
                    </span>
                  )}
                </p>
                <p className="mt-1 text-xs text-ink-soft">
                  {category._count.products} product{category._count.products === 1 ? "" : "s"}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditingId(category.id)}
                  className={ghostButtonClass}
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(category.id)}
                  disabled={deletingId === category.id}
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
        <CategoryForm submitLabel="Create" onCancel={() => setCreating(false)} onSubmit={handleCreate} />
      ) : (
        <button type="button" onClick={() => setCreating(true)} className={buttonClass}>
          + Add Category
        </button>
      )}
    </div>
  );
}
