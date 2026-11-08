import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/features/auth/constants";

// Presence-only check: the cookie is never trusted for role or status.
// Layouts resolve the real actor from the database (see requireActor).
export function middleware(request: NextRequest) {
  if (!request.cookies.get(SESSION_COOKIE_NAME)?.value) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/client/:path*", "/specialist/:path*", "/admin/:path*"],
};
