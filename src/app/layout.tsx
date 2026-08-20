import type { Metadata } from "next";
import { Geist, Anton, Cormorant_Garamond } from "next/font/google";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Preloader } from "@/components/ui/Preloader";
import { CustomCursor } from "@/components/ui/CustomCursor";
import { PageTransition } from "@/components/ui/PageTransition";
import { AuthProvider } from "@/lib/AuthContext";
import { CartProvider } from "@/lib/CartContext";
import { WishlistProvider } from "@/lib/WishlistContext";
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

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
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
      className={`${geistSans.variable} ${anton.variable} ${cormorant.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-paper font-sans text-ink">
        <Preloader />
        <CustomCursor />
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <Header />
              <main className="flex flex-1 flex-col">
                <PageTransition>{children}</PageTransition>
              </main>
              <Footer />
              <CartDrawer />
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
