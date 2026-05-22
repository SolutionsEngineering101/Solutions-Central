# Graph API Setup — MS Forms → GitHub

This guide sets up the Python-based Microsoft Graph API integration that pulls
Microsoft Forms responses into `intake/solutions-forms/` automatically via GitHub Actions.

---

## How It Works

```
MS Forms ──► Graph API ──► pull_forms.py ──► intake/solutions-forms/*.md ──► GitHub Actions commit
```

- Runs daily at 8am UTC via GitHub Actions
- Skips already-saved responses (safe to re-run)
- Each response becomes a dated markdown file

---

## Part 1 — Azure App Registration

### Step 1: Create the app

1. Go to [portal.azure.com](https://portal.azure.com) and sign in with your Vantage Circle Microsoft 365 account
2. Search for **"App registrations"** in the top search bar
3. Click **+ New registration**
4. Fill in:
   - **Name:** `Solutions Central Forms Reader`
   - **Supported account types:** Accounts in this organizational directory only (single tenant)
   - **Redirect URI:** Leave blank
5. Click **Register**

### Step 2: Note your credentials

On the app's **Overview** page, copy:
- **Application (client) ID** → this is your `AZURE_CLIENT_ID`
- **Directory (tenant) ID** → this is your `AZURE_TENANT_ID`

### Step 3: Enable public client flows

1. In the left sidebar, click **Authentication**
2. Scroll to **Advanced settings**
3. Set **"Allow public client flows"** to **Yes**
4. Click **Save**

> This allows the device code login flow used in the first-time setup.

### Step 4: Add API permissions

1. In the left sidebar, click **API permissions**
2. Click **+ Add a permission**
3. Select **Microsoft Graph**
4. Select **Delegated permissions**
5. Search for and add:
   - `Forms.Read`
   - `offline_access` (allows refresh tokens)
6. Click **Add permissions**
7. Click **Grant admin consent for [your org]** → Confirm

> You need to be a Global Admin or have an admin grant consent.
> If you're not an admin, send this page to your IT/Azure admin.

---

## Part 2 — Get Your MS Form ID

1. Open [forms.microsoft.com](https://forms.microsoft.com)
2. Open the Solutions intake form
3. Click **Share** → **Copy link**
4. The URL looks like:
   ```
   https://forms.office.com/Pages/ResponsePage.aspx?id=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
   ```
5. The long string after `id=` is your **Form ID** (`MS_FORM_ID`)

> The form must be owned by the account you'll use to authenticate.
> If the form is under a shared mailbox or a colleague's account, transfer ownership first.

---

## Part 3 — First-Time Authentication (Local)

This generates a refresh token that GitHub Actions will use.

### Step 1: Install dependencies

```bash
cd /path/to/solutions-engineering
pip install -r scripts/requirements.txt
```

### Step 2: Create your local .env

```bash
cp scripts/.env.example scripts/.env
```

Edit `scripts/.env` and fill in `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, and `MS_FORM_ID`.

### Step 3: Run the auth flow

```bash
python scripts/pull_forms.py --init
```

This will print a URL and a code. Open the URL in your browser, enter the code,
and sign in with your Microsoft 365 account (the one that owns the form).

On success, you'll see:
```
✅ Refresh token saved to scripts/.refresh_token
```

### Step 4: Copy the refresh token

```bash
cat scripts/.refresh_token
```

Copy the entire output — you'll need it in Part 4.

---

## Part 4 — GitHub Actions Secrets

Go to your GitHub repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Add these four secrets:

| Secret name        | Value                             |
|--------------------|-----------------------------------|
| `AZURE_CLIENT_ID`  | From Part 1, Step 2               |
| `AZURE_TENANT_ID`  | From Part 1, Step 2               |
| `MS_FORM_ID`       | From Part 2                       |
| `MS_REFRESH_TOKEN` | From Part 3, Step 4 (full token)  |

---

## Part 5 — Test It

### Manual test (local)

```bash
python scripts/pull_forms.py
```

Expected output:
```
✅ Authenticated with Microsoft Graph
   Form has N question(s)
   Found N total response(s)
   ✅ Saved: intake/solutions-forms/SF-2026-05-22-abc12345.md
```

### Trigger GitHub Actions manually

1. Go to your repo on GitHub
2. Click **Actions** → **Pull MS Forms Responses**
3. Click **Run workflow** → **Run workflow**
4. Watch the logs

---

## Refresh Token Expiry

Microsoft refresh tokens expire after:
- **90 days** of not being used
- **1 year** maximum (even if used regularly)
- Immediately if the user's password is changed or MFA is reset

When it expires, GitHub Actions will fail with an auth error.
**Fix:** Run `python scripts/pull_forms.py --init` locally again, then update the `MS_REFRESH_TOKEN` secret in GitHub with the new token.

---

## Troubleshooting

| Error | Cause | Fix |
|---|---|---|
| `AADSTS70011` | Invalid scope | Verify `Forms.Read` is added and admin consent granted |
| `AADSTS65001` | Consent required | An admin must grant consent in the Azure portal |
| `Token refresh failed` | Refresh token expired | Re-run `--init` and update GitHub secret |
| `404 on /me/forms/...` | Wrong Form ID or wrong account | Check the form ID and that you're signed in as the form owner |
| `403 Forbidden` | Permissions not granted | Grant admin consent (Part 1, Step 4) |
