"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import type { Cart, CartLine } from "@/types";

type CartStatus = "loading" | "ready" | "error";

interface CartContextValue {
  items: CartLine[];
  subtotal: number;
  totalCount: number;
  status: CartStatus;
  error: string | null;
  addToCart: (productId: string, size: string, quantity?: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
}

const EMPTY_CART: Cart = { items: [], subtotal: 0, totalItems: 0 };

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { status: authStatus } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [cart, setCart] = useState<Cart>(EMPTY_CART);
  const [status, setStatus] = useState<CartStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (authStatus === "loading") {
      // Syncing local cart status to the external AuthContext's async
      // status — legitimate effect use, not avoidable via render-time
      // computation, since authStatus itself only settles asynchronously.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStatus("loading");
      return;
    }
    if (authStatus === "unauthenticated") {
      setCart(EMPTY_CART);
      setStatus("ready");
      return;
    }
    apiFetch<Cart>("/cart")
      .then((result) => {
        setCart(result);
        setStatus("ready");
      })
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : "Failed to load cart");
        setStatus("error");
      });
  }, [authStatus]);

  function requireAuthOrRedirect(): boolean {
    if (authStatus === "authenticated") return true;
    router.push(`/login?next=${encodeURIComponent(pathname)}`);
    return false;
  }

  async function addToCart(productId: string, size: string, quantity = 1) {
    if (!requireAuthOrRedirect()) return;
    const result = await apiFetch<Cart>("/cart/items", {
      method: "POST",
      body: { productId, size, quantity },
    });
    setCart(result);
    setIsOpen(true);
  }

  async function updateQuantity(itemId: string, quantity: number) {
    if (quantity < 1) {
      await removeFromCart(itemId);
      return;
    }
    const result = await apiFetch<Cart>(`/cart/items/${itemId}`, {
      method: "PATCH",
      body: { quantity },
    });
    setCart(result);
  }

  async function removeFromCart(itemId: string) {
    const result = await apiFetch<Cart>(`/cart/items/${itemId}`, {
      method: "DELETE",
    });
    setCart(result);
  }

  async function clearCart() {
    const result = await apiFetch<Cart>("/cart", { method: "DELETE" });
    setCart(result);
  }

  return (
    <CartContext.Provider
      value={{
        items: cart.items,
        subtotal: cart.subtotal,
        totalCount: cart.totalItems,
        status,
        error,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        isOpen,
        openCart: () => setIsOpen(true),
        closeCart: () => setIsOpen(false),
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
