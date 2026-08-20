"use client";

import { useState, type FormEvent } from "react";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email) return;
    setSubmitted(true);
    setEmail("");
  }

  return (
    <section id="newsletter" className="py-24 sm:py-32">
      <Container className="flex flex-col items-start gap-8 sm:flex-row sm:items-end sm:justify-between">
        <Reveal className="max-w-sm">
          <h2 className="font-display text-4xl uppercase text-ink sm:text-5xl">
            Stay close to the collection.
          </h2>
          <p className="mt-3 font-serif text-lg italic leading-relaxed text-ink-soft">
            New releases, restocks, and the occasional note on materials.
            No noise, unsubscribe any time.
          </p>
        </Reveal>

        <Reveal delay={100} className="w-full max-w-sm">
          <form
            onSubmit={handleSubmit}
            className="flex w-full flex-col gap-3 sm:flex-row sm:gap-0"
          >
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@email.com"
              aria-label="Email address"
              className="w-full border-b border-ink bg-transparent px-1 py-3 text-sm text-ink placeholder:text-ink-soft/60 transition-colors focus:border-clay focus:outline-none"
            />
            <button
              type="submit"
              className="whitespace-nowrap px-5 py-3 font-mono text-sm uppercase tracking-[0.1em] text-ink transition-opacity hover:opacity-60"
            >
              [ {submitted ? "Subscribed" : "Subscribe"} ]
            </button>
          </form>
        </Reveal>
      </Container>
    </section>
  );
}
