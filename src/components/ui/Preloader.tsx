"use client";

import { useEffect, useState } from "react";

const DURATION = 1400;
const FADE_OUT = 500;
const BRAND_NAME = "MERIDIAN";

export function Preloader() {
  const [progress, setProgress] = useState(0);
  const [fadingOut, setFadingOut] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("meridian-preloaded")) {
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
        sessionStorage.setItem("meridian-preloaded", "1");
        setFadingOut(true);
        setTimeout(() => setHidden(true), FADE_OUT);
      }
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  if (hidden) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4 bg-ink transition-opacity duration-500 ease-out ${
        fadingOut ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      <span className="flex font-display text-3xl uppercase tracking-tight text-paper">
        {BRAND_NAME.split("").map((letter, index) => (
          <span
            key={index}
            className="animate-fade-up inline-block"
            style={{ animationDelay: `${index * 60}ms` }}
          >
            {letter}
          </span>
        ))}
      </span>
      <span className="font-mono text-sm text-paper/70">
        {String(progress).padStart(2, "0")}%
      </span>
      <div className="flex gap-1.5">
        {[0, 1, 2].map((dot) => (
          <span
            key={dot}
            className="h-1.5 w-1.5 animate-pulse rounded-full bg-clay"
            style={{ animationDelay: `${dot * 150}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
