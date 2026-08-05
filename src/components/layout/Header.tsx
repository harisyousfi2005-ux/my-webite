"use client";

import Link from "next/link";
import { useState } from "react";
import { NAV_LINKS } from "@/lib/data";
import { Container } from "@/components/ui/Container";
import { useCart } from "@/lib/CartContext";

export function Header() {
  const [open, setOpen] = useState(false);
  const { totalCount, openCart } = useCart();

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-paper/90 backdrop-blur">
      <Container className="flex h-20 items-center justify-between">
        <Link
          href="/"
          className="font-display text-2xl uppercase tracking-tight text-ink"
        >
          Meridian
        </Link>

        <div className="flex items-center gap-8">
          <nav className="hidden items-center gap-10 sm:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-xs uppercase tracking-[0.15em] text-ink-soft transition-colors hover:text-ink"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <button
            type="button"
            onClick={openCart}
            aria-label="Open cart"
            className="relative font-mono text-xs uppercase tracking-[0.15em] text-ink transition-opacity hover:opacity-60"
          >
            [ Cart{totalCount > 0 ? ` · ${totalCount}` : ""} ]
          </button>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label="Toggle menu"
            className="flex h-8 w-8 flex-col items-center justify-center gap-1.5 sm:hidden"
          >
            <span
              className={`h-px w-5 bg-ink transition-transform ${open ? "translate-y-[3.5px] rotate-45" : ""}`}
            />
            <span
              className={`h-px w-5 bg-ink transition-transform ${open ? "-translate-y-[3.5px] -rotate-45" : ""}`}
            />
          </button>
        </div>
      </Container>

      {open && (
        <nav className="flex flex-col gap-1 border-t border-line px-6 py-4 sm:hidden">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="py-2 text-xs uppercase tracking-[0.15em] text-ink-soft transition-colors hover:text-ink"
            >
              {link.label}
            </a>
          ))}
        </nav>
      )}
    </header>
  );
}
