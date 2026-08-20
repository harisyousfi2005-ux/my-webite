import { Hero } from "@/components/sections/Hero";
import { Categories } from "@/components/sections/Categories";
import { Collection } from "@/components/sections/Collection";
import { Philosophy } from "@/components/sections/Philosophy";
import { BrandStory } from "@/components/sections/BrandStory";
import { Newsletter } from "@/components/sections/Newsletter";

// Categories/Collection call the backend on every request (no ISR/caching
// layer) — force dynamic rendering so `next build` doesn't try to prerender
// this page against a backend that may not be running at build time.
export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <>
      <Hero />
      <Categories />
      <Collection />
      <Philosophy />
      <BrandStory />
      <Newsletter />
    </>
  );
}
