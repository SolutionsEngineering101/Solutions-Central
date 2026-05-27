const BASE = `https://${process.env.CONFLUENCE_DOMAIN}/wiki/api/v2`;

function authHeader() {
  const token = Buffer.from(
    `${process.env.CONFLUENCE_EMAIL}:${process.env.CONFLUENCE_API_TOKEN}`
  ).toString("base64");
  return `Basic ${token}`;
}

export interface ConfluencePage {
  id: string;
  title: string;
  version: { number: number };
  body: { storage: { value: string } };
  _links: { webui: string };
}

export async function getPage(pageId: string): Promise<ConfluencePage> {
  const res = await fetch(
    `${BASE}/pages/${pageId}?body-format=storage`,
    {
      headers: { Authorization: authHeader(), Accept: "application/json" },
      cache: "no-store",
    }
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Confluence ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json() as Promise<ConfluencePage>;
}

export async function updatePage(
  pageId: string,
  version: number,
  title: string,
  storageXml: string
): Promise<ConfluencePage> {
  const res = await fetch(`${BASE}/pages/${pageId}`, {
    method: "PUT",
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      id: pageId,
      status: "current",
      title,
      version: { number: version },
      body: { storage: { value: storageXml, representation: "storage" } },
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Confluence update ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json() as Promise<ConfluencePage>;
}

function stripTags(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export interface ParsedTable {
  headers: string[];
  rows: string[][];
}

export function parseFirstTable(storageXml: string): ParsedTable {
  // Extract first <table>...</table> block
  const tableMatch = storageXml.match(/<table[\s\S]*?<\/table>/);
  if (!tableMatch) return { headers: [], rows: [] };
  const table = tableMatch[0];

  // Extract all <tr> blocks
  const trBlocks = [...table.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)];

  const headers: string[] = [];
  const rows: string[][] = [];

  trBlocks.forEach((tr, idx) => {
    const thMatches = [...tr[1].matchAll(/<th[^>]*>([\s\S]*?)<\/th>/g)];
    if (thMatches.length > 0 && idx === 0) {
      headers.push(...thMatches.map((m) => stripTags(m[1])));
      return;
    }
    const tdMatches = [...tr[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)];
    if (tdMatches.length > 0) {
      rows.push(tdMatches.map((m) => stripTags(m[1])));
    }
  });

  return { headers, rows };
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function appendTableRow(storageXml: string, cells: string[]): string {
  const row =
    "<tr>" +
    cells.map((c) => `<td><p>${escapeXml(c)}</p></td>`).join("") +
    "</tr>";
  // Insert after the last </tr> inside the first table
  const firstTableEnd = storageXml.indexOf("</table>");
  if (firstTableEnd === -1) return storageXml;
  const beforeTable = storageXml.slice(0, firstTableEnd);
  const lastTr = beforeTable.lastIndexOf("</tr>");
  if (lastTr === -1) return storageXml;
  return (
    storageXml.slice(0, lastTr + 5) +
    row +
    storageXml.slice(lastTr + 5)
  );
}

export function updateTableRow(
  storageXml: string,
  rowIndex: number,
  cells: string[]
): string {
  const tableMatch = storageXml.match(/<table[\s\S]*?<\/table>/);
  if (!tableMatch) return storageXml;

  const trBlocks = [...tableMatch[0].matchAll(/<tr[^>]*>[\s\S]*?<\/tr>/g)];
  // rowIndex 0 = first data row (skip header row at index 0)
  const targetTr = trBlocks[rowIndex + 1];
  if (!targetTr) return storageXml;

  const newRow =
    "<tr>" +
    cells.map((c) => `<td><p>${escapeXml(c)}</p></td>`).join("") +
    "</tr>";

  return storageXml.replace(targetTr[0], newRow);
}

export function deleteTableRow(storageXml: string, rowIndex: number): string {
  const tableMatch = storageXml.match(/<table[\s\S]*?<\/table>/);
  if (!tableMatch) return storageXml;

  const trBlocks = [...tableMatch[0].matchAll(/<tr[^>]*>[\s\S]*?<\/tr>/g)];
  // rowIndex 0 = first data row (skip header row at index 0)
  const targetTr = trBlocks[rowIndex + 1];
  if (!targetTr) return storageXml;

  return storageXml.replace(targetTr[0], "");
}
