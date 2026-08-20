"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";

export function LogoutButton() {
  const { logout } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.push("/");
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="font-mono text-xs uppercase tracking-[0.1em] text-ink-soft underline underline-offset-4 transition-colors hover:text-ink"
    >
      [ Log Out ]
    </button>
  );
}
