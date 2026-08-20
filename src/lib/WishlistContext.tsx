"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import type { WishlistLine } from "@/types";

type WishlistStatus = "loading" | "ready" | "error";

interface WishlistContextValue {
  items: WishlistLine[];
  status: WishlistStatus;
  isWishlisted: (productId: string) => boolean;
  toggleWishlist: (productId: string) => Promise<void>;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { status: authStatus } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [items, setItems] = useState<WishlistLine[]>([]);
  const [status, setStatus] = useState<WishlistStatus>("loading");

  useEffect(() => {
    if (authStatus === "loading") {
      // Syncing local wishlist status to the external AuthContext's async
      // status — legitimate effect use, not avoidable via render-time
      // computation, since authStatus itself only settles asynchronously.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStatus("loading");
      return;
    }
    if (authStatus === "unauthenticated") {
      setItems([]);
      setStatus("ready");
      return;
    }
    apiFetch<WishlistLine[]>("/wishlist")
      .then((result) => {
        setItems(result);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }, [authStatus]);

  function isWishlisted(productId: string): boolean {
    return items.some((item) => item.productId === productId);
  }

  async function toggleWishlist(productId: string) {
    if (authStatus !== "authenticated") {
      router.push(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }

    const existing = items.find((item) => item.productId === productId);
    if (existing) {
      const result = await apiFetch<WishlistLine[]>(`/wishlist/${existing.id}`, {
        method: "DELETE",
      });
      setItems(result);
    } else {
      const result = await apiFetch<WishlistLine[]>("/wishlist", {
        method: "POST",
        body: { productId },
      });
      setItems(result);
    }
  }

  return (
    <WishlistContext.Provider value={{ items, status, isWishlisted, toggleWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
}
