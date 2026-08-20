import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_COOKIE_NAME } from "@/lib/authCookie";
import { backendFetch } from "@/lib/server/backendFetch";
import type { User } from "@/types";

async function getToken(): Promise<string | undefined> {
  return (await cookies()).get(AUTH_COOKIE_NAME)?.value;
}

/** Returns the current user for use in Server Components, or null if signed out. */
export async function getServerUser(): Promise<User | null> {
  const token = await getToken();
  if (!token) return null;

  try {
    return await backendFetch<User>("/users/me", { token });
  } catch {
    return null;
  }
}

/** Like getServerUser, but redirects to /login?next=... when signed out. */
export async function requireServerUser(nextPath: string): Promise<User> {
  const user = await getServerUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }
  return user;
}

/** Like requireServerUser, but also redirects non-admins away (to the homepage). */
export async function requireAdmin(nextPath: string): Promise<User> {
  const user = await requireServerUser(nextPath);
  if (user.role !== "SUPER_ADMIN") {
    redirect("/");
  }
  return user;
}

/** Authenticated direct-to-backend fetch for Server Components; throws if signed out. */
export async function authedBackendFetch<T>(
  path: string,
  init?: { method?: "GET" | "POST" | "PATCH" | "DELETE"; body?: unknown },
): Promise<T> {
  const token = await getToken();
  if (!token) {
    throw new Error("authedBackendFetch called without an active session");
  }
  return backendFetch<T>(path, { ...init, token });
}
