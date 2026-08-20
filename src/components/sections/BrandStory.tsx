import { Container } from "@/components/ui/Container";
import { CategoryPill } from "@/components/ui/CategoryPill";
import { Reveal } from "@/components/ui/Reveal";
import { Parallax } from "@/components/ui/Parallax";

export function BrandStory() {
  return (
    <section className="border-b border-line bg-charcoal py-24 sm:py-32">
      <Container className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center">
        <Reveal y={0} className="relative aspect-[9/16] w-full max-w-md overflow-hidden">
          <Parallax offset={40} className="h-full w-full overflow-hidden">
            <video
              className="h-[118%] w-full -translate-y-[8%] object-cover"
              src="/videos/brand-story.mp4"
              autoPlay
              muted
              loop
              playsInline
            />
          </Parallax>
        </Reveal>

        <Reveal delay={120}>
          <div className="flex flex-col gap-6">
            <CategoryPill className="w-fit border-paper/30 text-paper">
              Our story
            </CategoryPill>
            <h2 className="font-display text-4xl uppercase leading-tight text-paper sm:text-5xl lg:text-6xl">
              Modesty is the design, not an afterthought.
            </h2>
            <p className="max-w-md font-serif text-lg italic leading-relaxed text-paper/75">
              Meridian started with a simple frustration: most modest wear
              treats coverage as a constraint to work around. We build from
              it instead — every cut, seam, and fabric chosen so that full
              coverage and everyday comfort are the same decision, not a
              trade-off.
            </p>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
