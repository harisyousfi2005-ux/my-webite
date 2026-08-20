import "server-only";
import { ApiError, unwrapEnvelope, type ApiEnvelope } from "@/lib/apiError";

const BACKEND_URL = process.env.BACKEND_API_URL;

interface BackendFetchOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  token?: string;
}

/** Direct server-to-server call to the NestJS backend — RSC/Route Handlers only. */
export async function backendFetch<T>(
  path: string,
  { method = "GET", body, token }: BackendFetchOptions = {},
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BACKEND_URL}${path}`, {
      method,
      headers: {
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });
  } catch {
    throw new ApiError("Backend unavailable", 502);
  }

  const json = (await res.json()) as ApiEnvelope<T>;
  return unwrapEnvelope(json);
}
