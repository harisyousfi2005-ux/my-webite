import type { NavLink, Product, SocialLink } from "@/types";

export const NAV_LINKS: NavLink[] = [
  { label: "Collection", href: "#collection" },
  { label: "Philosophy", href: "#philosophy" },
  { label: "Contact", href: "#newsletter" },
];

export const SOCIAL_LINKS: SocialLink[] = [
  { label: "Instagram", href: "https://instagram.com" },
  { label: "Pinterest", href: "https://pinterest.com" },
  { label: "TikTok", href: "https://tiktok.com" },
];

export const PRODUCTS: Product[] = [
  {
    id: "kids-ruffle-abaya",
    name: "Kids' Ruffle Abaya Set",
    category: "Kids",
    price: 45,
    compareAtPrice: 58,
    tone: "navy",
    description: "Tiered ruffle abaya in soft navy with a matching hijab.",
    images: [
      "/products/kids/kids-ruffle-abaya-1.jpg",
      "/products/kids/kids-ruffle-abaya-2.jpg",
    ],
  },
  {
    id: "kids-classic-abaya",
    name: "Kids' Classic Abaya",
    category: "Kids",
    price: 38,
    compareAtPrice: 48,
    tone: "ink",
    description: "Simple, structured black abaya built for everyday wear.",
    images: [
      "/products/kids/kids-classic-abaya-1.jpg",
      "/products/kids/kids-classic-abaya-2.jpg",
    ],
  },
  {
    id: "flowing-niqab-set",
    name: "Flowing Niqab Set",
    category: "Niqab",
    price: 85,
    tone: "ink",
    description: "Full-length flared niqab in breathable black crepe.",
    images: [
      "/products/niqab/flowing-niqab-set-1.jpg",
      "/products/niqab/flowing-niqab-set-2.jpg",
    ],
  },
  {
    id: "navy-trim-burqa",
    name: "Navy Trim Burqa",
    category: "Burqa",
    price: 95,
    compareAtPrice: 120,
    tone: "navy",
    description: "Deep navy burqa with geometric trim detail and gloves.",
    images: [
      "/products/burqa/navy-trim-burqa-1.jpg",
      "/products/burqa/navy-trim-burqa-2.jpg",
    ],
  },
  {
    id: "embroidered-abaya",
    name: "Embroidered Sleeve Abaya",
    category: "Abaya",
    price: 110,
    compareAtPrice: 145,
    tone: "ink",
    description: "Open-front abaya with floral lace embroidery on the sleeves.",
    images: [
      "/products/abaya/embroidered-abaya-1.jpg",
      "/products/abaya/embroidered-abaya-2.jpg",
    ],
  },
  {
    id: "tie-belt-niqab",
    name: "Tie-Belt Niqab",
    category: "Niqab",
    price: 78,
    tone: "ink",
    description: "Relaxed niqab set with a fitted cap and tie-belt waist.",
    images: [
      "/products/niqab/tie-belt-niqab-1.jpg",
      "/products/niqab/tie-belt-niqab-2.jpg",
    ],
  },
];

export const CATEGORIES = Array.from(
  new Map(PRODUCTS.map((product) => [product.category, product])).values(),
).map((product) => ({
  name: product.category,
  image: product.images[0],
  tone: product.tone,
  count: PRODUCTS.filter((p) => p.category === product.category).length,
}));
