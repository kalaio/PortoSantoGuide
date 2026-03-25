import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  decodeSessionTokenEdge,
  getSessionCookieNameEdge,
  isAuthConfiguredEdge
} from "@/app/(admin)/lib/admin-auth-edge";

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  if (!isAuthConfiguredEdge()) {
    return NextResponse.json(
      { error: "ADMIN_SESSION_SECRET is missing. Configure auth before accessing /admin." },
      { status: 503 }
    );
  }

  if (pathname === "/admin/login" || pathname === "/admin/forbidden") {
    return NextResponse.next();
  }

  const token = request.cookies.get(getSessionCookieNameEdge())?.value;
  if (!token) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  const payload = await decodeSessionTokenEdge(token);
  if (!payload) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("next", `${pathname}${search}`);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete(getSessionCookieNameEdge());
    return response;
  }

  if (pathname !== "/admin/login" && payload.role === "SUBSCRIBER") {
    return NextResponse.redirect(new URL("/admin/forbidden", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"]
};
