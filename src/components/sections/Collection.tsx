import { getProducts } from "@/lib/server/catalog";
import { serializeProduct } from "@/lib/adapters";
import { Container } from "@/components/ui/Container";
import { ProductCard } from "@/components/ui/ProductCard";
import { Reveal } from "@/components/ui/Reveal";

export async function Collection() {
  const { items } = await getProducts({ limit: 24, sortBy: "newest" });
  const products = items.map(serializeProduct);

  return (
    <section id="collection" className="border-b border-line py-24 sm:py-32">
      <Container>
        <Reveal>
          <span className="font-serif text-lg italic text-dune">Selected pieces</span>
          <h2 className="mt-2 font-display text-4xl uppercase text-ink sm:text-5xl lg:text-6xl">
            The Collection
          </h2>
        </Reveal>

        {products.length === 0 ? (
          <p className="mt-14 text-sm text-ink-soft">
            No products available yet — check back soon.
          </p>
        ) : (
          <div className="mt-14 grid grid-cols-1 gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product, index) => (
              <Reveal
                key={product.id}
                delay={(index % 3) * 80}
                className={
                  // The lead item reads as an editorial feature tile —
                  // everything else falls back to the regular grid rhythm.
                  // Column-span only (no row-span) so it stays predictable
                  // in an implicit auto-rows grid instead of risking uneven
                  // row heights against its neighbors.
                  index === 0 ? "sm:col-span-2" : undefined
                }
              >
                <ProductCard product={product} />
              </Reveal>
            ))}
          </div>
        )}
      </Container>
    </section>
  );
}
