import type { Metadata } from "next";
import { Geist, Anton } from "next/font/google";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Preloader } from "@/components/ui/Preloader";
import { CartProvider } from "@/lib/CartContext";
import { CartDrawer } from "@/components/cart/CartDrawer";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const anton = Anton({
  variable: "--font-anton",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Meridian — Modest Wear",
  description:
    "Meridian designs abayas, burqas, niqabs, and hijabs for women and girls — full coverage, breathable fabrics, considered cuts.",
  openGraph: {
    title: "Meridian — Modest Wear",
    description:
      "Abayas, burqas, niqabs, and hijabs for women and girls — full coverage, breathable fabrics, considered cuts.",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${anton.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-paper font-sans text-ink">
        <Preloader />
        <CartProvider>
          <Header />
          <main className="flex flex-1 flex-col">{children}</main>
          <Footer />
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}
