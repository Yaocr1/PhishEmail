## PhishBERT - Phishing Email Detector

PhishBERT is a full-stack phishing detection prototype that can:

- Analyze manual email text using a Hugging Face phishing model.
- Connect to Gmail with OAuth 2.0.
- Scan incoming Gmail messages and classify them as phishing or legitimate.
- Show results in an admin dashboard with live threat feed and metrics.

This project is designed for Final Year Project research + prototype demonstration.

---

## 1) Tech Stack

- Frontend: React + Vite + TypeScript
- Backend: Express + TypeScript
- Database: Prisma + SQLite
- Gmail Integration: Google OAuth 2.0 + Gmail API
- ML Inference: Hugging Face endpoint

---

## 2) Quick Local Setup

### Prerequisites

- Node.js 20+
- npm 10+
- A Google account

### Steps

1. Install dependencies

```bash
npm install
```

2. Create env file

```bash
cp .env.example .env
```

If you are on PowerShell:

```powershell
Copy-Item .env.example .env
```

3. Initialize Prisma and database

```bash
npx prisma generate
npx prisma db push
```

4. Start app

```bash
npm run dev
```

5. Open

- http://localhost:3000

---

## 3) Gmail OAuth Setup (First Time - Step by Step)

This section is for first-time OAuth users.

### Step A: Create Google Cloud Project

1. Open Google Cloud Console: https://console.cloud.google.com
2. Click project selector (top bar) -> New Project
3. Name it (example: PhishBERT)
4. Create

### Step B: Configure OAuth Consent Screen

1. In left menu: APIs & Services -> OAuth consent screen
2. Choose User Type: External
3. App name: PhishBERT
4. User support email: your Gmail
5. Developer contact email: your Gmail
6. Save and continue through scopes and summary
7. Add your own Gmail account in Test users

Important: In testing mode, only test users can connect.

### Step C: Enable Gmail API

1. APIs & Services -> Library
2. Search: Gmail API
3. Click Enable

### Step D: Create OAuth Client Credentials

1. APIs & Services -> Credentials
2. Create Credentials -> OAuth client ID
3. Application type: Web application
4. Name: PhishBERT Web Client

### Step E: Add Authorized URLs

For local development, add:

- Authorized JavaScript origins:
	- http://localhost:3000
- Authorized redirect URIs:
	- http://localhost:3000/auth/callback

For deployed backend (example: Render), also add:

- Authorized JavaScript origins:
	- https://your-backend-domain.com
- Authorized redirect URIs:
	- https://your-backend-domain.com/auth/callback

### Step F: Copy Client ID and Client Secret

After creating credentials, copy:

- Client ID
- Client Secret

Put them in `.env`:

```env
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
```

### Step G: Connect Gmail in App

1. Start app with `npm run dev`
2. Open Admin -> Integrations
3. Click Connect Account on Google Workspace (Gmail)
4. Approve Google permissions in popup
5. On success, popup closes and integration becomes Connected

---

## 4) Token Flow Explained (Where each token comes from)

You do not need to manually generate tokens.

- Client ID + Client Secret:
	- Source: Google Cloud Console -> Credentials
	- You copy these into `.env`

- Authorization Code:
	- Source: Google sends this to `/auth/callback` after you approve login

- Access Token + Refresh Token:
	- Source: Backend exchanges the Authorization Code with Google
	- Stored automatically in `SystemSetting` table by backend

To inspect stored values safely:

```bash
npx prisma studio
```

Open `SystemSetting` and verify:

- `gmailConnected = true`
- `gmailEmail` has your account
- token columns are populated

Never commit `.env` or token values.

---

## 5) How Gmail Email Checking Works

1. Connect Gmail via Integrations page
2. Open the Integrations page (live scan feed)
3. Backend requests Gmail messages, runs ML inference, stores results
4. Admin dashboard shows threat metrics and recent phishing detections

Tip: Use Force Sync in Integrations to refresh status manually.

---

## 6) Netlify Deployment (Frontend) - Ready Setup

This repo is prepared for Netlify frontend deploy via `netlify.toml`.

### Important architecture note

For reliable Gmail scanning, deploy frontend on Netlify and backend on an always-on Node host (Render/Railway/VPS).

Reason:
- Gmail scanning and DB token persistence are backend responsibilities.
- Netlify static hosting is perfect for frontend, but OAuth callback + Gmail API operations should run on backend service.

### Step-by-step (Frontend on Netlify)

1. Push repo to GitHub
2. In Netlify: Add new site -> Import from Git
3. Build settings:
	 - Build command: `npm run build`
	 - Publish directory: `dist`
4. Add environment variable in Netlify:
	 - `VITE_API_BASE_URL=https://your-backend-domain.com`
5. Deploy site

### Backend CORS setting

On your backend host, set:

```env
CORS_ORIGIN=https://your-netlify-site.netlify.app
```

If you use a custom domain, set that domain instead.

### Update Google OAuth URLs for production

In Google Cloud credentials, include backend production callback:

- Authorized JavaScript origins: `https://your-backend-domain.com`
- Authorized redirect URIs: `https://your-backend-domain.com/auth/callback`

---

## 7) Environment Variables

From `.env.example`:

```env
DATABASE_URL="file:./dev.db"
VITE_API_BASE_URL=""

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

HF_PHISHING_API_URL="https://alimusarizvi-phishing-email.hf.space/predict"
CORS_ORIGIN="http://localhost:3000"
```

---

## 8) Useful Commands

```bash
# Local dev
npm run dev

# Type-check
npm run lint

# Production frontend build
npm run build

# Open DB viewer
npx prisma studio
```

---

## 9) Troubleshooting

### OAuth popup closes but account not connected

- Check redirect URI exactly matches your backend URL + `/auth/callback`
- Ensure your Gmail is added as a Test User in OAuth consent screen
- Ensure Gmail API is enabled in Google Cloud project

### CORS errors on deployed frontend

- Set `CORS_ORIGIN` on backend to your Netlify domain
- Verify frontend `VITE_API_BASE_URL` points to backend URL

### No new Gmail messages appear

- Keep Integrations page open while testing live scan feed
- Verify `gmailConnected` in Prisma Studio
- Check server logs for Gmail API errors

---

## 10) Security Notes

- Do not commit `.env`
- Rotate Google client secret if leaked
- Use HTTPS in production for frontend/backend
- Restrict OAuth app to required scopes only


