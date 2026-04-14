# PhishBERT (Supabase Edition)

PhishBERT is a phishing email detection system that:
- Connects to Gmail using OAuth 2.0
- Pulls incoming emails (read-only scope)
- Scores each email using your Hugging Face model API
- Stores results in Supabase
- Shows analysis in the admin dashboard

This README is written for first-time users.

---

## 1. What Changed

Prisma/SQLite has been removed.

The project now uses:
- `@supabase/supabase-js` from backend (`server.ts`)
- Supabase tables created from:
  - `supabase/schema_and_seed.sql`

---

## 2. First-Time Setup (Local)

### Requirements
- Node.js 20+
- npm 10+
- Supabase account (free)
- Google account

### Install packages

```bash
npm install
```

### Create environment file

```powershell
Copy-Item .env.example .env
```

Set values in `.env`:

```env
SUPABASE_URL="https://YOUR_PROJECT_REF.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="YOUR_SERVICE_ROLE_KEY"
SUPABASE_ANON_KEY="" # optional fallback for quick setup, do not prefer in production
VITE_API_BASE_URL="http://localhost:3000"
VITE_HF_FALLBACK_URL="https://alimusarizvi-phishing-email.hf.space/predict"
APP_BASE_URL="http://localhost:3000"
PORT="3000"

GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

HF_PHISHING_API_URL="https://alimusarizvi-phishing-email.hf.space/predict"
CORS_ORIGIN="http://localhost:3000"
SCAN_INTERVAL_MS="10000"
```

Where to get Supabase values:
- Supabase Dashboard -> Project Settings -> Data API (or API)
- Copy `Project URL` into `SUPABASE_URL`
- Copy `service_role` key into `SUPABASE_SERVICE_ROLE_KEY` (recommended for backend)
- If needed for quick setup, use `anon` key in `SUPABASE_ANON_KEY`

### Start app

```bash
npm run dev
```

Open: `http://localhost:3000`

---

## 3. Create Supabase Tables in Browser (and Seed Data)

You asked to add tables in browser and create data from file.

### Step-by-step

1. Open Supabase Dashboard: `https://supabase.com/dashboard`
2. Open your project
3. Go to `SQL Editor`
4. Open file `supabase/schema_and_seed.sql`
5. Copy full SQL
6. Paste into SQL Editor
7. Click `Run`

This creates and seeds:
- `phish_users`
- `phish_email_scans`
- `phish_system_settings`
- `phish_audit_logs`

Migration status for your environment:
- The schema has already been applied to your Supabase project `Browser Extension for Real-Time Website Security` (ref: `pllqinlgjkmmumfqlfjn`).
- You can verify in Supabase Table Editor that `phish_system_settings` contains row `id = '1'`.

It also inserts sample records.

---

## 4. How to Get Google Auth + Gmail API for Free (Beginner Friendly)

You only need a free Google Cloud project.

### A) Create Google Cloud Project

1. Open `https://console.cloud.google.com`
2. Top project selector -> `New Project`
3. Name it (example: `PhishBERT`)
4. Create

### B) Configure OAuth Consent Screen

1. `APIs & Services` -> `OAuth consent screen`
2. User type: `External`
3. Fill app name, support email, developer email
4. Save and continue
5. Add your Gmail to `Test users`

### C) Enable Gmail API

1. `APIs & Services` -> `Library`
2. Search `Gmail API`
3. Click `Enable`

### D) Create OAuth Client ID

1. `APIs & Services` -> `Credentials`
2. `Create Credentials` -> `OAuth client ID`
3. Application type: `Web application`
4. Add Authorized URLs

For local development:
- Authorized JavaScript origins: `http://localhost:3000`
- Authorized redirect URIs: `http://localhost:3000/auth/callback`

For production backend (example):
- Authorized JavaScript origins: `https://your-backend-domain.com`
- Authorized redirect URIs: `https://your-backend-domain.com/auth/callback`

Set this in backend env too:
- `APP_BASE_URL="https://your-backend-domain.com"`

5. Create
6. Copy:
- Client ID
- Client Secret

### E) Put Credentials in `.env`

```env
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
```

### F) Connect Gmail in App

1. Start app (`npm run dev`)
2. Open `Admin -> Integrations`
3. Click `Connect Account` under Gmail
4. Login and grant permission

After success:
- `phish_system_settings.gmail_connected = true`
- `gmail_access_token` / `gmail_refresh_token` are saved in Supabase

---

## 5. Token Flow (Simple Explanation)

You do NOT manually generate tokens.

1. You provide `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
2. Google redirects to `/auth/callback` with auth code
3. Backend exchanges code for:
- access token
- refresh token
4. Backend stores tokens in `phish_system_settings`
5. Scanner uses tokens to read Gmail messages and score them

---

## 6. Netlify Deployment (Frontend)

This repo includes `netlify.toml` for frontend deploy.

### Important
Gmail OAuth callback + inbox scanning must run on backend server (not static frontend alone).

Recommended architecture:
- Frontend: Netlify
- Backend API (`server.ts`): Render/Railway/Fly.io/VPS
- Database: Supabase

### Netlify steps

1. Import GitHub repo in Netlify
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Add env var in Netlify:

```env
VITE_API_BASE_URL="https://your-backend-domain.com"
VITE_HF_FALLBACK_URL="https://alimusarizvi-phishing-email.hf.space/predict"
```

If backend is temporarily unavailable, the Home page demo falls back to `VITE_HF_FALLBACK_URL` so the live analysis button still works.

5. Deploy

### Backend env for CORS

On backend host:

```env
CORS_ORIGIN="https://your-netlify-site.netlify.app"
```

If custom domain, use that domain.

---

## 7. Push New DB Changes to Supabase (When Schema Changes)

For this project, easiest workflow is SQL Editor:

1. Update SQL migration file(s) in repo
2. Open Supabase SQL Editor
3. Paste new SQL
4. Run

Current schema + seed file:
- `supabase/schema_and_seed.sql`

---

## 8. Production-Ready Checklist

- Backend has required env vars: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `HF_PHISHING_API_URL`, `APP_BASE_URL`, `CORS_ORIGIN`
- Optional fallback if service key is unavailable: `SUPABASE_ANON_KEY` (backend only; limited privileges may apply)
- Frontend has `VITE_API_BASE_URL` set to your backend URL
- Google OAuth client has exact production origin and callback URL
- `CORS_ORIGIN` includes your deployed frontend domain
- Backend `/api/health` returns `status: ok`
- Supabase table `phish_system_settings` has row `id = '1'`
- Service role key is used only on backend (never in frontend)

---

## 9. Useful Commands

```bash
npm run dev
npm run lint
npm run build
```

---

## 10. Troubleshooting

### `Supabase is not configured`
Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env`.

### OAuth popup works but account not connected
- Check redirect URI exactly matches (`/auth/callback`)
- Ensure your email is in OAuth `Test users`
- Ensure Gmail API is enabled

### CORS errors on deployed frontend
- Set `VITE_API_BASE_URL` in Netlify
- Set `CORS_ORIGIN` in backend env

---

## 11. Security Notes

- Never expose `SUPABASE_SERVICE_ROLE_KEY` in frontend
- Keep `.env` out of git
- Use HTTPS in production
- Rotate secrets if leaked
