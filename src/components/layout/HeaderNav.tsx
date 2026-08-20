"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
} from "framer-motion";
import { Container } from "@/components/ui/Container";
import { useCart } from "@/lib/CartContext";
import { useAuth } from "@/lib/AuthContext";
import type { CategoryDisplay } from "@/types";

const EASE = [0.16, 1, 0.3, 1] as const;

function NavLink({ href, children }: { href: string; children: string }) {
  return (
    <Link
      href={href}
      className="group relative text-xs uppercase tracking-[0.15em] text-paper/70 transition-colors hover:text-paper"
    >
      {children}
      <span className="absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 bg-paper transition-transform duration-300 ease-out group-hover:scale-x-100" />
    </Link>
  );
}

export function HeaderNav({ categories }: { categories: CategoryDisplay[] }) {
  const [open, setOpen] = useState(false);
  const [collectionOpen, setCollectionOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { totalCount, openCart } = useCart();
  const { user, status } = useAuth();
  const prefersReducedMotion = useReducedMotion();
  const collectionRef = useRef<HTMLDivElement>(null);
  const [supportsHover, setSupportsHover] = useState(false);

  // Touch devices fire a "phantom" mouseenter (compatibility mouse events)
  // immediately before the click on a tap. If hover handlers were always
  // active, that phantom mouseenter would set collectionOpen(true) right
  // before the click's toggle flips it back to false in the same gesture —
  // net result, the dropdown never visibly opens on tap. Only wiring up
  // hover-to-open on devices that genuinely support hover (a real mouse)
  // avoids that race; touch devices rely solely on the click/tap toggle.
  useEffect(() => {
    const query = window.matchMedia("(hover: hover) and (pointer: fine)");
    // Reading a browser-only API (matchMedia) that isn't available during
    // SSR — there's no way to know this before the effect runs on the
    // client, so a synchronous setState here is unavoidable, not a real
    // "derive state during render" smell the lint rule is meant to catch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSupportsHover(query.matches);
    const handleChange = (event: MediaQueryListEvent) => setSupportsHover(event.matches);
    query.addEventListener("change", handleChange);
    return () => query.removeEventListener("change", handleChange);
  }, []);

  // Click-to-toggle needs an explicit close mechanism (hover has none) —
  // close on an outside click/tap or Escape so it doesn't stay stuck open.
  useEffect(() => {
    if (!collectionOpen) return;
    function handlePointerDown(event: PointerEvent) {
      if (!collectionRef.current?.contains(event.target as Node)) {
        setCollectionOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setCollectionOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [collectionOpen]);
  // Text on a translated/GPU-composited layer can render with visible
  // colour fringing on large bold display type in some environments — the
  // stagger below only fades opacity (no transform) to sidestep that, and
  // the whole entrance/exit animation is skipped outright under
  // prefers-reduced-motion.
  const linkVariants = prefersReducedMotion
    ? { hidden: { opacity: 1 }, visible: { opacity: 1 } }
    : { hidden: { opacity: 0 }, visible: { opacity: 1 } };
  const linkTransition = prefersReducedMotion
    ? { duration: 0 }
    : { duration: 0.4, ease: EASE };

  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 24);
  });

  return (
    <header className="sticky top-0 z-50 border-b border-paper/10 bg-ink">
      <Container
        className={`flex items-center justify-between transition-[height] duration-300 ease-out ${
          scrolled ? "h-16" : "h-20"
        }`}
      >
        <Link
          href="/"
          className="font-serif text-2xl italic tracking-tight text-paper transition-opacity hover:opacity-80"
        >
          Meridian
        </Link>

        <div className="flex items-center gap-8">
          <nav className="hidden items-center gap-10 sm:flex">
            <div
              ref={collectionRef}
              className="relative"
              onMouseEnter={supportsHover ? () => setCollectionOpen(true) : undefined}
              onMouseLeave={supportsHover ? () => setCollectionOpen(false) : undefined}
            >
              <button
                type="button"
                aria-haspopup="true"
                aria-expanded={collectionOpen}
                // Deliberately always opens rather than toggling closed: a
                // real click (mouse or touch) always fires a genuine
                // mouseenter/hover-open right before the click event, in the
                // same gesture. A toggle would flip whatever that mouseenter
                // just set, closing the menu the instant it opens. Closing
                // is handled separately — outside click, Escape, mouseleave,
                // or picking a category — so this never needs to close itself.
                onClick={() => setCollectionOpen(true)}
                className="flex items-center gap-1.5 text-xs uppercase tracking-[0.15em] text-paper/70 transition-colors hover:text-paper"
              >
                Collection
                <svg
                  viewBox="0 0 10 6"
                  className={`h-2 w-2.5 transition-transform ${collectionOpen ? "rotate-180" : ""}`}
                  fill="none"
                >
                  <path
                    d="M1 1l4 4 4-4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              <AnimatePresence>
                {collectionOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2, ease: EASE }}
                    className="absolute left-1/2 top-full w-48 -translate-x-1/2 border border-paper/10 bg-ink py-2"
                  >
                    <Link
                      href="/#collection"
                      onClick={() => setCollectionOpen(false)}
                      className="block px-4 py-2 text-xs uppercase tracking-[0.1em] text-paper/70 transition-colors hover:bg-paper/5 hover:text-paper"
                    >
                      All
                    </Link>
                    {categories.map((category) => (
                      <Link
                        key={category.id}
                        href="/#collection"
                        onClick={() => setCollectionOpen(false)}
                        className="block px-4 py-2 text-xs uppercase tracking-[0.1em] text-paper/70 transition-colors hover:bg-paper/5 hover:text-paper"
                      >
                        {category.name}
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <NavLink href="/#philosophy">Philosophy</NavLink>
            <NavLink href="/#newsletter">Contact</NavLink>
            {status === "authenticated" ? (
              <Link
                href="/account"
                className="text-xs uppercase tracking-[0.15em] text-paper/70 transition-colors hover:text-paper"
              >
                {user?.firstName ?? "Account"}
              </Link>
            ) : status === "unauthenticated" ? (
              <Link
                href="/login"
                className="text-xs uppercase tracking-[0.15em] text-paper/70 transition-colors hover:text-paper"
              >
                Log In
              </Link>
            ) : null}
          </nav>

          <Link
            href="/wishlist"
            aria-label="View wishlist"
            className="text-paper transition-transform hover:scale-110"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
              <path
                d="M12 20.5s-7.5-4.6-10-9.3C.4 7.9 2 4.5 5.4 4c2-.3 3.9.7 5 2.4a5.6 5.6 0 0 1 5-2.4c3.4.5 5 3.9 3.4 7.2-2.5 4.7-10 9.3-10 9.3z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>

          <button
            type="button"
            onClick={openCart}
            aria-label="Open cart"
            className="relative text-paper transition-transform hover:scale-110"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
              <path
                d="M3 4h2l2.4 12.4a2 2 0 0 0 2 1.6h8.6a2 2 0 0 0 2-1.6L22 8H6"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="10" cy="21" r="1.4" fill="currentColor" />
              <circle cx="18" cy="21" r="1.4" fill="currentColor" />
            </svg>
            <AnimatePresence>
              {totalCount > 0 && (
                <motion.span
                  key={totalCount}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={{ duration: 0.25, ease: EASE }}
                  className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-clay font-mono text-[10px] text-paper"
                >
                  {totalCount}
                </motion.span>
              )}
            </AnimatePresence>
          </button>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label="Toggle menu"
            className="flex h-8 w-8 flex-col items-center justify-center gap-1.5 sm:hidden"
          >
            <span
              className={`h-px w-5 bg-paper transition-transform duration-300 ${open ? "translate-y-[3.5px] rotate-45" : ""}`}
            />
            <span
              className={`h-px w-5 bg-paper transition-transform duration-300 ${open ? "-translate-y-[3.5px] -rotate-45" : ""}`}
            />
          </button>
        </div>
      </Container>

      <AnimatePresence>
        {open && (
          <motion.nav
            initial={prefersReducedMotion ? false : { clipPath: "inset(0 0 100% 0)" }}
            animate={{ clipPath: "inset(0 0 0% 0)" }}
            exit={prefersReducedMotion ? undefined : { clipPath: "inset(0 0 100% 0)" }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.5, ease: EASE }}
            style={{ top: scrolled ? 64 : 80 }}
            className="fixed inset-x-0 bottom-0 z-40 flex flex-col justify-between overflow-y-auto bg-ink px-6 pb-10 pt-6 sm:hidden"
          >
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                visible: {
                  transition: prefersReducedMotion
                    ? {}
                    : { staggerChildren: 0.06, delayChildren: 0.1 },
                },
              }}
              className="flex flex-col gap-1"
            >
              <span className="mb-2 font-mono text-[10px] uppercase tracking-wider text-paper/40">
                Collection
              </span>
              {categories.map((category) => (
                <motion.a
                  key={category.id}
                  href="/#collection"
                  onClick={() => setOpen(false)}
                  variants={linkVariants}
                  transition={linkTransition}
                  className="border-b border-paper/10 py-3 font-display text-2xl uppercase text-paper transition-opacity hover:opacity-70"
                >
                  {category.name}
                </motion.a>
              ))}
              <motion.a
                href="/#philosophy"
                onClick={() => setOpen(false)}
                variants={linkVariants}
                transition={linkTransition}
                className="mt-4 border-b border-paper/10 py-3 font-display text-2xl uppercase text-paper transition-opacity hover:opacity-70"
              >
                Philosophy
              </motion.a>
              <motion.a
                href="/#newsletter"
                onClick={() => setOpen(false)}
                variants={linkVariants}
                transition={linkTransition}
                className="border-b border-paper/10 py-3 font-display text-2xl uppercase text-paper transition-opacity hover:opacity-70"
              >
                Contact
              </motion.a>
              {status === "authenticated" ? (
                <motion.div
                  variants={linkVariants}
                  transition={linkTransition}
                >
                  <Link
                    href="/account"
                    onClick={() => setOpen(false)}
                    className="block border-b border-paper/10 py-3 font-display text-2xl uppercase text-paper transition-opacity hover:opacity-70"
                  >
                    {user?.firstName ?? "Account"}
                  </Link>
                </motion.div>
              ) : status === "unauthenticated" ? (
                <motion.div
                  variants={linkVariants}
                  transition={linkTransition}
                >
                  <Link
                    href="/login"
                    onClick={() => setOpen(false)}
                    className="block border-b border-paper/10 py-3 font-display text-2xl uppercase text-paper transition-opacity hover:opacity-70"
                  >
                    Log In
                  </Link>
                </motion.div>
              ) : null}
            </motion.div>

            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-paper/40">
              Meridian — Modest Wear
            </p>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
