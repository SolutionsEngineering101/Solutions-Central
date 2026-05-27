import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getPage,
  updatePage,
  parseFirstTable,
  appendTableRow,
  updateTableRow,
  deleteTableRow,
} from "@/lib/confluence";

const PAGE_ID = process.env.CONFLUENCE_PAGE_ID ?? "";
const DOMAIN = process.env.CONFLUENCE_DOMAIN ?? "";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  if (!PAGE_ID || !process.env.CONFLUENCE_API_TOKEN) {
    return Response.json({ error: "Confluence not configured" }, { status: 503 });
  }

  try {
    const page = await getPage(PAGE_ID);
    const storageXml = page.body.storage.value;
    const table = parseFirstTable(storageXml);
    const url = `https://${DOMAIN}/wiki${page._links.webui}`;
    return Response.json({
      id: page.id,
      title: page.title,
      version: page.version.number,
      url,
      table,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return Response.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  if (!PAGE_ID || !process.env.CONFLUENCE_API_TOKEN) {
    return Response.json({ error: "Confluence not configured" }, { status: 503 });
  }

  const body = (await req.json()) as {
    action: "append_row" | "edit_row" | "delete_row";
    cells: string[];
    rowIndex?: number;
  };

  try {
    const page = await getPage(PAGE_ID);
    let updatedXml = page.body.storage.value;

    if (body.action === "append_row") {
      updatedXml = appendTableRow(updatedXml, body.cells);
    } else if (body.action === "edit_row" && body.rowIndex !== undefined) {
      updatedXml = updateTableRow(updatedXml, body.rowIndex, body.cells);
    } else if (body.action === "delete_row" && body.rowIndex !== undefined) {
      updatedXml = deleteTableRow(updatedXml, body.rowIndex);
    } else {
      return Response.json({ error: "Invalid action" }, { status: 400 });
    }

    await updatePage(PAGE_ID, page.version.number + 1, page.title, updatedXml);

    // Return fresh table data
    const updated = await getPage(PAGE_ID);
    const table = parseFirstTable(updated.body.storage.value);
    return Response.json({ ok: true, version: updated.version.number, table });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return Response.json({ error: msg }, { status: 500 });
  }
}
