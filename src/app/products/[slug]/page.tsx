import { notFound } from "next/navigation";
import Link from "next/link";
import { getProductBySlug } from "@/lib/server/catalog";
import { serializeProduct } from "@/lib/adapters";
import { ApiError } from "@/lib/apiError";
import { Container } from "@/components/ui/Container";
import { ProductGallery } from "@/components/product/ProductGallery";
import { AddToCartButton } from "@/components/product/AddToCartButton";
import { WishlistButton } from "@/components/product/WishlistButton";
import { PriceTag } from "@/components/ui/PriceTag";
import { BrushButton } from "@/components/ui/BrushButton";
import { CategoryPill } from "@/components/ui/CategoryPill";
import { Reveal } from "@/components/ui/Reveal";

export const dynamic = "force-dynamic";

export default async function ProductPage(props: PageProps<"/products/[slug]">) {
  const { slug } = await props.params;

  let raw;
  try {
    raw = await getProductBySlug(slug);
  } catch (err) {
    if (err instanceof ApiError && err.statusCode === 404) notFound();
    throw err;
  }

  const product = serializeProduct(raw);

  return (
    <section className="py-16 sm:py-20">
      <Container>
        <Link
          href="/#collection"
          className="inline-block transition-opacity hover:opacity-80"
        >
          <BrushButton className="px-6 py-3">[ Back to collection ]</BrushButton>
        </Link>

        <div className="mt-8 grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal y={0}>
            <ProductGallery
              images={product.images.map((image) => image.url)}
              name={product.name}
              tone={product.tone}
            />
          </Reveal>

          <Reveal delay={120} className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <CategoryPill>{product.category.name}</CategoryPill>
              <WishlistButton
                productId={product.id}
                className="flex h-9 w-9 items-center justify-center border border-ink text-ink"
              />
            </div>
            <h1 className="font-display text-4xl uppercase leading-[0.95] text-ink sm:text-5xl lg:text-6xl">
              {product.name}
            </h1>
            <PriceTag
              price={product.price}
              compareAtPrice={product.compareAtPrice}
              size="lg"
            />
            <p className="max-w-md font-serif text-lg italic leading-relaxed text-ink-soft">
              {product.description}
            </p>

            <div className="mt-4 max-w-sm">
              <AddToCartButton productId={product.id} sizes={product.sizes} />
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
