import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin")) {
    const user = await getAuthUser(request);
    if (!user || user.role !== "admin") {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return forwardUser(request, user);
  }

  if (
    pathname.startsWith("/api") &&
    !pathname.startsWith("/api/auth") &&
    !pathname.startsWith("/api/cron")
  ) {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return forwardUser(request, user);
  }

  return NextResponse.next();
}

function forwardUser(
  request: NextRequest,
  user: { userId: string; role: string; username: string }
) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-user-id", user.userId);
  requestHeaders.set("x-user-role", user.role);
  requestHeaders.set("x-user-username", user.username);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/admin/:path*", "/api/:path*"],
};
