import { requireServerUser } from "@/lib/server/session";
import { Container } from "@/components/ui/Container";
import { WishlistGrid } from "@/components/wishlist/WishlistGrid";

export default async function WishlistPage() {
  await requireServerUser("/wishlist");

  return (
    <section className="py-16">
      <Container>
        <h1 className="mb-10 font-display text-4xl uppercase text-ink sm:text-5xl">
          Wishlist
        </h1>
        <WishlistGrid />
      </Container>
    </section>
  );
}
