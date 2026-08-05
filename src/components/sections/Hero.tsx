import { Container } from "@/components/ui/Container";
import { CategoryPill } from "@/components/ui/CategoryPill";

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-line">
      <video
        className="absolute inset-0 h-full w-full object-cover"
        src="/videos/hero-walk.mp4"
        autoPlay
        muted
        loop
        playsInline
      />
      <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/40 to-ink/20" />

      <Container className="relative min-h-[80vh] py-24">
        <div className="flex h-full flex-col justify-center gap-6 animate-fade-up">
          <CategoryPill className="border-clay-soft text-clay-soft">
            Modest wear, made with care
          </CategoryPill>
          <h1 className="max-w-3xl font-display text-6xl uppercase leading-[0.95] text-paper sm:text-8xl lg:text-9xl">
            Tailored
            <br />
            with intention.
          </h1>
          <p className="max-w-md text-base leading-relaxed text-paper/80">
            Abayas, burqas, niqabs, and hijabs cut for full coverage and
            easy movement. Considered pieces for women and girls, worn
            together.
          </p>
          <div className="mt-4">
            <a
              href="#collection"
              className="inline-block transition-opacity hover:opacity-80"
            >
              <CategoryPill className="border-paper bg-paper text-ink">
                View the collection
              </CategoryPill>
            </a>
          </div>
        </div>
      </Container>
    </section>
  );
}
