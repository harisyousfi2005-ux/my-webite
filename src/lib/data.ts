import type { NavLink, SocialLink } from "@/types";

// Absolute path + hash (not a bare "#collection") — these sections only
// exist on the homepage, so the leading "/" is required for the link to
// work from any other page. On the homepage itself it still behaves as a
// normal same-page anchor scroll.
export const NAV_LINKS: NavLink[] = [
  { label: "Collection", href: "/#collection" },
  { label: "Philosophy", href: "/#philosophy" },
  { label: "Contact", href: "/#newsletter" },
];

export const SOCIAL_LINKS: SocialLink[] = [
  { label: "Instagram", href: "https://instagram.com" },
  { label: "Pinterest", href: "https://pinterest.com" },
  { label: "TikTok", href: "https://tiktok.com" },
];
