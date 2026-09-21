import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  ROLE_COOKIE_NAME,
  SESSION_COOKIE_NAME,
  STATUS_COOKIE_NAME,
} from "@/features/auth/constants";
import { getRoleDashboardPath } from "@/features/auth/navigation";

export function middleware(request: NextRequest) {
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const { pathname } = request.nextUrl;

  const isPublicAuthRoute =
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/forgot-password";

  if (sessionToken && isPublicAuthRoute) {
    const role = request.cookies.get(ROLE_COOKIE_NAME)?.value;
    const status = request.cookies.get(STATUS_COOKIE_NAME)?.value;
    const redirectPath = getRoleDashboardPath(role, status);

    return NextResponse.redirect(new URL(redirectPath, request.url));
  }

  const isWorkspaceRoute =
    pathname.startsWith("/client") ||
    pathname.startsWith("/specialist") ||
    pathname.startsWith("/admin");

  if (!sessionToken && isWorkspaceRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/signup",
    "/forgot-password",
    "/client/:path*",
    "/specialist/:path*",
    "/admin/:path*",
  ],
};
