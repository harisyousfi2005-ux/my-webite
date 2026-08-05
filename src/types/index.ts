export type Tone = "ink" | "navy" | "clay" | "sand" | "dune";

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  compareAtPrice?: number;
  tone: Tone;
  description: string;
  images: string[];
}

export interface NavLink {
  label: string;
  href: string;
}

export interface SocialLink {
  label: string;
  href: string;
}
