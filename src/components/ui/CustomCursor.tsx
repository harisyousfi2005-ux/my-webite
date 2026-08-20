"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring, useReducedMotion } from "framer-motion";

const INTERACTIVE_SELECTOR = 'a, button, [role="button"], input, textarea, select';

/**
 * A small ring that trails the pointer, growing over interactive elements.
 * Desktop (fine-pointer) only, and skipped entirely under reduced-motion —
 * this is a decorative flourish, not something anyone should have to see
 * moving if they've asked their OS not to show non-essential motion.
 */
export function CustomCursor() {
  const prefersReducedMotion = useReducedMotion();
  const [enabled, setEnabled] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [visible, setVisible] = useState(false);

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const springX = useSpring(x, { damping: 30, stiffness: 400, mass: 0.4 });
  const springY = useSpring(y, { damping: 30, stiffness: 400, mass: 0.4 });

  useEffect(() => {
    if (prefersReducedMotion) return;
    // matchMedia only exists client-side, so this genuinely can't be known
    // during render/SSR — an effect is the correct place for it.
    const isFinePointer = window.matchMedia("(pointer: fine)").matches;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEnabled(isFinePointer);
  }, [prefersReducedMotion]);

  useEffect(() => {
    if (!enabled) return;

    function handleMove(event: MouseEvent) {
      x.set(event.clientX);
      y.set(event.clientY);
      if (!visible) setVisible(true);
      const target = event.target as HTMLElement;
      setHovering(Boolean(target.closest(INTERACTIVE_SELECTOR)));
    }
    function handleLeave() {
      setVisible(false);
    }

    document.body.setAttribute("data-cursor-zone", "");
    window.addEventListener("mousemove", handleMove);
    document.documentElement.addEventListener("mouseleave", handleLeave);
    return () => {
      document.body.removeAttribute("data-cursor-zone");
      window.removeEventListener("mousemove", handleMove);
      document.documentElement.removeEventListener("mouseleave", handleLeave);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  if (!enabled) return null;

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[100] rounded-full mix-blend-difference"
      style={{
        x: springX,
        y: springY,
        translateX: "-50%",
        translateY: "-50%",
        backgroundColor: "#f7f4ec",
      }}
      animate={{
        width: hovering ? 56 : 14,
        height: hovering ? 56 : 14,
        opacity: visible ? 1 : 0,
      }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
    />
  );
}
