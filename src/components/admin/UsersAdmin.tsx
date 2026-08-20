"use client";

import { useState } from "react";
import { activateUser, adminListUsers, deactivateUser, updateUserRole } from "@/lib/admin";
import { ApiError } from "@/lib/api";
import type { PaginatedResult, Role, User } from "@/types";

const selectClass =
  "border border-ink/20 bg-transparent px-2 py-1 text-xs text-ink focus:border-ink focus:outline-none disabled:opacity-40";
const ghostButtonClass =
  "border border-ink/20 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-ink transition-opacity hover:opacity-70 disabled:opacity-50";
const PAGE_SIZE = 50;

function UserRow({
  user,
  isSelf,
  onChange,
}: {
  user: User;
  isSelf: boolean;
  onChange: (updated: User) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleToggleActive() {
    setBusy(true);
    setError("");
    try {
      const updated = user.isActive ? await deactivateUser(user.id) : await activateUser(user.id);
      onChange(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not update account status");
    } finally {
      setBusy(false);
    }
  }

  async function handleRoleChange(role: Role) {
    if (role === user.role) return;
    if (
      !confirm(
        role === "SUPER_ADMIN"
          ? `Grant SUPER_ADMIN access to ${user.email}? They will be able to manage the entire store.`
          : `Remove SUPER_ADMIN access from ${user.email}?`,
      )
    ) {
      return;
    }
    setBusy(true);
    setError("");
    try {
      const updated = await updateUserRole(user.id, role);
      onChange(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not change role");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border border-line p-4">
      <div>
        <p className="text-sm text-ink">
          {user.firstName} {user.lastName} <span className="text-ink-soft">— {user.email}</span>
          {isSelf && <span className="ml-2 font-mono text-[10px] uppercase text-ink-soft">[ you ]</span>}
        </p>
        <p className="mt-1 text-xs text-ink-soft">
          {user.isActive === false ? "Deactivated" : "Active"}
          {/* Explicit locale avoids a hydration mismatch: this Client Component
              is also server-rendered, and toLocaleDateString() with no locale
              arg follows each environment's own default, which can differ
              between the Node server and the browser. */}
          {user.createdAt ? ` · Joined ${new Date(user.createdAt).toLocaleDateString("en-GB")}` : ""}
        </p>
        {error && <p className="mt-1 font-mono text-xs text-clay">{error}</p>}
      </div>
      <div className="flex items-center gap-3">
        <select
          value={user.role}
          disabled={busy || isSelf}
          title={isSelf ? "You cannot change your own role" : undefined}
          onChange={(e) => handleRoleChange(e.target.value as Role)}
          className={selectClass}
        >
          <option value="USER">USER</option>
          <option value="SUPER_ADMIN">SUPER_ADMIN</option>
        </select>
        <button type="button" disabled={busy} onClick={handleToggleActive} className={ghostButtonClass}>
          {user.isActive === false ? "Activate" : "Deactivate"}
        </button>
      </div>
    </div>
  );
}

export function UsersAdmin({
  initialUsers,
  currentUserId,
}: {
  initialUsers: PaginatedResult<User>;
  currentUserId: string;
}) {
  const [result, setResult] = useState(initialUsers);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  async function loadPage(nextPage: number) {
    setLoading(true);
    try {
      const next = await adminListUsers(nextPage, PAGE_SIZE);
      setResult(next);
      setPage(nextPage);
    } finally {
      setLoading(false);
    }
  }

  function handleChange(updated: User) {
    setResult((prev) => ({
      ...prev,
      items: prev.items.map((u) => (u.id === updated.id ? { ...u, ...updated } : u)),
    }));
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        {result.items.map((user) => (
          <UserRow key={user.id} user={user} isSelf={user.id === currentUserId} onChange={handleChange} />
        ))}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={loading || page <= 1}
          onClick={() => loadPage(page - 1)}
          className={ghostButtonClass}
        >
          Previous
        </button>
        <span className="font-mono text-xs text-ink-soft">
          Page {result.meta.page} of {result.meta.totalPages}
        </span>
        <button
          type="button"
          disabled={loading || page >= result.meta.totalPages}
          onClick={() => loadPage(page + 1)}
          className={ghostButtonClass}
        >
          Next
        </button>
      </div>
    </div>
  );
}
