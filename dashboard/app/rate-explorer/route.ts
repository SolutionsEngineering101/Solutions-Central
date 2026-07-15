import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getFile } from "@/lib/github";

export const dynamic = "force-dynamic";

// Serves the self-contained Rate Explorer HTML app (client PPU lookup,
// points⇄currency converter) stored in the repo, behind dashboard auth.
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session && process.env.NEXT_PUBLIC_DEV_NO_AUTH !== "1")
    return NextResponse.redirect(new URL("/login", req.url));

  let html: string | null = null;
  try {
    html = await getFile("product-information/rate-explorer/index.html");
  } catch (err) {
    const msg = err instanceof Error ? err.message : "GitHub fetch failed";
    return new NextResponse(`Could not load Rate Explorer from GitHub: ${msg}`, { status: 502 });
  }
  if (!html)
    return new NextResponse("Rate Explorer not found — expected product-information/rate-explorer/index.html in the repo.", { status: 404 });

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
