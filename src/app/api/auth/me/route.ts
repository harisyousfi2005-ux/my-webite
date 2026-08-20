import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/authCookie";

const BACKEND_URL = process.env.BACKEND_API_URL;

export async function GET() {
  const token = (await cookies()).get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.json({ success: true, statusCode: 200, data: null });
  }

  const backendRes = await fetch(`${BACKEND_URL}/users/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!backendRes.ok) {
    (await cookies()).delete(AUTH_COOKIE_NAME);
    return NextResponse.json({ success: true, statusCode: 200, data: null });
  }

  const json = await backendRes.json();
  return NextResponse.json({ success: true, statusCode: 200, data: json.data });
}
