"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { CategoryPill } from "@/components/ui/CategoryPill";
import { Parallax } from "@/components/ui/Parallax";

const EASE = [0.16, 1, 0.3, 1] as const;

const lineVariants = {
  hidden: { y: "110%" },
  visible: { y: "0%" },
};

const fadeVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

export function Hero() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section className="relative h-[100dvh] min-h-[560px] overflow-hidden border-b border-line">
      <Parallax offset={prefersReducedMotion ? 0 : 70} className="absolute inset-0 overflow-hidden">
        <video
          className="h-[116%] w-full -translate-y-[8%] object-cover"
          src="/videos/hero-walk.mp4"
          autoPlay
          muted
          loop
          playsInline
        />
      </Parallax>
      <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/45 to-ink/15" />

      <Container className="relative flex h-full flex-col justify-center gap-6">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.12, delayChildren: 0.15 } } }}
          className="flex flex-col gap-6"
        >
          <motion.div variants={fadeVariants} transition={{ duration: 0.7, ease: EASE }}>
            <CategoryPill className="border-dune-soft text-dune-soft">
              Modest wear, made with care
            </CategoryPill>
          </motion.div>

          <h1 className="max-w-3xl font-display text-6xl uppercase leading-[0.92] text-paper sm:text-8xl lg:text-[8.5rem]">
            {["Tailored", "with intention."].map((line) => (
              <span key={line} className="block overflow-hidden">
                <motion.span
                  className="block"
                  variants={lineVariants}
                  transition={{ duration: 0.9, ease: EASE }}
                >
                  {line}
                </motion.span>
              </span>
            ))}
          </h1>

          <motion.p
            variants={fadeVariants}
            transition={{ duration: 0.7, ease: EASE }}
            className="max-w-md font-serif text-lg italic leading-relaxed text-paper/85 sm:text-xl"
          >
            Abayas, burqas, niqabs, and hijabs cut for full coverage and easy
            movement. Considered pieces for women and girls, worn together.
          </motion.p>

          <motion.div variants={fadeVariants} transition={{ duration: 0.7, ease: EASE }} className="mt-4">
            <a href="#collection" className="inline-block transition-opacity hover:opacity-80">
              <CategoryPill className="border-paper bg-paper text-ink">
                View the collection
              </CategoryPill>
            </a>
          </motion.div>
        </motion.div>
      </Container>

      {!prefersReducedMotion && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4, duration: 0.8 }}
          className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2"
        >
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-paper/60">
            Scroll
          </span>
          <motion.span
            className="h-8 w-px bg-paper/40"
            animate={{ scaleY: [0.3, 1, 0.3] }}
            style={{ transformOrigin: "top" }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>
      )}
    </section>
  );
}
