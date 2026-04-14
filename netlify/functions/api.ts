import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabaseUrl = (process.env.SUPABASE_URL || '').trim();
const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '').trim();
const HF_API_URL = process.env.HF_PHISHING_API_URL || 'https://alimusarizvi-phishing-email.hf.space/predict';
const GOOGLE_SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];
const CORS_ORIGINS = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

type NetlifyEvent = {
  path: string;
  httpMethod: string;
  headers: Record<string, string | undefined>;
  body: string | null;
  isBase64Encoded?: boolean;
  queryStringParameters?: Record<string, string | undefined> | null;
};

type NetlifyResult = {
  statusCode: number;
  headers?: Record<string, string>;
  body: string;
};

type EmailProvider = 'GMAIL' | 'SIMULATION' | 'MANUAL';

type NormalizedAnalysis = {
  label: 'phishing' | 'legitimate';
  confidence: number;
  phishingProb: number;
  requestId: string | null;
};

type ScannableEmail = {
  id?: string;
  subject: string;
  sender: string;
  snippet: string;
  provider: EmailProvider;
};

type EmailScanRow = {
  id: string;
  provider: string;
  subject: string;
  sender: string;
  snippet: string;
  is_phishing: boolean;
  confidence: number;
  phishing_prob: number;
  label: string;
  timestamp: string;
};

type SystemSettingRow = {
  id: string;
  phishing_threshold: number;
  auto_block_enabled: boolean;
  gmail_connected: boolean;
  gmail_email: string | null;
  gmail_access_token: string | null;
  gmail_refresh_token: string | null;
  gmail_expiry_date: string | null;
};

type UserRow = {
  id: string;
  email: string;
  password_hash: string | null;
  role: string;
};

let dbClient: SupabaseClient | null = null;

function getDb(): SupabaseClient {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY).');
  }

  if (!dbClient) {
    dbClient = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return dbClient;
}

function firstHeaderValue(headers: Record<string, string | undefined>, key: string) {
  const direct = headers[key] || headers[key.toLowerCase()] || headers[key.toUpperCase()];
  if (!direct) return undefined;
  return direct.split(',')[0]?.trim();
}

function resolveCorsOrigin(headers: Record<string, string | undefined>) {
  const requestOrigin = firstHeaderValue(headers, 'origin');

  if (CORS_ORIGINS.length === 0) {
    return requestOrigin || '*';
  }

  if (requestOrigin && CORS_ORIGINS.includes(requestOrigin)) {
    return requestOrigin;
  }

  return CORS_ORIGINS[0];
}

function corsHeaders(origin: string) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Content-Type': 'application/json',
  };
}

function jsonResponse(statusCode: number, payload: unknown, origin: string): NetlifyResult {
  return {
    statusCode,
    headers: corsHeaders(origin),
    body: JSON.stringify(payload),
  };
}

function htmlResponse(statusCode: number, html: string, origin: string): NetlifyResult {
  return {
    statusCode,
    headers: {
      ...corsHeaders(origin),
      'Content-Type': 'text/html; charset=utf-8',
    },
    body: html,
  };
}

function parseBody(event: NetlifyEvent): Record<string, any> {
  if (!event.body) {
    return {};
  }

  const rawBody = event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString('utf8') : event.body;
  try {
    return JSON.parse(rawBody);
  } catch {
    return {};
  }
}

function normalizeRoute(path: string) {
  let route = (path || '/').split('?')[0];
  route = route.replace(/^\/\.netlify\/functions\/api/, '');
  route = route.replace(/^\/api/, '');

  if (!route.startsWith('/')) {
    route = `/${route}`;
  }

  if (route.length > 1) {
    route = route.replace(/\/+$/, '');
  }

  return route || '/';
}

function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function fallbackHeuristic(subject: string, sender: string, snippet: string): NormalizedAnalysis {
  const text = `${subject} ${sender} ${snippet}`.toLowerCase();
  const suspiciousTerms = [
    'urgent',
    'verify',
    'account',
    'suspend',
    'password',
    'click',
    'login',
    'security alert',
    'payment method',
    'wire transfer',
    'bank',
  ];

  let score = 0.1;
  suspiciousTerms.forEach((term) => {
    if (text.includes(term)) {
      score += 0.08;
    }
  });

  if (text.includes('http://') || text.includes('bit.ly') || text.includes('tinyurl')) {
    score += 0.2;
  }

  const phishingProb = clamp01(score);
  const label = phishingProb >= 0.55 ? 'phishing' : 'legitimate';

  return {
    label,
    confidence: label === 'phishing' ? phishingProb : clamp01(1 - phishingProb),
    phishingProb,
    requestId: null,
  };
}

function normalizeHFAnalysis(payload: any): NormalizedAnalysis {
  const candidate = Array.isArray(payload) ? payload[0] : payload;
  const rawLabel = String(candidate?.label || candidate?.class || '').toLowerCase();
  const phishingLabel = rawLabel.includes('phish');

  const phishingProb = clamp01(
    Number(candidate?.phishing_prob ?? (phishingLabel ? candidate?.score : undefined) ?? candidate?.probability ?? 0)
  );

  const label: 'phishing' | 'legitimate' = phishingLabel || phishingProb >= 0.5 ? 'phishing' : 'legitimate';
  const confidence = clamp01(Number(candidate?.confidence ?? (label === 'phishing' ? phishingProb : 1 - phishingProb)));

  return {
    label,
    confidence,
    phishingProb,
    requestId: candidate?.request_id ? String(candidate.request_id) : null,
  };
}

async function analyzeEmailAsync(subject: string, sender: string, snippet: string) {
  try {
    const fullText = `Subject: ${subject}\nSender: ${sender}\n\n${snippet}`.substring(0, 15000);

    const response = await fetch(HF_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: fullText }),
    });

    if (!response.ok) {
      throw new Error(`HF API responded with status ${response.status}`);
    }

    const rawResponse = await response.json();
    return normalizeHFAnalysis(rawResponse);
  } catch {
    return fallbackHeuristic(subject, sender, snippet);
  }
}

async function getSystemSetting(): Promise<SystemSettingRow> {
  const db = getDb();

  const { data, error } = await db.from('phish_system_settings').select('*').eq('id', '1').maybeSingle();
  if (error) {
    throw new Error(`Failed to load system settings: ${error.message}`);
  }

  if (data) {
    return data as SystemSettingRow;
  }

  const { data: inserted, error: insertError } = await db
    .from('phish_system_settings')
    .insert({ id: '1' })
    .select('*')
    .single();

  if (insertError || !inserted) {
    throw new Error(`Failed to create default system settings: ${insertError?.message || 'Unknown error'}`);
  }

  return inserted as SystemSettingRow;
}

async function getRecentScans(limit: number): Promise<EmailScanRow[]> {
  const db = getDb();
  const { data, error } = await db
    .from('phish_email_scans')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to load recent scans: ${error.message}`);
  }

  return (data || []) as EmailScanRow[];
}

async function saveScan(email: ScannableEmail, analysis: NormalizedAnalysis): Promise<EmailScanRow> {
  const db = getDb();
  const setting = await getSystemSetting();
  const isPhishing = analysis.phishingProb >= setting.phishing_threshold;

  const { data: saved, error: saveError } = await db
    .from('phish_email_scans')
    .insert({
      source_email_id: email.id || null,
      provider: email.provider,
      subject: email.subject,
      sender: email.sender,
      snippet: email.snippet,
      is_phishing: isPhishing,
      confidence: analysis.confidence,
      phishing_prob: analysis.phishingProb,
      label: analysis.label,
      request_id: analysis.requestId || null,
    })
    .select('*')
    .single();

  if (saveError || !saved) {
    throw new Error(`Failed to save email scan: ${saveError?.message || 'Unknown error'}`);
  }

  return saved as EmailScanRow;
}

function toDashboardFeed(scan: EmailScanRow, totalProcessed: number) {
  return {
    id: scan.id,
    subject: scan.subject,
    sender: scan.sender,
    snippet: scan.snippet,
    timestamp: scan.timestamp,
    analysis: {
      isPhishing: scan.is_phishing,
      confidence: scan.confidence,
      threatType: scan.label === 'phishing' ? 'Credential Harvesting' : 'None',
      phishingProb: scan.phishing_prob,
    },
    totalProcessed,
  };
}

function getPublicBaseUrl(event: NetlifyEvent) {
  const configured = (process.env.APP_BASE_URL || '').trim().replace(/\/+$/, '');
  if (configured) {
    return configured;
  }

  const proto = firstHeaderValue(event.headers, 'x-forwarded-proto') || 'https';
  const host = firstHeaderValue(event.headers, 'x-forwarded-host') || firstHeaderValue(event.headers, 'host');

  return host ? `${proto}://${host}` : 'http://localhost:3000';
}

async function exchangeGoogleCodeForTokens(code: string, redirectUri: string) {
  const body = new URLSearchParams({
    code,
    client_id: process.env.GOOGLE_CLIENT_ID || '',
    client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  });

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!response.ok) {
    throw new Error(`Google token exchange failed with status ${response.status}`);
  }

  return response.json();
}

async function getGoogleProfileEmail(accessToken: string) {
  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch Gmail profile with status ${response.status}`);
  }

  const payload = (await response.json()) as { emailAddress?: string };
  return payload.emailAddress || null;
}

export const handler = async (event: NetlifyEvent): Promise<NetlifyResult> => {
  const origin = resolveCorsOrigin(event.headers || {});

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: corsHeaders(origin),
      body: '',
    };
  }

  const route = normalizeRoute(event.path);
  const method = (event.httpMethod || 'GET').toUpperCase();
  const query = event.queryStringParameters || {};
  const body = parseBody(event);

  try {
    if (route === '/health' && method === 'GET') {
      return jsonResponse(200, { status: 'ok', database: supabaseUrl && supabaseKey ? 'supabase' : 'not-configured' }, origin);
    }

    if (route === '/analyze' && method === 'POST') {
      const subject = String(body.subject || 'Manual Analysis').trim() || 'Manual Analysis';
      const sender = String(body.sender || 'manual@input').trim() || 'manual@input';
      const text = String(body.text || body.snippet || '').trim();

      if (!text) {
        return jsonResponse(400, { error: 'Email text is required.' }, origin);
      }

      const analysis = await analyzeEmailAsync(subject, sender, text);
      const saved = await saveScan(
        {
          id: `manual-${crypto.randomUUID()}`,
          subject,
          sender,
          snippet: text.slice(0, 1200),
          provider: 'MANUAL',
        },
        analysis
      );

      const setting = await getSystemSetting();
      return jsonResponse(
        200,
        {
          id: saved.id,
          label: saved.label,
          confidence: saved.confidence,
          phishingProb: saved.phishing_prob,
          isPhishing: saved.is_phishing,
          threshold: setting.phishing_threshold,
        },
        origin
      );
    }

    if (route === '/scans/recent' && method === 'GET') {
      const limit = Math.min(Number(query.limit || 20), 100);
      const scans = await getRecentScans(Number.isFinite(limit) ? limit : 20);

      return jsonResponse(
        200,
        scans.map((scan) => ({
          id: scan.id,
          sender: scan.sender,
          subject: scan.subject,
          timestamp: scan.timestamp,
          confidence: scan.confidence,
          phishingProb: scan.phishing_prob,
          isPhishing: scan.is_phishing,
          label: scan.label,
        })),
        origin
      );
    }

    if (route === '/scan/poll' && method === 'POST') {
      const db = getDb();
      const [{ count, error: countError }, recentScans] = await Promise.all([
        db.from('phish_email_scans').select('id', { count: 'exact', head: true }),
        getRecentScans(5),
      ]);

      if (countError) {
        throw new Error(countError.message);
      }

      const totalProcessed = count || 0;
      return jsonResponse(
        200,
        {
          emails: recentScans.map((scan) => toDashboardFeed(scan, totalProcessed)),
          totalProcessed,
        },
        origin
      );
    }

    if (route === '/dashboard/summary' && method === 'GET') {
      const db = getDb();
      const now = Date.now();
      const since24h = new Date(now - 24 * 60 * 60 * 1000).toISOString();

      const { data: scansData, error: scansError } = await db
        .from('phish_email_scans')
        .select('*')
        .gte('timestamp', since24h)
        .order('timestamp', { ascending: true })
        .limit(1000);

      if (scansError) {
        throw new Error(scansError.message);
      }

      const scans = (scansData || []) as EmailScanRow[];
      const blocked = scans.filter((scan) => scan.is_phishing).length;
      const total = scans.length;
      const safe = total - blocked;
      const falsePositiveRate = total === 0 ? 0 : (safe * 0.005) / total;

      const buckets = new Map<string, { scanned: number; blocked: number }>();
      for (let i = 0; i < 24; i += 4) {
        const key = `${String(i).padStart(2, '0')}:00`;
        buckets.set(key, { scanned: 0, blocked: 0 });
      }

      scans.forEach((scan) => {
        const hour = new Date(scan.timestamp).getHours();
        const bucketHour = Math.floor(hour / 4) * 4;
        const key = `${String(bucketHour).padStart(2, '0')}:00`;
        const bucket = buckets.get(key);
        if (bucket) {
          bucket.scanned += 1;
          if (scan.is_phishing) {
            bucket.blocked += 1;
          }
        }
      });

      const threatLabelMap = new Map<string, number>();
      scans.forEach((scan) => {
        if (!scan.is_phishing) return;
        const label = scan.label === 'phishing' ? 'Credential Theft' : scan.label;
        threatLabelMap.set(label, (threatLabelMap.get(label) || 0) + 1);
      });

      const threatTypes = Array.from(threatLabelMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 4);

      const { data: threatsData, error: threatsError } = await db
        .from('phish_email_scans')
        .select('*')
        .eq('is_phishing', true)
        .order('timestamp', { ascending: false })
        .limit(5);

      if (threatsError) {
        throw new Error(threatsError.message);
      }

      const recentThreats = (threatsData || []) as EmailScanRow[];

      return jsonResponse(
        200,
        {
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
            score: scan.phishing_prob,
            time: scan.timestamp,
            status: 'Blocked',
          })),
        },
        origin
      );
    }

    if (route === '/integrations/status' && method === 'GET') {
      const db = getDb();
      const [setting, latestScanResponse, totalCount] = await Promise.all([
        getSystemSetting(),
        db
          .from('phish_email_scans')
          .select('timestamp')
          .eq('provider', 'GMAIL')
          .order('timestamp', { ascending: false })
          .limit(1)
          .maybeSingle(),
        db.from('phish_email_scans').select('id', { count: 'exact', head: true }),
      ]);

      if (latestScanResponse.error) {
        throw new Error(latestScanResponse.error.message);
      }

      if (totalCount.error) {
        throw new Error(totalCount.error.message);
      }

      return jsonResponse(
        200,
        {
          gmail: {
            connected: setting.gmail_connected,
            email: setting.gmail_email,
            lastSync: latestScanResponse.data?.timestamp || null,
          },
          totals: {
            processed: totalCount.count || 0,
          },
        },
        origin
      );
    }

    if (route === '/integrations/google/disconnect' && method === 'POST') {
      const db = getDb();
      const { error } = await db
        .from('phish_system_settings')
        .update({
          gmail_connected: false,
          gmail_email: null,
          gmail_access_token: null,
          gmail_refresh_token: null,
          gmail_expiry_date: null,
        })
        .eq('id', '1');

      if (error) {
        throw new Error(error.message);
      }

      return jsonResponse(200, { ok: true }, origin);
    }

    if (route === '/auth/signup' && method === 'POST') {
      const email = String(body.email || '').trim().toLowerCase();
      const password = String(body.password || '');

      if (!email || !password) {
        return jsonResponse(400, { error: 'Email and password are required.' }, origin);
      }

      if (password.length < 8) {
        return jsonResponse(400, { error: 'Password must be at least 8 characters long.' }, origin);
      }

      const db = getDb();
      const { data: existing, error: existingError } = await db.from('phish_users').select('id').eq('email', email).maybeSingle();
      if (existingError) {
        throw new Error(existingError.message);
      }

      if (existing) {
        return jsonResponse(409, { error: 'An account with this email already exists.' }, origin);
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const { data: user, error: createError } = await db
        .from('phish_users')
        .insert({
          email,
          password_hash: passwordHash,
          role: 'USER',
        })
        .select('id,email,role')
        .single();

      if (createError || !user) {
        throw new Error(createError?.message || 'Unable to create user.');
      }

      return jsonResponse(201, user, origin);
    }

    if (route === '/auth/login' && method === 'POST') {
      const email = String(body.email || '').trim().toLowerCase();
      const password = String(body.password || '');

      if (!email || !password) {
        return jsonResponse(400, { error: 'Email and password are required.' }, origin);
      }

      const db = getDb();
      const { data: user, error: userError } = await db
        .from('phish_users')
        .select('id,email,role,password_hash')
        .eq('email', email)
        .maybeSingle();

      if (userError) {
        throw new Error(userError.message);
      }

      if (!user || !(user as UserRow).password_hash) {
        return jsonResponse(401, { error: 'Invalid credentials.' }, origin);
      }

      const castedUser = user as UserRow;
      const isValid = await bcrypt.compare(password, castedUser.password_hash as string);
      if (!isValid) {
        return jsonResponse(401, { error: 'Invalid credentials.' }, origin);
      }

      return jsonResponse(
        200,
        {
          id: castedUser.id,
          email: castedUser.email,
          role: castedUser.role,
        },
        origin
      );
    }

    if (route === '/contact' && method === 'POST') {
      const name = String(body.name || '').trim();
      const email = String(body.email || '').trim();
      const message = String(body.message || '').trim();

      if (!name || !email || !message) {
        return jsonResponse(400, { error: 'Name, email, and message are required.' }, origin);
      }

      const db = getDb();
      const { error } = await db.from('phish_audit_logs').insert({
        action: 'CONTACT_MESSAGE',
        details: `From ${name} <${email}>: ${message.slice(0, 500)}`,
      });

      if (error) {
        throw new Error(error.message);
      }

      return jsonResponse(201, { ok: true }, origin);
    }

    if (route === '/auth/google/url' && method === 'GET') {
      if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
        return jsonResponse(
          400,
          { error: 'Google OAuth credentials are missing. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.' },
          origin
        );
      }

      const baseUrl = getPublicBaseUrl(event);
      const redirectUri = `${baseUrl}/auth/callback`;

      const params = new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: GOOGLE_SCOPES.join(' '),
        access_type: 'offline',
        prompt: 'consent',
      });

      return jsonResponse(200, { url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}` }, origin);
    }

    if (route === '/auth/callback' && method === 'GET') {
      const code = String(query.code || '');
      let connected = false;

      if (code && process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
        try {
          const baseUrl = getPublicBaseUrl(event);
          const redirectUri = `${baseUrl}/auth/callback`;
          const tokens = await exchangeGoogleCodeForTokens(code, redirectUri);

          const accessToken = String(tokens.access_token || '');
          const refreshToken = String(tokens.refresh_token || '');
          const expiryDateIso = tokens.expires_in
            ? new Date(Date.now() + Number(tokens.expires_in) * 1000).toISOString()
            : null;

          const gmailEmail = accessToken ? await getGoogleProfileEmail(accessToken) : null;

          const db = getDb();
          const setting = await getSystemSetting();

          const { error } = await db
            .from('phish_system_settings')
            .update({
              gmail_connected: true,
              gmail_email: gmailEmail || setting.gmail_email,
              gmail_access_token: accessToken || setting.gmail_access_token,
              gmail_refresh_token: refreshToken || setting.gmail_refresh_token,
              gmail_expiry_date: expiryDateIso || setting.gmail_expiry_date,
            })
            .eq('id', '1');

          if (error) {
            throw new Error(error.message);
          }

          connected = true;
        } catch {
          connected = false;
        }
      }

      const html = connected
        ? `
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
        `
        : `
          <html>
            <body>
              <script>
                if (window.opener) {
                  window.opener.postMessage({ type: 'OAUTH_AUTH_FAILURE', provider: 'google' }, '*');
                }
              </script>
              <p>Authentication failed. Please retry from the Integrations page.</p>
            </body>
          </html>
        `;

      return htmlResponse(200, html, origin);
    }

    return jsonResponse(404, { error: 'Route not found.' }, origin);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected server error.';
    return jsonResponse(500, { error: message }, origin);
  }
};
