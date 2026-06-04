import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Proxies Confluence images: fetches them server-side with the Confluence
// credentials and streams the bytes back, so the browser can display them.
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return new Response("Unauthorized", { status: 401 });

  const domain = process.env.CONFLUENCE_DOMAIN ?? "";
  const email = process.env.CONFLUENCE_EMAIL ?? "";
  const token = process.env.CONFLUENCE_API_TOKEN ?? "";
  if (!domain || !token) return new Response("Not configured", { status: 503 });

  const url = new URL(req.url).searchParams.get("url");
  if (!url) return new Response("Missing url", { status: 400 });

  let target: URL;
  try { target = new URL(url); } catch { return new Response("Bad url", { status: 400 }); }
  // SSRF guard — only proxy images on the configured Confluence host.
  if (target.protocol !== "https:" || target.hostname !== domain)
    return new Response("Forbidden", { status: 403 });

  const auth = Buffer.from(`${email}:${token}`).toString("base64");
  const res = await fetch(target.toString(), {
    headers: { Authorization: `Basic ${auth}` },
    cache: "no-store",
  });
  if (!res.ok) return new Response("Image not found", { status: res.status });

  const buf = await res.arrayBuffer();
  return new Response(buf, {
    headers: {
      "Content-Type": res.headers.get("content-type") ?? "application/octet-stream",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
