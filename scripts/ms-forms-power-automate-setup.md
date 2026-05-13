# Microsoft Forms → GitHub Integration
## via Power Automate

This guide sets up automatic routing of MS Forms responses into the repo.

---

## Prerequisites
- Microsoft 365 account with Power Automate access
- GitHub Personal Access Token with `repo` scope
- Your MS Form already created

---

## Power Automate Flow Setup

### Step 1 — Create a new Flow
1. Go to [flow.microsoft.com](https://flow.microsoft.com)
2. Click **+ Create** → **Automated cloud flow**
3. Name it: `Solutions Form → GitHub`
4. Trigger: Search for **"Microsoft Forms"** → select **"When a new response is submitted"**
5. Select your Solutions Form

### Step 2 — Get form response details
1. Add action: **Microsoft Forms → Get response details**
2. Form ID: same form
3. Response ID: from trigger

### Step 3 — Format the content
1. Add action: **Data Operation → Compose**
2. Paste this template (fill in your actual question IDs from the form):

```
---
form_id: "SF-@{utcNow('yyyyMMddHHmmss')}"
submitted_at: "@{utcNow()}"
submitted_by: "@{outputs('Get_response_details')?['body/responder']}"
client_name: "@{outputs('Get_response_details')?['body/r1234567']}"
problem_statement: "@{outputs('Get_response_details')?['body/r2345678']}"
requirements: "@{outputs('Get_response_details')?['body/r3456789']}"
constraints: "@{outputs('Get_response_details')?['body/r4567890']}"
timeline: "@{outputs('Get_response_details')?['body/r5678901']}"
priority: "@{outputs('Get_response_details')?['body/r6789012']}"
status: new
---

# New Solution Request — @{utcNow('yyyy-MM-dd')}

Submitted by: @{outputs('Get_response_details')?['body/responder']}
```

> **Note:** Replace `r1234567` etc. with your actual question field IDs from the form.
> You can find these in Power Automate's dynamic content panel.

### Step 4 — Write to GitHub
1. Add action: **HTTP**
2. Method: `PUT`
3. URI: 
```
https://api.github.com/repos/[YOUR-ORG]/solutions-engineering/contents/intake/solutions-forms/SF-@{utcNow('yyyyMMddHHmmss')}.md
```
4. Headers:
```json
{
  "Authorization": "token YOUR_GITHUB_PAT",
  "Content-Type": "application/json",
  "Accept": "application/vnd.github.v3+json"
}
```
5. Body:
```json
{
  "message": "intake: new solution form @{utcNow('yyyy-MM-dd')}",
  "content": "@{base64(outputs('Compose'))}"
}
```

### Step 5 — Test & Save
- Submit a test form response
- Check `intake/solutions-forms/` in GitHub for the new file
- Save the flow

---

## Troubleshooting

| Issue | Fix |
|---|---|
| 401 Unauthorized | Check GitHub PAT has `repo` scope |
| File not appearing | Check the URI path matches your repo exactly |
| Encoding errors | Make sure content is wrapped in `base64()` |

---

## Once working
Run in Claude Code terminal:
```bash
claude "process new solution form"
```
Claude will pick up the latest file automatically.
