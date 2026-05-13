#!/bin/bash
# sync-confluence.sh
# Pulls pages from Confluence and writes them to intake/confluence-sync/
# Requires: CONFLUENCE_BASE_URL, CONFLUENCE_TOKEN, CONFLUENCE_EMAIL, CONFLUENCE_SPACES

set -e

BASE_URL="${CONFLUENCE_BASE_URL}"
TOKEN="${CONFLUENCE_TOKEN}"
EMAIL="${CONFLUENCE_EMAIL}"
SPACES="${CONFLUENCE_SPACES:-SE}"
OUTPUT_DIR="intake/confluence-sync"
DATE=$(date +%Y-%m-%d)

if [ -z "$TOKEN" ] || [ -z "$BASE_URL" ] || [ -z "$EMAIL" ]; then
  echo "❌ Missing env vars. Set CONFLUENCE_BASE_URL, CONFLUENCE_TOKEN, CONFLUENCE_EMAIL"
  exit 1
fi

echo "🔄 Syncing Confluence spaces: $SPACES"

IFS=',' read -ra SPACE_LIST <<< "$SPACES"
for SPACE in "${SPACE_LIST[@]}"; do
  echo "  → Fetching space: $SPACE"

  RESPONSE=$(curl -s \
    -u "$EMAIL:$TOKEN" \
    -H "Accept: application/json" \
    "$BASE_URL/wiki/rest/api/content?spaceKey=$SPACE&expand=body.storage&limit=50")

  echo "$RESPONSE" | python3 -c "
import json, sys, re, os

data = json.load(sys.stdin)
results = data.get('results', [])
space = '${SPACE}'.lower()
output_dir = '${OUTPUT_DIR}'
date = '${DATE}'

for page in results:
    title = page.get('title', 'untitled')
    slug = re.sub(r'[^a-z0-9]+', '-', title.lower()).strip('-')
    body_html = page.get('body', {}).get('storage', {}).get('value', '')
    
    # Basic HTML to markdown (strip tags)
    import html
    text = html.unescape(re.sub('<[^>]+>', ' ', body_html))
    text = re.sub(r'\s+', ' ', text).strip()
    
    filename = f'{output_dir}/{space}-{slug}-{date}.md'
    
    with open(filename, 'w') as f:
        f.write(f'---\n')
        f.write(f'source: confluence\n')
        f.write(f'space: {space.upper()}\n')
        f.write(f'title: \"{title}\"\n')
        f.write(f'synced_at: {date}\n')
        f.write(f'page_id: {page.get(\"id\", \"\")}\n')
        f.write(f'---\n\n')
        f.write(f'# {title}\n\n')
        f.write(text)
    
    print(f'    ✅ Saved: {filename}')

print(f'  Done. {len(results)} pages synced from {space.upper()}.')
"
done

echo ""
echo "✅ Confluence sync complete. Committing..."
git add intake/confluence-sync/
git commit -m "sync: confluence $DATE" || echo "Nothing new to commit."
git push
echo "✅ Done."
