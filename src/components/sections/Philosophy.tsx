import { Container } from "@/components/ui/Container";

const PRINCIPLES = [
  {
    title: "Full coverage, no compromise",
    body: "Opaque, flowing fabrics with a considered drape — coverage that never feels heavy or stiff.",
  },
  {
    title: "Made for movement",
    body: "Flared cuts and breathable crepe or jersey blends, built for a full day of wear.",
  },
  {
    title: "Family sizing",
    body: "The same fit and fabric care across adult and kids' sizes, so the whole family matches.",
  },
];

export function Philosophy() {
  return (
    <section id="philosophy" className="border-b border-line bg-paper-dim py-24">
      <Container>
        <h2 className="max-w-lg font-display text-4xl uppercase text-ink sm:text-5xl">
          Modest dressing, held to a high standard.
        </h2>

        <div className="mt-16 grid grid-cols-1 gap-12 sm:grid-cols-3">
          {PRINCIPLES.map((principle, index) => (
            <div key={principle.title} className="border-t border-ink pt-4">
              <span className="font-mono text-xs text-clay">
                N°0{index + 1}
              </span>
              <h3 className="mt-3 font-display text-xl uppercase text-ink">
                {principle.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                {principle.body}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
