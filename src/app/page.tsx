import { Hero } from "@/components/sections/Hero";
import { Categories } from "@/components/sections/Categories";
import { Collection } from "@/components/sections/Collection";
import { Philosophy } from "@/components/sections/Philosophy";
import { Newsletter } from "@/components/sections/Newsletter";

export default function Home() {
  return (
    <>
      <Hero />
      <Categories />
      <Collection />
      <Philosophy />
      <Newsletter />
    </>
  );
}
