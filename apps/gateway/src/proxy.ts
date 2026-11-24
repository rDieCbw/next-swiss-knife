import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "@swiss/ui";

function createTraceparent() {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  return `00-${hex.slice(0, 32)}-${hex.slice(32)}-01`;
}

const handleI18n = createMiddleware(routing);
const tenantPaths = ["/api/orders", "/api/audit", "/api/bff"];

export default function proxy(request: NextRequest) {
  const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();
  if (request.nextUrl.pathname.startsWith("/api/")) {
    const needsTenant = tenantPaths.some((path) => request.nextUrl.pathname.startsWith(path));
    if (needsTenant) {
      const hasSession = request.cookies.getAll().some((cookie) => cookie.name.includes("session"));
      if (!hasSession) {
        const denied = NextResponse.json({ reason: "missing-session" }, { status: 401 });
        denied.headers.set("x-request-id", requestId);
        return denied;
      }
      if (!request.headers.get("x-tenant-id")) {
        const denied = NextResponse.json({ reason: "missing-tenant" }, { status: 400 });
        denied.headers.set("x-request-id", requestId);
        return denied;
      }
    }
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-request-id", requestId);
    if (!requestHeaders.get("traceparent")) requestHeaders.set("traceparent", createTraceparent());
    const response = NextResponse.next({ request: { headers: requestHeaders } });
    response.headers.set("x-request-id", requestId);
    return response;
  }
  return handleI18n(request);
}

export const config = {
  matcher: ["/((?!_next|_vercel|.*\\..*).*)"],
};
