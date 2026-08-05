import { PRODUCTS } from "@/lib/data";
import { Container } from "@/components/ui/Container";
import { ProductCard } from "@/components/ui/ProductCard";
import { Reveal } from "@/components/ui/Reveal";

export function Collection() {
  return (
    <section id="collection" className="border-b border-line py-24">
      <Container>
        <h2 className="mb-14 font-display text-4xl uppercase text-ink sm:text-5xl">
          The Collection
        </h2>

        <div className="grid grid-cols-1 gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {PRODUCTS.map((product, index) => (
            <Reveal key={product.id} delay={(index % 3) * 80}>
              <ProductCard product={product} index={index} />
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
