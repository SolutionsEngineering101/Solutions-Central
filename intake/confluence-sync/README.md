# Confluence Sync

> Pages synced from Confluence land here as markdown files.
> Updated by: `scripts/sync-confluence.sh` (runs daily via GitHub Actions, or manually via `claude "sync confluence"`)

## File naming convention
`[space-key]-[page-slug]-[YYYY-MM-DD].md`

## Setup
Set the following environment variables before running the sync script:
```bash
export CONFLUENCE_BASE_URL="https://yourcompany.atlassian.net"
export CONFLUENCE_TOKEN="your-api-token"
export CONFLUENCE_EMAIL="your-email@company.com"
export CONFLUENCE_SPACES="SE,PROD,ENG"   # comma-separated space keys to sync
```

## Manual sync
```bash
claude "sync confluence"
# or directly:
bash scripts/sync-confluence.sh
```
