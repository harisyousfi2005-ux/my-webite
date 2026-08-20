import { toneForCategory } from "@/lib/toneMap";
import type { ApiCategory, ApiProduct, CategoryDisplay, Product } from "@/types";

// Categories have no image of their own until one is uploaded via the admin
// API, so fall back to one of the existing local placeholder photos rather
// than pointing <Image> at a file that doesn't exist.
const CATEGORY_IMAGE_MAP: Record<string, string> = {
  abaya: "/products/abaya/embroidered-abaya-2.jpg",
  burqa: "/products/burqa/navy-trim-burqa-2.jpg",
  niqab: "/products/niqab/flowing-niqab-set-2.jpg",
  kids: "/products/kids/kids-ruffle-abaya-2.jpg",
};
const DEFAULT_CATEGORY_IMAGE = "/products/abaya/embroidered-abaya-2.jpg";

/** Maps a raw backend product into the shape the UI components expect. */
export function serializeProduct(raw: ApiProduct): Product {
  const images = [...raw.images].sort((a, b) => a.position - b.position);
  const primaryImage =
    images.find((image) => image.isPrimary)?.url ?? images[0]?.url ?? "";
  const flatImage = images[1]?.url ?? primaryImage;

  return {
    ...raw,
    images,
    compareAtPrice: raw.compareAtPrice ?? undefined,
    tone: toneForCategory(raw.category.slug),
    primaryImage,
    flatImage,
  };
}

export function serializeCategory(raw: ApiCategory): CategoryDisplay {
  return {
    id: raw.id,
    name: raw.name,
    slug: raw.slug,
    description: raw.description,
    tone: toneForCategory(raw.slug),
    image:
      raw.imageUrl ?? CATEGORY_IMAGE_MAP[raw.slug] ?? DEFAULT_CATEGORY_IMAGE,
    count: raw._count.products,
  };
}
