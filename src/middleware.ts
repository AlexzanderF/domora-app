import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  ROLE_COOKIE_NAME,
  SESSION_COOKIE_NAME,
  STATUS_COOKIE_NAME,
} from "@/features/auth/constants";

export function middleware(request: NextRequest) {
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (sessionToken) {
    const role = request.cookies.get(ROLE_COOKIE_NAME)?.value;
    const status = request.cookies.get(STATUS_COOKIE_NAME)?.value;

    let redirectPath = "/client";
    if (role === "ADMIN") {
      redirectPath = "/admin";
    } else if (role === "SPECIALIST") {
      redirectPath = status === "PENDING" ? "/pending-approval" : "/specialist";
    }

    return NextResponse.redirect(new URL(redirectPath, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/signup", "/forgot-password"],
};
