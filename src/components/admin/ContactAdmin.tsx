"use client";

import { useState } from "react";
import { adminListContactMessages, deleteContactMessage, markContactMessageRead } from "@/lib/admin";
import { ApiError } from "@/lib/api";
import type { ContactMessage, PaginatedResult } from "@/types";

const ghostButtonClass =
  "border border-ink/20 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-ink transition-opacity hover:opacity-70 disabled:opacity-50";

function MessageRow({
  message,
  onChange,
}: {
  message: ContactMessage;
  onChange: (updated: ContactMessage | null) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleMarkRead() {
    setBusy(true);
    setError("");
    try {
      const updated = await markContactMessageRead(message.id);
      onChange(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not mark as read");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this message?")) return;
    setBusy(true);
    setError("");
    try {
      await deleteContactMessage(message.id);
      onChange(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not delete message");
      setBusy(false);
    }
  }

  return (
    <div className={`border border-line p-4 ${message.isRead ? "" : "border-ink"}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-ink">
            {message.name} <span className="text-ink-soft">— {message.email}</span>
            {!message.isRead && (
              <span className="ml-2 font-mono text-[10px] uppercase text-clay">[ unread ]</span>
            )}
          </p>
          {message.subject && <p className="mt-1 text-xs text-ink-soft">{message.subject}</p>}
        </div>
        <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-soft">
          {/* Explicit locale avoids a hydration mismatch between the
              server-rendered date and the browser's own default locale. */}
          {new Date(message.createdAt).toLocaleDateString("en-GB")}
        </p>
      </div>
      <p className="mt-3 text-sm text-ink-soft">{message.message}</p>
      {error && <p className="mt-2 font-mono text-xs text-clay">{error}</p>}
      <div className="mt-3 flex gap-3">
        {!message.isRead && (
          <button type="button" disabled={busy} onClick={handleMarkRead} className={ghostButtonClass}>
            Mark Read
          </button>
        )}
        <button type="button" disabled={busy} onClick={handleDelete} className={ghostButtonClass}>
          Delete
        </button>
      </div>
    </div>
  );
}

export function ContactAdmin({ initialMessages }: { initialMessages: PaginatedResult<ContactMessage> }) {
  const [result, setResult] = useState(initialMessages);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  async function loadPage(nextPage: number) {
    setLoading(true);
    try {
      const next = await adminListContactMessages(nextPage, 20);
      setResult(next);
      setPage(nextPage);
    } finally {
      setLoading(false);
    }
  }

  function handleChange(id: string, updated: ContactMessage | null) {
    setResult((prev) => ({
      ...prev,
      items: updated
        ? prev.items.map((m) => (m.id === id ? updated : m))
        : prev.items.filter((m) => m.id !== id),
    }));
  }

  return (
    <div className="flex flex-col gap-4">
      {result.items.length === 0 ? (
        <p className="text-sm text-ink-soft">No messages.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {result.items.map((message) => (
            <MessageRow
              key={message.id}
              message={message}
              onChange={(updated) => handleChange(message.id, updated)}
            />
          ))}
        </div>
      )}

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
