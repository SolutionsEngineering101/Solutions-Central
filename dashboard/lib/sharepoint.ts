/**
 * Microsoft Graph API client for writing consultant edits back to the
 * SharePoint Excel workbook. Uses client credentials (no user login).
 * All env vars mirror the ones used in scripts/pull_forms.py.
 */

const TENANT_ID        = process.env.AZURE_TENANT_ID!;
const CLIENT_ID        = process.env.AZURE_CLIENT_ID!;
const CLIENT_SECRET    = process.env.AZURE_CLIENT_SECRET!;
const SHAREPOINT_HOST  = process.env.MS_SHAREPOINT_HOST  ?? "vantagecircle.sharepoint.com";
const SHAREPOINT_SITE  = process.env.MS_SHAREPOINT_SITE  ?? "Solutions";
const EXCEL_NAME       = process.env.MS_EXCEL_NAME       ?? "Solution Request Form";
const GRAPH_BASE       = "https://graph.microsoft.com/v1.0";

// 0-based column indices matching the Excel sheet layout
const CONSULTANT_COL_INDEX: Record<string, number> = {
  status:       11,
  solution:     12,
  vc_spoc:      20,
  dev_sprint:   26,
  ticket:       27,
  closed_on:    29,
  solution_spoc: 30,
  remarks:      31,
  complexity:   32,
};

export type ConsultantFields = Partial<Record<keyof typeof CONSULTANT_COL_INDEX, string>>;

function colToLetter(n: number): string {
  let letter = "";
  let col = n + 1;
  while (col > 0) {
    const rem = (col - 1) % 26;
    letter = String.fromCharCode(65 + rem) + letter;
    col = Math.floor((col - 1) / 26);
  }
  return letter;
}

async function getGraphToken(): Promise<string> {
  const res = await fetch(
    `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        scope: "https://graph.microsoft.com/.default",
        grant_type: "client_credentials",
      }),
    }
  );
  const data = await res.json();
  if (!data.access_token)
    throw new Error(`Graph auth failed: ${data.error_description ?? JSON.stringify(data)}`);
  return data.access_token as string;
}

async function graphGet<T>(token: string, path: string): Promise<T> {
  const res = await fetch(`${GRAPH_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Graph GET ${path} → ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

async function graphPatch(token: string, path: string, body: unknown): Promise<void> {
  const res = await fetch(`${GRAPH_BASE}${path}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Graph PATCH ${path} → ${res.status}: ${await res.text()}`);
}

async function resolveExcelLocation(token: string): Promise<{ siteId: string; fileId: string }> {
  const site = await graphGet<{ id: string }>(
    token,
    `/sites/${SHAREPOINT_HOST}:/sites/${SHAREPOINT_SITE}`
  );
  const children = await graphGet<{ value: Array<{ id: string; name: string; file?: unknown }> }>(
    token,
    `/sites/${site.id}/drive/root/children?$select=id,name,file`
  );
  const file = children.value.find(
    (f) => f.file && f.name.toLowerCase().includes(EXCEL_NAME.toLowerCase())
  );
  if (!file) throw new Error(`Excel file "${EXCEL_NAME}" not found in SharePoint`);
  return { siteId: site.id, fileId: file.id };
}

/**
 * Updates consultant-fillable cells in the Excel workbook for the given numeric
 * form ID. Runs fire-and-forget from the API route — GitHub write completes first.
 */
export async function updateFormRowInExcel(
  formId: number,
  fields: ConsultantFields
): Promise<void> {
  const changedEntries = Object.entries(fields).filter(
    ([key, val]) => key in CONSULTANT_COL_INDEX && val !== undefined
  );
  if (changedEntries.length === 0) return;

  const token = await getGraphToken();
  const { siteId, fileId } = await resolveExcelLocation(token);

  // Read column A to find which row holds this form ID
  const colA = await graphGet<{ values: unknown[][] }>(
    token,
    `/sites/${siteId}/drive/items/${fileId}/workbook/worksheets/Sheet1/range(address='A:A')`
  );

  let rowNum: number | null = null;
  colA.values.forEach((row, i) => {
    if (i === 0) return; // skip header
    try {
      if (Math.round(Number(row[0])) === formId) rowNum = i + 1; // 1-indexed Excel row
    } catch {}
  });

  if (!rowNum) throw new Error(`Form ID ${formId} not found in Excel column A`);

  // Patch each changed cell in parallel
  await Promise.all(
    changedEntries.map(([key, value]) => {
      const colIdx = CONSULTANT_COL_INDEX[key as keyof typeof CONSULTANT_COL_INDEX];
      const addr   = `${colToLetter(colIdx)}${rowNum}`;
      return graphPatch(
        token,
        `/sites/${siteId}/drive/items/${fileId}/workbook/worksheets/Sheet1/range(address='${addr}')`,
        { values: [[value ?? ""]] }
      );
    })
  );
}
