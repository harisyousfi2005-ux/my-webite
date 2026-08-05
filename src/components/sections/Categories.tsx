import Image from "next/image";
import { CATEGORIES } from "@/lib/data";
import { Container } from "@/components/ui/Container";
import { CategoryPill } from "@/components/ui/CategoryPill";
import { Reveal } from "@/components/ui/Reveal";
import type { Tone } from "@/types";

const TONE_CLASSES: Record<Tone, string> = {
  ink: "bg-ink",
  navy: "bg-navy",
  clay: "bg-clay",
  sand: "bg-sand",
  dune: "bg-dune",
};

export function Categories() {
  return (
    <section className="border-b border-line py-16">
      <Container>
        <CategoryPill>Shop by category</CategoryPill>

        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {CATEGORIES.map((category, index) => (
            <Reveal key={category.name} delay={index * 80}>
              <a href="#collection" className="group flex flex-col gap-3">
                <div
                  className={`relative aspect-[3/4] w-full overflow-hidden ${TONE_CLASSES[category.tone]}`}
                >
                  <Image
                    src={category.image}
                    alt={category.name}
                    fill
                    sizes="(min-width: 640px) 25vw, 50vw"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-display text-sm uppercase text-ink">
                    {category.name}
                  </span>
                  <span className="font-mono text-xs text-ink-soft">
                    [ {category.count} ]
                  </span>
                </div>
              </a>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
