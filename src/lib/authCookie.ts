export const AUTH_COOKIE_NAME = "mer_session";

const DEFAULT_MAX_AGE_SECONDS = 60 * 60 * 24; // 1 day, matches backend's default JWT_EXPIRES_IN

/**
 * Reads the `exp` claim out of a JWT without verifying it (verification happens
 * on the backend for every request) so the cookie's lifetime tracks the
 * token's real lifetime instead of a hardcoded guess.
 */
export function secondsUntilExpiry(token: string): number {
  try {
    const [, payload] = token.split(".");
    const decoded = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf-8"),
    ) as { exp?: number };
    if (!decoded.exp) return DEFAULT_MAX_AGE_SECONDS;
    const seconds = decoded.exp - Math.floor(Date.now() / 1000);
    return seconds > 0 ? seconds : DEFAULT_MAX_AGE_SECONDS;
  } catch {
    return DEFAULT_MAX_AGE_SECONDS;
  }
}

export function authCookieOptions(maxAge: number) {
  return {
    httpOnly: true as const,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}
