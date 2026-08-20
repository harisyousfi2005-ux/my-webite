import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, authCookieOptions, secondsUntilExpiry } from "@/lib/authCookie";

const BACKEND_URL = process.env.BACKEND_API_URL;

export async function POST(request: Request) {
  const body = await request.text();

  const backendRes = await fetch(`${BACKEND_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    cache: "no-store",
  });
  const json = await backendRes.json();

  if (!json.success) {
    return NextResponse.json(json, { status: backendRes.status });
  }

  const { accessToken, user } = json.data;
  (await cookies()).set(
    AUTH_COOKIE_NAME,
    accessToken,
    authCookieOptions(secondsUntilExpiry(accessToken)),
  );

  return NextResponse.json(
    { success: true, statusCode: backendRes.status, data: { user } },
    { status: backendRes.status },
  );
}
