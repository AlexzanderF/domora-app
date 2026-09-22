import { NextResponse } from "next/server";
import { deleteSession } from "@/features/auth/server/session";

// Self-healing logout: clears possibly stale session cookies (e.g. a session
// deleted or expired server-side while the browser still holds its cookies)
// and only then lands on the login page. Without this, the middleware reads
// the stale cookies as an authenticated session and bounces /login back to
// the workspace, looping against the pages' own session guards forever.
export async function GET(request: Request) {
  await deleteSession();

  const requestedNext = new URL(request.url).searchParams.get("next");
  const next =
    requestedNext &&
    requestedNext.startsWith("/") &&
    !requestedNext.startsWith("//")
      ? requestedNext
      : "/login";

  return NextResponse.redirect(new URL(next, request.url));
}
