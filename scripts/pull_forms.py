#!/usr/bin/env python3
"""
pull_forms.py — Microsoft Graph API Forms Puller

Pulls new responses from a Microsoft Form and writes them to intake/solutions-forms/.
Each response becomes a markdown file named SF-YYYY-MM-DD-{responseId[:8]}.md.
Already-saved responses are skipped (idempotent).

Usage:
  python scripts/pull_forms.py --init   # First-time auth: generates refresh token
  python scripts/pull_forms.py          # Pull new responses (uses stored token)

Required env vars (see .env.example):
  AZURE_CLIENT_ID, AZURE_TENANT_ID, MS_FORM_ID

Auth (one of):
  MS_REFRESH_TOKEN env var  (GitHub Actions — set as repo secret)
  .refresh_token file       (local runs — created by --init)
"""

import os
import re
import sys
import argparse
from pathlib import Path
from datetime import datetime, timezone

import msal
import requests
from dotenv import load_dotenv

load_dotenv()

CLIENT_ID = os.environ["AZURE_CLIENT_ID"]
TENANT_ID = os.environ["AZURE_TENANT_ID"]
FORM_ID = os.environ["MS_FORM_ID"]

AUTHORITY = f"https://login.microsoftonline.com/{TENANT_ID}"
SCOPES = ["https://graph.microsoft.com/Forms.Read"]
GRAPH_BASE = "https://graph.microsoft.com/beta"

REPO_ROOT = Path(__file__).parent.parent
OUTPUT_DIR = REPO_ROOT / "intake" / "solutions-forms"
REFRESH_TOKEN_FILE = Path(__file__).parent / ".refresh_token"


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------

def _get_app() -> msal.PublicClientApplication:
    return msal.PublicClientApplication(CLIENT_ID, authority=AUTHORITY)


def init_auth() -> None:
    """Device code flow — run once locally to generate a refresh token."""
    app = _get_app()
    flow = app.initiate_device_flow(scopes=SCOPES)
    if "user_code" not in flow:
        raise RuntimeError(f"Failed to create device flow: {flow}")

    print("\n" + "=" * 60)
    print("Open a browser and go to:")
    print(f"  {flow['verification_uri']}")
    print(f"  Enter code: {flow['user_code']}")
    print("=" * 60 + "\n")
    print("Waiting for you to authenticate...")

    result = app.acquire_token_by_device_flow(flow)

    if "access_token" not in result:
        raise RuntimeError(f"Auth failed: {result.get('error_description', result)}")

    refresh_token = result.get("refresh_token", "")
    if not refresh_token:
        raise RuntimeError("No refresh token in response. Check that offline_access is allowed.")

    REFRESH_TOKEN_FILE.write_text(refresh_token)
    print(f"\n✅ Refresh token saved to {REFRESH_TOKEN_FILE}")
    print("\nNext steps:")
    print("  Local:  token is auto-loaded from file on next run")
    print("  GitHub: copy the token below and add it as a repo secret named MS_REFRESH_TOKEN")
    print(f"\n  Token (first 40 chars): {refresh_token[:40]}...")


def _get_access_token() -> str:
    app = _get_app()

    refresh_token = os.environ.get("MS_REFRESH_TOKEN", "").strip()
    if not refresh_token and REFRESH_TOKEN_FILE.exists():
        refresh_token = REFRESH_TOKEN_FILE.read_text().strip()

    if not refresh_token:
        print("ERROR: No refresh token found.", file=sys.stderr)
        print("  Run: python scripts/pull_forms.py --init", file=sys.stderr)
        sys.exit(1)

    result = app.acquire_token_by_refresh_token(refresh_token, scopes=SCOPES)

    if "access_token" not in result:
        raise RuntimeError(f"Token refresh failed: {result.get('error_description', result)}")

    # Persist the rotated refresh token if one was returned
    new_rt = result.get("refresh_token", "")
    if new_rt and not os.environ.get("MS_REFRESH_TOKEN"):
        REFRESH_TOKEN_FILE.write_text(new_rt)

    return result["access_token"]


# ---------------------------------------------------------------------------
# Graph helpers
# ---------------------------------------------------------------------------

def _graph_get(token: str, path: str) -> dict:
    resp = requests.get(
        f"{GRAPH_BASE}{path}",
        headers={"Authorization": f"Bearer {token}"},
        timeout=30,
    )
    resp.raise_for_status()
    return resp.json()


# ---------------------------------------------------------------------------
# Markdown builder
# ---------------------------------------------------------------------------

def _response_to_markdown(response: dict, questions: list[dict]) -> str:
    resp_id = response.get("id", "unknown")
    submitted_at = response.get("submitDate", "")

    try:
        dt = datetime.fromisoformat(submitted_at.replace("Z", "+00:00"))
        datetime_str = dt.strftime("%Y-%m-%d %H:%M UTC")
        date_str = dt.strftime("%Y-%m-%d")
    except Exception:
        date_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        datetime_str = submitted_at or date_str

    answers = {a["questionId"]: a.get("value", "") for a in response.get("answers", [])}

    lines = [
        "---",
        f'form_id: "SF-{resp_id[:8]}"',
        f'submitted_at: "{datetime_str}"',
        "status: new",
        "---",
        "",
        f"# New Solution Request — {date_str}",
        "",
    ]

    for q in questions:
        q_title = q.get("title", "Question")
        answer = answers.get(q.get("id", ""), "") or "_No response_"
        lines += [f"## {q_title}", answer, ""]

    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Main pull logic
# ---------------------------------------------------------------------------

def pull_responses() -> int:
    token = _get_access_token()
    print("✅ Authenticated with Microsoft Graph")

    questions_resp = _graph_get(token, f"/me/forms/{FORM_ID}/questions")
    questions = questions_resp.get("value", [])
    print(f"   Form has {len(questions)} question(s)")

    responses_resp = _graph_get(token, f"/me/forms/{FORM_ID}/responses")
    responses = responses_resp.get("value", [])
    print(f"   Found {len(responses)} total response(s)")

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    new_count = 0
    for resp in responses:
        resp_id = resp.get("id", "")
        submitted_at = resp.get("submitDate", "")

        try:
            dt = datetime.fromisoformat(submitted_at.replace("Z", "+00:00"))
            date_prefix = dt.strftime("%Y-%m-%d")
        except Exception:
            date_prefix = datetime.now(timezone.utc).strftime("%Y-%m-%d")

        out_file = OUTPUT_DIR / f"SF-{date_prefix}-{resp_id[:8]}.md"
        if out_file.exists():
            continue

        out_file.write_text(_response_to_markdown(resp, questions), encoding="utf-8")
        print(f"   ✅ Saved: {out_file.relative_to(REPO_ROOT)}")
        new_count += 1

    if new_count == 0:
        print("   No new responses — nothing to commit.")
    else:
        print(f"\n✅ {new_count} new response(s) written to intake/solutions-forms/")

    return new_count


# ---------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(description="Pull Microsoft Forms responses via Graph API")
    parser.add_argument(
        "--init",
        action="store_true",
        help="Run device code auth to generate a refresh token (first-time setup)",
    )
    args = parser.parse_args()

    if args.init:
        init_auth()
    else:
        pull_responses()


if __name__ == "__main__":
    main()
