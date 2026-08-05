import { notFound } from "next/navigation";
import Link from "next/link";
import { PRODUCTS } from "@/lib/data";
import { Container } from "@/components/ui/Container";
import { ProductGallery } from "@/components/product/ProductGallery";
import { AddToCartButton } from "@/components/product/AddToCartButton";
import { PriceTag } from "@/components/ui/PriceTag";
import { BrushButton } from "@/components/ui/BrushButton";
import { CategoryPill } from "@/components/ui/CategoryPill";

export function generateStaticParams() {
  return PRODUCTS.map((product) => ({ id: product.id }));
}

export default async function ProductPage(props: PageProps<"/products/[id]">) {
  const { id } = await props.params;
  const product = PRODUCTS.find((p) => p.id === id);

  if (!product) {
    notFound();
  }

  return (
    <section className="py-16">
      <Container>
        <Link
          href="/#collection"
          className="inline-block transition-opacity hover:opacity-80"
        >
          <BrushButton className="px-6 py-3">[ Back to collection ]</BrushButton>
        </Link>

        <div className="mt-8 grid grid-cols-1 gap-12 lg:grid-cols-2">
          <ProductGallery
            images={product.images}
            name={product.name}
            tone={product.tone}
          />

          <div className="flex flex-col gap-6">
            <CategoryPill>{product.category}</CategoryPill>
            <h1 className="font-display text-4xl uppercase leading-tight text-ink sm:text-5xl">
              {product.name}
            </h1>
            <PriceTag
              price={product.price}
              compareAtPrice={product.compareAtPrice}
              size="lg"
            />
            <p className="max-w-md text-sm leading-relaxed text-ink-soft">
              {product.description}
            </p>

            <div className="mt-4 max-w-sm">
              <AddToCartButton productId={product.id} />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
