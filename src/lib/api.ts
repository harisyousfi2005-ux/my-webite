import { ApiError, unwrapEnvelope, type ApiEnvelope } from "@/lib/apiError";

export { ApiError };

type ApiBase = "/api/backend" | "/api/auth";

interface ApiFetchOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  base?: ApiBase;
}

/**
 * Client-side fetch helper. Always calls a same-origin Next.js route
 * (never the NestJS backend directly) so the auth cookie never has to be
 * exposed to client-side JS.
 */
export async function apiFetch<T>(
  path: string,
  { method = "GET", body, base = "/api/backend" }: ApiFetchOptions = {},
): Promise<T> {
  const res = await fetch(`${base}${path}`, {
    method,
    headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  const json = (await res.json()) as ApiEnvelope<T>;
  return unwrapEnvelope(json);
}
