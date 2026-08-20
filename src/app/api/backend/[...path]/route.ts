import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/authCookie";

const BACKEND_URL = process.env.BACKEND_API_URL;

type RouteParams = { params: Promise<{ path: string[] }> };

async function handle(request: NextRequest, { params }: RouteParams) {
  const token = (await cookies()).get(AUTH_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json(
      { success: false, statusCode: 401, message: "Not authenticated" },
      { status: 401 },
    );
  }

  const { path } = await params;
  const targetUrl = `${BACKEND_URL}/${path.join("/")}${request.nextUrl.search}`;

  const hasBody = request.method === "POST" || request.method === "PATCH";
  const contentType = request.headers.get("content-type") ?? "";
  const isMultipart = contentType.startsWith("multipart/form-data");

  try {
    const backendRes = await fetch(targetUrl, {
      method: request.method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(hasBody ? { "Content-Type": isMultipart ? contentType : "application/json" } : {}),
      },
      // Multipart bodies (file uploads) are streamed through as-is, since
      // reading them as text would corrupt the binary boundary data.
      body: hasBody ? (isMultipart ? request.body : await request.text()) : undefined,
      // Required by Node's fetch when the body is a ReadableStream.
      ...(isMultipart ? { duplex: "half" as const } : {}),
      cache: "no-store",
    });

    const text = await backendRes.text();
    const json = text ? JSON.parse(text) : { success: true, statusCode: backendRes.status, data: null };
    return NextResponse.json(json, { status: backendRes.status });
  } catch {
    return NextResponse.json(
      { success: false, statusCode: 502, message: "Backend unavailable" },
      { status: 502 },
    );
  }
}

export { handle as GET, handle as POST, handle as PATCH, handle as DELETE };
