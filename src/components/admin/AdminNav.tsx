"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/contact", label: "Contact" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/payment-settings", label: "Payment Settings" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-x-6 gap-y-2 border-b border-line pb-4">
      {LINKS.map((link) => {
        const active =
          link.href === "/admin" ? pathname === "/admin" : pathname?.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`font-mono text-xs uppercase tracking-[0.1em] transition-opacity hover:opacity-70 ${
              active ? "text-ink underline underline-offset-4" : "text-ink-soft"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
