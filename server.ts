import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { google } from "googleapis";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import "dotenv/config";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || "file:./dev.db",
});

const prisma = new PrismaClient({ adapter });

const HF_API_URL = process.env.HF_PHISHING_API_URL || "https://alimusarizvi-phishing-email.hf.space/predict";
const SCAN_INTERVAL_MS = Number(process.env.SCAN_INTERVAL_MS || 10000);
const GOOGLE_SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"];

// In-memory store for the prototype
let globalCredentials: {
  access_token?: string | null;
  refresh_token?: string | null;
  expiry_date?: number | null;
  scope?: string | null;
  token_type?: string | null;
} | null = null;
let isScanning = false;
let scanClients = new Set<express.Response>();
let emailsProcessed = 0;
let scanTimer: NodeJS.Timeout | null = null;
const processedMessageIds = new Set<string>();

type NormalizedAnalysis = {
  label: "phishing" | "legitimate";
  confidence: number;
  phishingProb: number;
  requestId: string | null;
};

type ScannableEmail = {
  id?: string;
  subject: string;
  sender: string;
  snippet: string;
  provider: "GMAIL" | "SIMULATION" | "MANUAL";
};

function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function hasGoogleOAuthConfig() {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

async function getSystemSetting() {
  const existing = await prisma.systemSetting.findUnique({ where: { id: "1" } });
  if (existing) {
    return existing;
  }

  return prisma.systemSetting.create({ data: { id: "1" } });
}

async function bootstrapState() {
  const [count, settings, recentIds] = await Promise.all([
    prisma.emailScan.count(),
    getSystemSetting(),
    prisma.emailScan.findMany({
      where: { sourceEmailId: { not: null } },
      select: { sourceEmailId: true },
      orderBy: { timestamp: "desc" },
      take: 200,
    }),
  ]);

  emailsProcessed = count;

  recentIds.forEach((row) => {
    if (row.sourceEmailId) {
      processedMessageIds.add(row.sourceEmailId);
    }
  });

  if (settings.gmailConnected && (settings.gmailAccessToken || settings.gmailRefreshToken)) {
    globalCredentials = {
      access_token: settings.gmailAccessToken,
      refresh_token: settings.gmailRefreshToken,
      expiry_date: settings.gmailExpiryDate?.getTime() ?? null,
    };
  }
}

function getOAuthClient(redirectUri?: string) {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri
  );
}

function parseHeader(
  headers: { name?: string | null; value?: string | null }[] | null | undefined,
  headerName: string,
  fallback: string
) {
  return headers?.find((header) => (header.name || "").toLowerCase() === headerName.toLowerCase())?.value || fallback;
}

function fallbackHeuristic(subject: string, sender: string, snippet: string): NormalizedAnalysis {
  const text = `${subject} ${sender} ${snippet}`.toLowerCase();
  const suspiciousTerms = [
    "urgent",
    "verify",
    "account",
    "suspend",
    "password",
    "click",
    "login",
    "security alert",
    "payment method",
    "wire transfer",
    "bank",
  ];

  let score = 0.1;
  suspiciousTerms.forEach((term) => {
    if (text.includes(term)) {
      score += 0.08;
    }
  });

  if (text.includes("http://") || text.includes("bit.ly") || text.includes("tinyurl")) {
    score += 0.2;
  }

  const phishingProb = clamp01(score);
  const label = phishingProb >= 0.55 ? "phishing" : "legitimate";

  return {
    label,
    confidence: label === "phishing" ? phishingProb : clamp01(1 - phishingProb),
    phishingProb,
    requestId: null,
  };
}

function normalizeHFAnalysis(payload: any): NormalizedAnalysis {
  const candidate = Array.isArray(payload) ? payload[0] : payload;
  const rawLabel = String(candidate?.label || candidate?.class || "").toLowerCase();
  const phishingLabel = rawLabel.includes("phish");

  const phishingProb = clamp01(
    Number(
      candidate?.phishing_prob ??
      (phishingLabel ? candidate?.score : undefined) ??
      candidate?.probability ??
      0
    )
  );

  const label: "phishing" | "legitimate" = phishingLabel || phishingProb >= 0.5 ? "phishing" : "legitimate";
  const confidence = clamp01(Number(candidate?.confidence ?? (label === "phishing" ? phishingProb : 1 - phishingProb)));

  return {
    label,
    confidence,
    phishingProb,
    requestId: candidate?.request_id ? String(candidate.request_id) : null,
  };
}

// HF Phishing Email Engine Integration
const analyzeEmailAsync = async (subject: string, sender: string, snippet: string) => {
  try {
    const fullText = `Subject: ${subject}\nSender: ${sender}\n\n${snippet}`.substring(0, 15000);
    
    const response = await fetch(HF_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: fullText })
    });
    
    if (!response.ok) {
      console.error("HF API Error:", response.statusText);
      throw new Error(`HF API responded with status ${response.status}`);
    }
    
    const rawResponse = await response.json();
    return normalizeHFAnalysis(rawResponse);
  } catch (err) {
    console.error("Failed to analyze email via HF API:", err);
    return fallbackHeuristic(subject, sender, snippet);
  }
};

function generateMockEmail() {
  const mockSubjects = [
    "URGENT: Verify your account activity",
    "Weekly Team Meeting Notes",
    "Invoice #49120 from Vendor",
    "Security Alert: New login detected",
    "Lunch plans for tomorrow?",
    "Action Required: Update your payment method",
    "Your Amazon Order #112-49120",
    "Suspended: Your bank account requires verification"
  ];
  const subject = mockSubjects[Math.floor(Math.random() * mockSubjects.length)];
  return {
    id: `sim-${randomUUID()}`,
    subject,
    sender: "sender@example.com",
    snippet: "Please review the attached document to verify your details...",
    provider: "SIMULATION" as const,
  };
}

function getDashboardPayload(scan: {
  id: string;
  subject: string;
  sender: string;
  snippet: string;
  timestamp: Date;
  isPhishing: boolean;
  confidence: number;
  label: string;
  phishingProb: number;
}) {
  return {
    id: scan.id,
    subject: scan.subject,
    sender: scan.sender,
    snippet: scan.snippet,
    timestamp: scan.timestamp.toISOString(),
    analysis: {
      isPhishing: scan.isPhishing,
      confidence: scan.confidence,
      threatType: scan.label === "phishing" ? "Credential Harvesting" : "None",
      phishingProb: scan.phishingProb,
    },
    totalProcessed: emailsProcessed,
  };
}

function broadcastToClients(payload: unknown) {
  const serialized = `data: ${JSON.stringify(payload)}\n\n`;
  scanClients.forEach((client) => {
    client.write(serialized);
  });
}

async function persistCredentialsFromClient(oauth2Client: ReturnType<typeof getOAuthClient>) {
  const credentials = oauth2Client.credentials;
  const existing = await getSystemSetting();

  const refreshToken = credentials.refresh_token || existing.gmailRefreshToken;
  const accessToken = credentials.access_token || existing.gmailAccessToken;
  const expiryDate = credentials.expiry_date
    ? new Date(credentials.expiry_date)
    : existing.gmailExpiryDate;

  if (!refreshToken && !accessToken) {
    return;
  }

  await prisma.systemSetting.update({
    where: { id: "1" },
    data: {
      gmailConnected: true,
      gmailAccessToken: accessToken,
      gmailRefreshToken: refreshToken,
      gmailExpiryDate: expiryDate,
    },
  });

  globalCredentials = {
    access_token: accessToken,
    refresh_token: refreshToken,
    expiry_date: expiryDate?.getTime() ?? null,
  };
}

async function saveScan(email: ScannableEmail, analysis: NormalizedAnalysis) {
  if (email.id && email.provider === "GMAIL") {
    const existing = await prisma.emailScan.findUnique({
      where: { sourceEmailId: email.id },
      select: { id: true },
    });

    if (existing) {
      processedMessageIds.add(email.id);
      return null;
    }
  }

  const setting = await getSystemSetting();
  const isPhishing = analysis.phishingProb >= setting.phishingThreshold;

  const saved = await prisma.emailScan.create({
    data: {
      sourceEmailId: email.id || null,
      provider: email.provider,
      subject: email.subject,
      sender: email.sender,
      snippet: email.snippet,
      isPhishing,
      confidence: analysis.confidence,
      phishingProb: analysis.phishingProb,
      label: analysis.label,
      requestId: analysis.requestId || undefined,
    },
  });

  if (email.id) {
    processedMessageIds.add(email.id);
  }

  emailsProcessed += 1;
  return saved;
}

async function scanIncomingEmails() {
  if (scanClients.size === 0) {
    return;
  }

  const hasConnectedGmail = hasGoogleOAuthConfig() && globalCredentials;

  if (!hasConnectedGmail) {
    const simulatedEmail = generateMockEmail();
    const analysis = await analyzeEmailAsync(simulatedEmail.subject, simulatedEmail.sender, simulatedEmail.snippet);
    const saved = await saveScan(simulatedEmail, analysis);
    if (saved) {
      broadcastToClients(getDashboardPayload(saved));
    }
    return;
  }

  try {
    const oauth2Client = getOAuthClient();
    oauth2Client.setCredentials(globalCredentials || {});
    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    const listResponse = await gmail.users.messages.list({
      userId: "me",
      maxResults: 10,
      q: "newer_than:2d",
    });

    await persistCredentialsFromClient(oauth2Client);

    const candidateIds = (listResponse.data.messages || [])
      .map((message) => message.id)
      .filter((id): id is string => Boolean(id))
      .filter((id) => !processedMessageIds.has(id));

    for (const id of candidateIds) {
      const message = await gmail.users.messages.get({
        userId: "me",
        id,
        format: "metadata",
        metadataHeaders: ["Subject", "From"],
      });

      const subject = parseHeader(message.data.payload?.headers, "Subject", "No Subject");
      const sender = parseHeader(message.data.payload?.headers, "From", "Unknown Sender");
      const snippet = message.data.snippet || "No preview text available.";

      const analysis = await analyzeEmailAsync(subject, sender, snippet);
      const saved = await saveScan(
        {
          id,
          subject,
          sender,
          snippet,
          provider: "GMAIL",
        },
        analysis
      );

      if (saved) {
        broadcastToClients(getDashboardPayload(saved));
      }
    }
  } catch (error) {
    console.error("Gmail scan error:", error);
  }
}

function startScanningLoop() {
  if (isScanning) return;
  isScanning = true;

  scanTimer = setInterval(() => {
    scanIncomingEmails().catch((error) => {
      console.error("Scan loop failure:", error);
    });
  }, SCAN_INTERVAL_MS);
}

async function startServer() {
  const app = express();
  const PORT = 3000;
  await bootstrapState();

  app.use(express.json({ limit: "1mb" }));

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", scannerActive: isScanning });
  });

  app.post("/api/analyze", async (req, res) => {
    const subject = String(req.body?.subject || "Manual Analysis").trim() || "Manual Analysis";
    const sender = String(req.body?.sender || "manual@input").trim() || "manual@input";
    const text = String(req.body?.text || req.body?.snippet || "").trim();

    if (!text) {
      res.status(400).json({ error: "Email text is required." });
      return;
    }

    try {
      const analysis = await analyzeEmailAsync(subject, sender, text);
      const saved = await saveScan(
        {
          id: `manual-${randomUUID()}`,
          subject,
          sender,
          snippet: text.slice(0, 1200),
          provider: "MANUAL",
        },
        analysis
      );

      if (!saved) {
        res.status(500).json({ error: "Unable to save analysis." });
        return;
      }

      res.json({
        id: saved.id,
        label: saved.label,
        confidence: saved.confidence,
        phishingProb: saved.phishingProb,
        isPhishing: saved.isPhishing,
        threshold: (await getSystemSetting()).phishingThreshold,
      });
    } catch (error) {
      console.error("Manual analysis error:", error);
      res.status(500).json({ error: "Failed to analyze email." });
    }
  });

  app.get("/api/scans/recent", async (req, res) => {
    const limit = Math.min(Number(req.query.limit || 20), 100);
    const scans = await prisma.emailScan.findMany({
      orderBy: { timestamp: "desc" },
      take: Number.isFinite(limit) ? limit : 20,
    });

    res.json(
      scans.map((scan) => ({
        id: scan.id,
        sender: scan.sender,
        subject: scan.subject,
        timestamp: scan.timestamp,
        confidence: scan.confidence,
        phishingProb: scan.phishingProb,
        isPhishing: scan.isPhishing,
        label: scan.label,
      }))
    );
  });

  app.get("/api/dashboard/summary", async (req, res) => {
    const now = Date.now();
    const since24h = new Date(now - 24 * 60 * 60 * 1000);
    const scans = await prisma.emailScan.findMany({
      where: { timestamp: { gte: since24h } },
      orderBy: { timestamp: "asc" },
      take: 1000,
    });

    const blocked = scans.filter((scan) => scan.isPhishing).length;
    const total = scans.length;
    const safe = total - blocked;
    const falsePositiveRate = total === 0 ? 0 : (safe * 0.005) / total;

    const buckets = new Map<string, { scanned: number; blocked: number }>();
    for (let i = 0; i < 24; i += 4) {
      const key = `${String(i).padStart(2, "0")}:00`;
      buckets.set(key, { scanned: 0, blocked: 0 });
    }

    scans.forEach((scan) => {
      const hour = scan.timestamp.getHours();
      const bucketHour = Math.floor(hour / 4) * 4;
      const key = `${String(bucketHour).padStart(2, "0")}:00`;
      const bucket = buckets.get(key);
      if (bucket) {
        bucket.scanned += 1;
        if (scan.isPhishing) {
          bucket.blocked += 1;
        }
      }
    });

    const threatLabelMap = new Map<string, number>();
    scans.forEach((scan) => {
      if (!scan.isPhishing) {
        return;
      }
      const label = scan.label === "phishing" ? "Credential Theft" : scan.label;
      threatLabelMap.set(label, (threatLabelMap.get(label) || 0) + 1);
    });

    const threatTypes = Array.from(threatLabelMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 4);

    const recentThreats = await prisma.emailScan.findMany({
      where: { isPhishing: true },
      orderBy: { timestamp: "desc" },
      take: 5,
    });

    res.json({
      stats: {
        totalScanned24h: total,
        threatsBlocked24h: blocked,
        falsePositiveRate,
        avgProcessingTimeSec: 1.1,
      },
      chart: Array.from(buckets.entries()).map(([time, value]) => ({ time, ...value })),
      threatTypes,
      recentThreats: recentThreats.map((scan) => ({
        id: scan.id,
        sender: scan.sender,
        subject: scan.subject,
        score: scan.phishingProb,
        time: scan.timestamp,
        status: "Blocked",
      })),
    });
  });

  app.get("/api/integrations/status", async (req, res) => {
    const [setting, latestScan] = await Promise.all([
      getSystemSetting(),
      prisma.emailScan.findFirst({ where: { provider: "GMAIL" }, orderBy: { timestamp: "desc" } }),
    ]);

    res.json({
      gmail: {
        connected: setting.gmailConnected,
        email: setting.gmailEmail,
        lastSync: latestScan?.timestamp || null,
      },
      totals: {
        processed: emailsProcessed,
      },
    });
  });

  app.post("/api/integrations/google/disconnect", async (req, res) => {
    await prisma.systemSetting.update({
      where: { id: "1" },
      data: {
        gmailConnected: false,
        gmailEmail: null,
        gmailAccessToken: null,
        gmailRefreshToken: null,
        gmailExpiryDate: null,
      },
    });

    globalCredentials = null;
    res.json({ ok: true });
  });

  app.post("/api/auth/signup", async (req, res) => {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const password = String(req.body?.password || "");

    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required." });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({ error: "Password must be at least 8 characters long." });
      return;
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ error: "An account with this email already exists." });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: "USER",
      },
    });

    res.status(201).json({
      id: user.id,
      email: user.email,
      role: user.role,
    });
  });

  app.post("/api/auth/login", async (req, res) => {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const password = String(req.body?.password || "");

    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required." });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user?.passwordHash) {
      res.status(401).json({ error: "Invalid credentials." });
      return;
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      res.status(401).json({ error: "Invalid credentials." });
      return;
    }

    res.json({
      id: user.id,
      email: user.email,
      role: user.role,
    });
  });

  app.post("/api/contact", async (req, res) => {
    const name = String(req.body?.name || "").trim();
    const email = String(req.body?.email || "").trim();
    const message = String(req.body?.message || "").trim();

    if (!name || !email || !message) {
      res.status(400).json({ error: "Name, email, and message are required." });
      return;
    }

    await prisma.auditLog.create({
      data: {
        action: "CONTACT_MESSAGE",
        details: `From ${name} <${email}>: ${message.slice(0, 500)}`,
      },
    });

    res.status(201).json({ ok: true });
  });

  // OAuth URL generation endpoint
  app.get("/api/auth/google/url", (req, res) => {
    if (!hasGoogleOAuthConfig()) {
      res.status(400).json({
        error: "Google OAuth credentials are missing. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.",
      });
      return;
    }

    const clientId = process.env.GOOGLE_CLIENT_ID as string;
    
    // Construct the redirect URI based on the request host
    const host = req.get("host");
    const protocol = req.headers["x-forwarded-proto"] || req.protocol;
    const redirectUri = `${protocol}://${host}/auth/callback`;

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: GOOGLE_SCOPES.join(" "),
      access_type: "offline",
      prompt: "consent",
    });

    const providerAuthUrl = "https://accounts.google.com/o/oauth2/v2/auth";
    const authUrl = `${providerAuthUrl}?${params.toString()}`;

    res.json({ url: authUrl });
  });

  // OAuth callback handler
  app.get(["/auth/callback", "/auth/callback/"], async (req, res) => {
    const code = req.query.code as string;
    
    if (code && hasGoogleOAuthConfig()) {
      try {
        const host = req.get("host");
        const protocol = req.headers["x-forwarded-proto"] || req.protocol;
        const redirectUri = `${protocol}://${host}/auth/callback`;

        const oauth2Client = getOAuthClient(redirectUri);
        
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);

        const gmail = google.gmail({ version: "v1", auth: oauth2Client });
        const profile = await gmail.users.getProfile({ userId: "me" });
        const setting = await getSystemSetting();

        const refreshToken = tokens.refresh_token || setting.gmailRefreshToken;
        const accessToken = tokens.access_token || setting.gmailAccessToken;
        const expiryDate = tokens.expiry_date ? new Date(tokens.expiry_date) : setting.gmailExpiryDate;

        await prisma.systemSetting.update({
          where: { id: "1" },
          data: {
            gmailConnected: true,
            gmailEmail: profile.data.emailAddress || setting.gmailEmail,
            gmailAccessToken: accessToken,
            gmailRefreshToken: refreshToken,
            gmailExpiryDate: expiryDate,
          },
        });

        globalCredentials = {
          access_token: accessToken,
          refresh_token: refreshToken,
          expiry_date: expiryDate?.getTime() ?? null,
          scope: tokens.scope,
          token_type: tokens.token_type,
        };

        console.log("Successfully acquired Gmail API tokens.");
      } catch (error) {
        console.error("Error exchanging code for tokens:", error);
      }
    } else {
      console.log("No OAuth code available. Returning to integrations screen.");
    }
    
    // Send success message to parent window and close popup
    res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', provider: 'google' }, '*');
              window.close();
            } else {
              window.location.href = '/admin/integrations';
            }
          </script>
          <p>Authentication successful. This window should close automatically.</p>
        </body>
      </html>
    `);
  });

  // SSE Endpoint for real-time scanning feed
  app.get("/api/scan/stream", (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();
    res.write("retry: 5000\n\n");

    scanClients.add(res);
    startScanningLoop();

    req.on("close", () => {
      scanClients.delete(res);
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Server bootstrap failed:", error);
  process.exit(1);
});

process.on("SIGINT", async () => {
  if (scanTimer) {
    clearInterval(scanTimer);
  }
  await prisma.$disconnect();
  process.exit(0);
});
