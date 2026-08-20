import Image from "next/image";
import { getCategories } from "@/lib/server/catalog";
import { serializeCategory } from "@/lib/adapters";
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

export async function Categories() {
  const categories = (await getCategories()).map(serializeCategory);

  if (categories.length === 0) return null;

  return (
    <section className="border-b border-line py-16 sm:py-20">
      <Container>
        <Reveal>
          <CategoryPill>Shop by category</CategoryPill>
        </Reveal>

        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6">
          {categories.map((category, index) => (
            <Reveal key={category.id} delay={index * 80}>
              <a
                href="#collection"
                data-cursor-zone
                className="group flex flex-col gap-3"
              >
                <div
                  className={`relative aspect-[3/4] w-full overflow-hidden ${TONE_CLASSES[category.tone]}`}
                >
                  <Image
                    src={category.image}
                    alt={category.name}
                    fill
                    sizes="(min-width: 640px) 25vw, 50vw"
                    className="object-cover transition-transform duration-[900ms] ease-out group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-ink/0 transition-colors duration-500 group-hover:bg-ink/10" />
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
