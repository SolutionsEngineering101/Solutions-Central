import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { listSpacePages, getPageView, createSpacePage, updateSpacePage } from "@/lib/confluence";

const SPACE_KEY = process.env.CONFLUENCE_SPACE_KEY ?? "";
const TRACKER_PAGE_ID = process.env.CONFLUENCE_PAGE_ID ?? "";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!SPACE_KEY || !process.env.CONFLUENCE_API_TOKEN)
    return Response.json({ error: "not configured" }, { status: 503 });

  const { searchParams } = new URL(req.url);
  const pageId = searchParams.get("id");

  try {
    if (pageId) {
      const page = await getPageView(pageId);
      return Response.json(page);
    }
    const domain = process.env.CONFLUENCE_DOMAIN ?? "";
    const rawPages = await listSpacePages(SPACE_KEY, [TRACKER_PAGE_ID]);
    const pages = rawPages.map(p => ({ ...p, url: `https://${domain}/wiki${p._links.webui}` }));
    return Response.json({ pages });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!SPACE_KEY || !process.env.CONFLUENCE_API_TOKEN)
    return Response.json({ error: "not configured" }, { status: 503 });

  const body = await req.json() as { title: string; content: string };
  try {
    const id = await createSpacePage(SPACE_KEY, body.title, body.content);
    return Response.json({ ok: true, id });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}


export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!process.env.CONFLUENCE_API_TOKEN)
    return Response.json({ error: "not configured" }, { status: 503 });

  const body = await req.json() as { id: string; version: number; title: string; content: string };
  try {
    await updateSpacePage(body.id, body.version, body.title, body.content);
    const updated = await getPageView(body.id);
    return Response.json({ ok: true, ...updated });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
