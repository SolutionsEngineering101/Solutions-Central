import { NextRequest, NextResponse } from "next/server";

// Routes a sales-role JWT is allowed to reach
const SALES_ALLOWED = [
  "/api/knowledge/chat",
  "/api/extension/otp",
  "/extension-auth",
  "/login",
  "/api/auth",
];

function decodeTokenRole(token: string): string | null {
  try {
    const part = token.split(".")[0];
    if (!part) return null;
    const json = atob(part.replace(/-/g, "+").replace(/_/g, "/"));
    const payload = JSON.parse(json) as Record<string, unknown>;
    return typeof payload.role === "string" ? payload.role : null;
  } catch {
    return null;
  }
}

export function middleware(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return NextResponse.next();

  const role = decodeTokenRole(auth.slice(7));
  if (role !== "sales") return NextResponse.next();

  const { pathname } = req.nextUrl;
  const allowed = SALES_ALLOWED.some(p => pathname.startsWith(p));
  if (!allowed) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
