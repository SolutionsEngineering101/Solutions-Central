import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Proxies a Confluence image: looks up the attachment by page + filename, then
// downloads it via the REST attachment-download endpoint (which accepts API-token
// basic auth, unlike the raw /wiki/download/ URL) and streams the bytes back.
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return new Response("Unauthorized", { status: 401 });

  const domain = process.env.CONFLUENCE_DOMAIN ?? "";
  const email = process.env.CONFLUENCE_EMAIL ?? "";
  const token = process.env.CONFLUENCE_API_TOKEN ?? "";
  if (!domain || !token) return new Response("Not configured", { status: 503 });

  const sp = new URL(req.url).searchParams;
  const page = sp.get("page") ?? "";
  const file = sp.get("file") ?? "";
  if (!/^\d+$/.test(page) || !file) return new Response("Bad request", { status: 400 });

  const auth = `Basic ${Buffer.from(`${email}:${token}`).toString("base64")}`;

  try {
    // Find the attachment id for this filename on the page.
    const listRes = await fetch(
      `https://${domain}/wiki/rest/api/content/${page}/child/attachment?filename=${encodeURIComponent(file)}&limit=50`,
      { headers: { Authorization: auth, Accept: "application/json" }, cache: "no-store" },
    );
    if (!listRes.ok) return new Response("Lookup failed", { status: listRes.status });
    const results = (await listRes.json()).results as { id: string; title: string }[];
    const att = results.find((a) => a.title === file) ?? results[0];
    if (!att) return new Response("Attachment not found", { status: 404 });

    const dl = await fetch(
      `https://${domain}/wiki/rest/api/content/${page}/child/attachment/${att.id}/download`,
      { headers: { Authorization: auth }, cache: "no-store" },
    );
    if (!dl.ok) return new Response("Download failed", { status: dl.status });

    const buf = await dl.arrayBuffer();
    return new Response(buf, {
      headers: {
        "Content-Type": dl.headers.get("content-type") ?? "application/octet-stream",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (err) {
    return new Response(err instanceof Error ? err.message : "Proxy error", { status: 500 });
  }
}
