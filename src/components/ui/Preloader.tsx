"use client";

import { useEffect, useState } from "react";

const DURATION = 1200;
const WELCOME_HOLD = 1100;
const FADE_OUT = 500;

export function Preloader() {
  const [progress, setProgress] = useState(0);
  const [showWelcome, setShowWelcome] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    // The preloader is a deliberate brand moment, not essential content —
    // skip the artificial delay entirely for anyone who's asked their OS
    // to minimize non-essential motion.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHidden(true);
      return;
    }

    let raf: number;
    const start = performance.now();

    function tick(now: number) {
      const elapsed = now - start;
      const pct = Math.min(100, Math.round((elapsed / DURATION) * 100));
      setProgress(pct);

      if (pct < 100) {
        raf = requestAnimationFrame(tick);
      } else {
        // Force a paint of the "100 / not welcomed yet" state before
        // switching to the welcome message, so it actually transitions in
        // instead of appearing already-visible.
        requestAnimationFrame(() =>
          requestAnimationFrame(() => setShowWelcome(true)),
        );
        setTimeout(() => {
          setFadingOut(true);
          setTimeout(() => setHidden(true), FADE_OUT);
        }, WELCOME_HOLD);
      }
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  if (hidden) return null;

  return (
    <div
      className={`fixed inset-x-0 bottom-0 top-20 z-40 bg-canvas transition-opacity duration-500 ease-out ${
        fadingOut ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      <div className="relative flex h-full flex-col justify-end gap-2 px-6 pb-10 sm:px-12 sm:pb-16">
        <div
          className={`flex flex-col gap-2 transition-opacity duration-300 ease-out ${
            showWelcome ? "pointer-events-none opacity-0" : "opacity-100"
          }`}
        >
          <span className="font-display text-[5rem] leading-none text-ink sm:text-[9rem]">
            {progress}
          </span>
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-ink-soft">
            [ Loading ]
          </span>
        </div>

        <div
          className={`absolute inset-0 flex items-end px-6 pb-10 transition-all duration-500 ease-out sm:px-12 sm:pb-16 ${
            showWelcome
              ? "translate-y-0 opacity-100"
              : "pointer-events-none translate-y-4 opacity-0"
          }`}
        >
          <span className="font-display text-4xl uppercase leading-none text-ink sm:text-6xl">
            Welcome to Meridian
          </span>
        </div>
      </div>
    </div>
  );
}
