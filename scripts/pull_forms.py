#!/usr/bin/env python3
"""
pull_forms.py - Pull Solution Request Form responses from SharePoint via Graph API

Uses Azure app client credentials (no user login needed). Finds the "Solutions"
Microsoft 365 Group, reads the form Excel from its SharePoint drive, and writes
each new row as a dated markdown file in intake/solutions-forms/.
Already-saved rows are skipped - safe to re-run at any time.

Usage:
  python scripts/pull_forms.py           # pull new responses
  python scripts/pull_forms.py --list    # debug: list group files

Required env vars - copy scripts/.env.example to scripts/.env and fill in:
  AZURE_CLIENT_ID, AZURE_TENANT_ID, AZURE_CLIENT_SECRET
"""

import os
import argparse
from pathlib import Path
from datetime import datetime, timedelta

import msal
import requests
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / ".env")

CLIENT_ID     = os.environ["AZURE_CLIENT_ID"]
TENANT_ID     = os.environ["AZURE_TENANT_ID"]
CLIENT_SECRET = os.environ["AZURE_CLIENT_SECRET"]

SHAREPOINT_HOST = os.getenv("MS_SHAREPOINT_HOST", "vantagecircle.sharepoint.com")
SHAREPOINT_SITE = os.getenv("MS_SHAREPOINT_SITE", "Solutions")
EXCEL_NAME      = os.getenv("MS_EXCEL_NAME", "Solution Request Form")

AUTHORITY  = f"https://login.microsoftonline.com/{TENANT_ID}"
SCOPES     = ["https://graph.microsoft.com/.default"]
GRAPH_BASE = "https://graph.microsoft.com/v1.0"

REPO_ROOT  = Path(__file__).parent.parent
OUTPUT_DIR = REPO_ROOT / "intake" / "solutions-forms"

COLUMNS = {
    "id":             "Id",
    "completion":     "Completion time",
    "response_date":  "Initial Response Date",
    "email":          "Email",
    "name":           "Name",
    "subject":        "Email Subject Line",
    "brief":          "Brief",
    "description":    "Description",
    "client":         "Client/Prospect\xa0Name",
    "status":         "Status",
    "solution":       "Solution Suggested/Answer to Query",
    "employee_size":  "Employee Size",
    "billing":        "Billing\xa0Location",
    "sub_cost":       "Subscription Cost",
    "rewards_budget": "Rewards Budget",
    "feature":        "Feature Name",
    "customizations": "Please mention customizations done for the client that may have an impact on this request.\xa0",
    "vc_spoc":        "VC SPOC",
    "priority":       "Priority Justification",
    "go_live_req":    "Is it a go-live requirement?",
    "go_live_date":   "Go-live Date",
    "link1":          "Link 1 ",
    "link2":          "Link 2",
    "dev_sprint":     "DEV Sprint Planning",
    "ticket":         "Ticket",
    "department":     "Department",
    "closed_on":      "Closed On",
    "solution_spoc":  "Solution SPOC",
    "remarks":        "Remarks",
    "complexity":     "Complexity",
}


def get_token() -> str:
    app = msal.ConfidentialClientApplication(
        CLIENT_ID, authority=AUTHORITY, client_credential=CLIENT_SECRET,
    )
    result = app.acquire_token_for_client(scopes=SCOPES)
    if "access_token" not in result:
        raise RuntimeError(f"Auth failed: {result.get('error_description', result)}")
    return result["access_token"]


def graph_get(token: str, path: str, params: dict = None) -> dict:
    resp = requests.get(
        f"{GRAPH_BASE}{path}",
        headers={"Authorization": f"Bearer {token}"},
        params=params, timeout=30,
    )
    if not resp.ok:
        raise RuntimeError(f"Graph {resp.status_code} {path}: {resp.text[:300]}")
    return resp.json()


def find_site(token: str, host: str, site_name: str) -> str:
    data = graph_get(token, f"/sites/{host}:/sites/{site_name}")
    site_id = data.get("id")
    if not site_id:
        raise RuntimeError(f"SharePoint site not found: {host}/sites/{site_name}")
    return site_id


def find_excel(token: str, site_id: str, name_fragment: str) -> dict:
    data = graph_get(token, f"/sites/{site_id}/drive/root/children", {"$select": "id,name,file"})
    hits = [f for f in data.get("value", []) if name_fragment.lower() in f.get("name","").lower() and "file" in f]
    if not hits:
        data = graph_get(token, f"/sites/{site_id}/drive/root/search(q='{name_fragment}')", {"$select": "id,name,file"})
        hits = [f for f in data.get("value", []) if "file" in f]
    if not hits:
        raise RuntimeError(f"Excel file not found matching '{name_fragment}'")
    return hits[0]


def read_sheet(token: str, site_id: str, file_id: str):
    data = graph_get(token, f"/sites/{site_id}/drive/items/{file_id}/workbook/worksheets/Sheet1/usedRange")
    values = data.get("values", [])
    if not values:
        return [], []
    return [str(h).strip() if h else "" for h in values[0]], values[1:]


def clean(val) -> str:
    return "" if val is None or val == "" else str(val).strip()


def parse_date(val) -> str:
    s = clean(val)
    if not s:
        return ""
    for fmt in ("%Y-%m-%dT%H:%M:%SZ", "%Y-%m-%d %H:%M:%S", "%Y-%m-%d", "%m/%d/%Y", "%d/%m/%Y"):
        try:
            return datetime.strptime(s, fmt).strftime("%Y-%m-%d")
        except ValueError:
            pass
    try:
        return (datetime(1899, 12, 30) + timedelta(days=float(s))).strftime("%Y-%m-%d")
    except (ValueError, TypeError):
        pass
    return s[:10] if len(s) >= 10 else s


def to_markdown(row: dict) -> str:
    eid   = clean(row["id"])
    date  = parse_date(row["completion"] or row["response_date"])
    cli   = clean(row["client"]) or "Unknown Client"
    stat  = clean(row["status"]) or "Unknown"
    comp  = clean(row["complexity"]) or "Not Set"
    lines = [
        "---",
        f'form_id: "SF-{int(float(eid)):03d}"',
        f'submitted_at: "{date}"', f'submitted_by: "{clean(row["name"])}"',
        f'email: "{clean(row["email"])}"', f'client: "{cli}"',
        f'feature_name: "{clean(row["feature"])}"',
        f'status: "{stat}"', f'complexity: "{comp}"',
        f'solution_spoc: "{clean(row["solution_spoc"])}"',
        f'vc_spoc: "{clean(row["vc_spoc"])}"',
        f'department: "{clean(row["department"])}"',
        f'priority: "{clean(row["priority"])}"',
        f'go_live_requirement: "{clean(row["go_live_req"])}"',
        f'go_live_date: "{parse_date(row["go_live_date"])}"',
        f'closed_on: "{parse_date(row["closed_on"])}"',
        f'dev_sprint: "{clean(row["dev_sprint"])}"', f'ticket: "{clean(row["ticket"])}"',
        "---", "",
        f"# Solution Request #{eid} - {cli}",
        f"**Date:** {date}  |  **Status:** {stat}  |  **Complexity:** {comp}", "",
    ]
    for lbl, k in [("Subject","subject"),("Brief","brief"),("Problem Description","description"),
                   ("Solution Given","solution"),("Customizations","customizations"),("Remarks","remarks")]:
        v = clean(row[k])
        if v: lines += [f"## {lbl}", v, ""]
    dets = [(l,k) for l,k in [("Employee Size","employee_size"),("Billing","billing"),
            ("Subscription Cost","sub_cost"),("Rewards Budget","rewards_budget"),
            ("Feature","feature"),("VC SPOC","vc_spoc")] if clean(row[k])]
    if dets: lines += ["## Commercial Details"] + [f"- **{l}:** {clean(row[k])}" for l,k in dets] + [""]
    lnks = [f"- {clean(row[k])}" for k in ("link1","link2") if clean(row[k])]
    if lnks: lines += ["## Links"] + lnks + [""]
    return "\n".join(lines)


def pull(update: bool = False):
    token = get_token()
    print("Authenticated")
    site_id = find_site(token, SHAREPOINT_HOST, SHAREPOINT_SITE)
    print(f"Site  : {SHAREPOINT_HOST}/sites/{SHAREPOINT_SITE}")
    excel   = find_excel(token, site_id, EXCEL_NAME)
    fid     = excel["id"]
    print(f"File  : {excel['name']}")
    headers, rows = read_sheet(token, site_id, fid)
    col = {h: i for i, h in enumerate(headers)}
    print(f"Rows  : {len(rows)}")
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    new_n = 0
    for raw in rows:
        if not any(raw): continue
        row = {k: (raw[col.get(cn) or col.get(cn.strip())] if col.get(cn) is not None and col.get(cn) < len(raw) else "")
               for k, cn in COLUMNS.items()}
        eid = clean(row["id"])
        if not eid: continue
        date = parse_date(row["completion"] or row["response_date"]) or "0000-00-00"
        try: num = int(float(eid))
        except (ValueError, TypeError): continue
        f = OUTPUT_DIR / f"SF-{date}-{num:03d}.md"
        if f.exists() and not update: continue
        f.write_text(to_markdown(row), encoding="utf-8")
        client_name = clean(row['client'])
        action = "updated" if (f.exists() and update) else "new"
        print(f"  #{num:>3} | {date} | {client_name[:45]} [{action}]")
        new_n += 1
    print(f"Done - {new_n} file(s) written." if new_n else "No new responses.")


def list_debug():
    token = get_token()
    site_id = find_site(token, SHAREPOINT_HOST, SHAREPOINT_SITE)
    print(f"Site: {SHAREPOINT_HOST}/sites/{SHAREPOINT_SITE}  id={site_id}")
    data = graph_get(token, f"/sites/{site_id}/drive/root/children", {"$select": "id,name"})
    for f in data.get("value", []):
        print(f"  {f['name']}  id={f['id']}")


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--list", action="store_true")
    p.add_argument("--update", action="store_true",
                   help="Overwrite existing files (use once to backfill frontmatter fields)")
    a = p.parse_args()
    if a.list:
        list_debug()
    else:
        pull(update=a.update)
