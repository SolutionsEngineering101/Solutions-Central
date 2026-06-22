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
  // Confluence date picker stores dates as <time datetime="YYYY-MM-DD" /> — extract the ISO value
  const withDates = html.replace(
    /<time[^>]+datetime="([^"]+)"[^>]*\/?>/gi,
    (_, dt) => dt
  );
  // Confluence Jira issue macro — extract the ticket key and build a browse URL
  // Storage format: <ac:structured-macro ac:name="jira">...<ac:parameter ac:name="key">VC-123</ac:parameter>...</ac:structured-macro>
  const withJira = withDates.replace(
    /<ac:structured-macro\b[^>]*ac:name="jira"[\s\S]*?<\/ac:structured-macro>/gi,
    (macro) => {
      const keyMatch = macro.match(/<ac:parameter[^>]*ac:name="key"[^>]*>([\s\S]*?)<\/ac:parameter>/i);
      if (!keyMatch) return "";
      const ticketKey = keyMatch[1].trim();
      return `https://${process.env.CONFLUENCE_DOMAIN}/browse/${ticketKey}`;
    }
  );
  // Preserve the href from anchor tags so URLs round-trip correctly
  const withLinks = withJira.replace(
    /<a\b[^>]*?\bhref="([^"]+)"[^>]*>[\s\S]*?<\/a>/gi,
    (_, href) => href.replace(/&amp;/g, "&").replace(/&quot;/g, '"')
  );
  return withLinks
    .replace(/<[^>]+>/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Normalises any recognisable date string to dd/mm/yyyy.
// Treats all numeric d/m or d-m patterns as day-first (India locale).
function normalizeDateStr(val: string): string {
  const v = val.trim();
  if (!v) return v;

  // yyyy-mm-dd  (ISO — from <time> element or plain text)
  const iso = v.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`;

  // d/m/yyyy or dd/mm/yyyy — pad and return
  const slash = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slash) return `${slash[1].padStart(2, "0")}/${slash[2].padStart(2, "0")}/${slash[3]}`;

  // d-m-yyyy or dd-mm-yyyy (treat as day-month-year)
  const dash = v.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (dash) return `${dash[1].padStart(2, "0")}/${dash[2].padStart(2, "0")}/${dash[3]}`;

  // d.m.yyyy or dd.mm.yyyy
  const dot = v.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (dot) return `${dot[1].padStart(2, "0")}/${dot[2].padStart(2, "0")}/${dot[3]}`;

  // Natural-language dates ("7 May 2026", "May 7, 2026") — safe to use Date() here
  // because these formats are unambiguous
  if (/[a-zA-Z]/.test(v)) {
    const d = new Date(v);
    if (!isNaN(d.getTime())) {
      const dd = String(d.getDate()).padStart(2, "0");
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      return `${dd}/${mm}/${d.getFullYear()}`;
    }
  }

  return v; // unrecognised — return as-is
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

  // Normalise all date-column cells to dd/mm/yyyy
  const dateColIdxs = headers
    .map((h, i) => (/date|deadline|due|target|scheduled|release/i.test(h) ? i : -1))
    .filter(i => i >= 0);

  for (const row of rows) {
    for (const ci of dateColIdxs) {
      if (ci < row.length && row[ci]) {
        row[ci] = normalizeDateStr(row[ci]);
      }
    }
  }

  return { headers, rows };
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Wraps a cell value as Confluence storage XML — URLs become proper <a> hyperlinks.
function cellToXml(value: string): string {
  const v = value.trim();
  if (/^https?:\/\//i.test(v)) {
    return `<td><p><a href="${escapeXml(v)}">${escapeXml(v)}</a></p></td>`;
  }
  return `<td><p>${escapeXml(v)}</p></td>`;
}

export function appendTableRow(storageXml: string, cells: string[]): string {
  const row =
    "<tr>" +
    cells.map((c) => cellToXml(c)).join("") +
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
    cells.map((c) => cellToXml(c)).join("") +
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

export interface SpacePage {
  id: string;
  title: string;
  version: { number: number; when: string; by?: { displayName: string } };
  excerpt?: string;
  url?: string;
  _links: { webui: string };
}

export async function listSpacePages(spaceKey: string, excludeIds: string[] = []): Promise<SpacePage[]> {
  const all: SpacePage[] = [];
  let start = 0;
  const limit = 100;
  while (true) {
    const res = await fetch(
      `https://${process.env.CONFLUENCE_DOMAIN}/wiki/rest/api/content?spaceKey=${encodeURIComponent(spaceKey)}&type=page&status=current&limit=${limit}&start=${start}&expand=version,excerpt`,
      { headers: { Authorization: authHeader(), Accept: "application/json" }, cache: "no-store" }
    );
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`Confluence ${res.status}: ${t.slice(0, 200)}`);
    }
    const data = await res.json() as { results: SpacePage[]; size: number };
    const filtered = data.results.filter(p => !excludeIds.includes(p.id));
    all.push(...filtered);
    if (data.results.length < limit) break;
    start += limit;
  }
  return all.sort((a, b) => a.title.localeCompare(b.title));
}

// Confluence image URLs are relative and/or need auth, so the browser can't load
// them directly. Rewrite <img> src to go through our authenticated image proxy.
function rewriteImages(html: string): string {
  const noSrcset = html.replace(/\s(?:data-)?srcset="[^"]*"/gi, "");
  return noSrcset.replace(/(<img\b[^>]*?\bsrc=")([^"]+)(")/gi, (m, pre, src, post) => {
    if (/^data:/i.test(src)) return m;
    const decoded = src.replace(/&amp;/g, "&");
    // Confluence attachment/thumbnail URLs carry the page id + filename. The raw
    // /wiki/download/ URL rejects API-token auth, so route via our proxy which
    // re-fetches through the REST attachment-download endpoint (which accepts it).
    const mm = decoded.match(/\/wiki\/download\/(?:attachments|thumbnails)\/(\d+)\/([^?#]+)/);
    if (mm) {
      const page = mm[1];
      const file = decodeURIComponent(mm[2]);
      return `${pre}/api/confluence/image?page=${page}&file=${encodeURIComponent(file)}${post}`;
    }
    return m; // external / unknown image — leave as-is
  });
}

export async function getPageView(pageId: string): Promise<{ id: string; title: string; version: number; body: string; url: string }> {
  const res = await fetch(
    `https://${process.env.CONFLUENCE_DOMAIN}/wiki/rest/api/content/${pageId}?expand=body.view,version`,
    { headers: { Authorization: authHeader(), Accept: "application/json" }, cache: "no-store" }
  );
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Confluence ${res.status}: ${t.slice(0, 200)}`);
  }
  const d = await res.json() as {
    id: string; title: string;
    version: { number: number };
    body: { view: { value: string } };
    _links: { webui: string };
  };
  return {
    id: d.id,
    title: d.title,
    version: d.version.number,
    body: rewriteImages(d.body.view.value),
    url: `https://${process.env.CONFLUENCE_DOMAIN}/wiki${d._links.webui}`,
  };
}

export async function createSpacePage(spaceKey: string, title: string, bodyText: string): Promise<string> {
  const storageBody = bodyText
    .split(/\n\n+/)
    .filter(p => p.trim())
    .map(p => `<p>${escapeXml(p.trim().replace(/\n/g, " "))}</p>`)
    .join("");
  const res = await fetch(
    `https://${process.env.CONFLUENCE_DOMAIN}/wiki/rest/api/content`,
    {
      method: "POST",
      headers: { Authorization: authHeader(), "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        type: "page",
        title,
        space: { key: spaceKey },
        body: { storage: { value: storageBody || "<p></p>", representation: "storage" } },
      }),
    }
  );
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Confluence create ${res.status}: ${t.slice(0, 200)}`);
  }
  const d = await res.json() as { id: string };
  return d.id;
}


export async function updateSpacePage(pageId: string, version: number, title: string, bodyText: string): Promise<void> {
  const storageBody = bodyText
    .split(/\n\n+/)
    .filter(p => p.trim())
    .map(p => `<p>${escapeXml(p.trim().replace(/\n/g, " "))}</p>`)
    .join("");
  const res = await fetch(
    `https://${process.env.CONFLUENCE_DOMAIN}/wiki/rest/api/content/${pageId}`,
    {
      method: "PUT",
      headers: { Authorization: authHeader(), "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        id: pageId,
        type: "page",
        title,
        version: { number: version },
        body: { storage: { value: storageBody || "<p></p>", representation: "storage" } },
      }),
    }
  );
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Confluence update ${res.status}: ${t.slice(0, 200)}`);
  }
}
