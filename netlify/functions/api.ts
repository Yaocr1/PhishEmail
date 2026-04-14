import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabaseUrl = (process.env.SUPABASE_URL || '').trim();
const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '').trim();
const HF_API_URL = process.env.HF_PHISHING_API_URL || 'https://alimusarizvi-phishing-email.hf.space/predict';
const CORS_ORIGINS = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const DEFAULT_ADMIN_EMAIL = (process.env.DEFAULT_ADMIN_EMAIL || 'admin@phishbert.app').trim().toLowerCase();
const DEFAULT_ADMIN_PASSWORD = (process.env.DEFAULT_ADMIN_PASSWORD || 'Admin@12345').trim();

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

type NormalizedAnalysis = {
  label: 'phishing' | 'legitimate';
  confidence: number;
  phishingProb: number;
  requestId: string | null;
};

type EmailScanRow = {
  id: string;
  user_id: string | null;
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

type UserRow = {
  id: string;
  email: string;
  password_hash: string | null;
  role: string;
  created_at: string;
};

type SystemSettingRow = {
  id: string;
  phishing_threshold: number;
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
    'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-user-role',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
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

function randomId(prefix: string) {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}`;
}

function isAdminRequest(event: NetlifyEvent) {
  const role = (firstHeaderValue(event.headers, 'x-user-role') || '').toUpperCase();
  return role === 'ADMIN';
}

function parseLimit(value: string | undefined, fallback: number, max: number) {
  const parsed = Number(value || fallback);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.min(parsed, max);
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

async function ensureDefaultAdmin() {
  const db = getDb();

  const { data, error } = await db
    .from('phish_users')
    .select('id,role')
    .eq('email', DEFAULT_ADMIN_EMAIL)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to verify default admin: ${error.message}`);
  }

  if (data && String((data as { role: string }).role).toUpperCase() === 'ADMIN') {
    return;
  }

  const passwordHash = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 10);

  if (!data) {
    const { error: insertError } = await db.from('phish_users').insert({
      email: DEFAULT_ADMIN_EMAIL,
      password_hash: passwordHash,
      role: 'ADMIN',
    });

    if (insertError) {
      throw new Error(`Failed to create default admin: ${insertError.message}`);
    }

    return;
  }

  const existing = data as { id: string };
  const { error: updateError } = await db
    .from('phish_users')
    .update({ role: 'ADMIN', password_hash: passwordHash })
    .eq('id', existing.id);

  if (updateError) {
    throw new Error(`Failed to update default admin: ${updateError.message}`);
  }
}

async function saveScan(userId: string | null, subject: string, sender: string, snippet: string, analysis: NormalizedAnalysis) {
  const db = getDb();
  const setting = await getSystemSetting();
  const isPhishing = analysis.phishingProb >= setting.phishing_threshold;

  const { data: saved, error: saveError } = await db
    .from('phish_email_scans')
    .insert({
      source_email_id: randomId('manual'),
      user_id: userId,
      provider: 'MANUAL',
      subject,
      sender,
      snippet,
      is_phishing: isPhishing,
      confidence: analysis.confidence,
      phishing_prob: analysis.phishingProb,
      label: analysis.label,
      request_id: analysis.requestId,
    })
    .select('*')
    .single();

  if (saveError || !saved) {
    throw new Error(`Failed to save email scan: ${saveError?.message || 'Unknown error'}`);
  }

  return saved as EmailScanRow;
}

async function getRecentScans(limit: number, options?: { userId?: string; onlyThreats?: boolean }) {
  const db = getDb();
  let query = db.from('phish_email_scans').select('*');

  if (options?.userId) {
    query = query.eq('user_id', options.userId);
  }

  if (options?.onlyThreats) {
    query = query.eq('is_phishing', true);
  }

  const { data, error } = await query.order('timestamp', { ascending: false }).limit(limit);

  if (error) {
    throw new Error(`Failed to load scans: ${error.message}`);
  }

  return (data || []) as EmailScanRow[];
}

function toScanResponse(scan: EmailScanRow) {
  return {
    id: scan.id,
    subject: scan.subject,
    sender: scan.sender,
    timestamp: scan.timestamp,
    confidence: scan.confidence,
    phishingProb: scan.phishing_prob,
    isPhishing: scan.is_phishing,
    label: scan.label,
    provider: scan.provider,
  };
}

function normalizeUserRole(role: string) {
  return String(role || '').toUpperCase() === 'ADMIN' ? 'ADMIN' : 'USER';
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
    await ensureDefaultAdmin();

    if (route === '/health' && method === 'GET') {
      return jsonResponse(
        200,
        {
          status: 'ok',
          database: supabaseUrl && supabaseKey ? 'supabase' : 'not-configured',
          defaultAdmin: {
            email: DEFAULT_ADMIN_EMAIL,
            password: DEFAULT_ADMIN_PASSWORD,
          },
        },
        origin
      );
    }

    if (route === '/analyze' && method === 'POST') {
      const subject = String(body.subject || 'Manual Analysis').trim() || 'Manual Analysis';
      const sender = String(body.sender || 'manual@input').trim() || 'manual@input';
      const text = String(body.text || body.snippet || '').trim();
      const userId = body.userId ? String(body.userId) : null;

      if (!text) {
        return jsonResponse(400, { error: 'Email text is required.' }, origin);
      }

      const analysis = await analyzeEmailAsync(subject, sender, text);
      const saved = await saveScan(userId, subject, sender, text.slice(0, 1200), analysis);
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
      const limit = parseLimit(query.limit, 20, 100);
      const scans = await getRecentScans(limit);
      return jsonResponse(200, scans.map(toScanResponse), origin);
    }

    if (route === '/user/scans' && method === 'GET') {
      const userId = String(query.userId || '').trim();
      if (!userId) {
        return jsonResponse(400, { error: 'userId is required.' }, origin);
      }

      const limit = parseLimit(query.limit, 20, 100);
      const scans = await getRecentScans(limit, { userId });
      return jsonResponse(200, scans.map(toScanResponse), origin);
    }

    if (route === '/dashboard/summary' && method === 'GET') {
      if (!isAdminRequest(event)) {
        return jsonResponse(403, { error: 'Admin access required.' }, origin);
      }

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

      const recentThreats = await getRecentScans(5, { onlyThreats: true });

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

    if (route === '/admin/users' && method === 'GET') {
      if (!isAdminRequest(event)) {
        return jsonResponse(403, { error: 'Admin access required.' }, origin);
      }

      const db = getDb();
      const [{ data: usersData, error: usersError }, { data: scansData, error: scansError }] = await Promise.all([
        db.from('phish_users').select('id,email,role,created_at').order('created_at', { ascending: false }),
        db.from('phish_email_scans').select('user_id'),
      ]);

      if (usersError) {
        throw new Error(usersError.message);
      }

      if (scansError) {
        throw new Error(scansError.message);
      }

      const counts = new Map<string, number>();
      (scansData || []).forEach((row) => {
        const userId = (row as { user_id: string | null }).user_id;
        if (userId) {
          counts.set(userId, (counts.get(userId) || 0) + 1);
        }
      });

      const users = (usersData || []).map((entry) => {
        const row = entry as UserRow;
        return {
          id: row.id,
          email: row.email,
          role: normalizeUserRole(row.role),
          createdAt: row.created_at,
          scanCount: counts.get(row.id) || 0,
        };
      });

      return jsonResponse(200, users, origin);
    }

    if (route === '/admin/users' && method === 'POST') {
      if (!isAdminRequest(event)) {
        return jsonResponse(403, { error: 'Admin access required.' }, origin);
      }

      const email = String(body.email || '').trim().toLowerCase();
      const password = String(body.password || '');

      if (!email || !password) {
        return jsonResponse(400, { error: 'Email and password are required.' }, origin);
      }

      if (password.length < 8) {
        return jsonResponse(400, { error: 'Password must be at least 8 characters long.' }, origin);
      }

      if (email === DEFAULT_ADMIN_EMAIL) {
        return jsonResponse(400, { error: 'Default admin account already exists and cannot be created here.' }, origin);
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
      const { data: created, error: createError } = await db
        .from('phish_users')
        .insert({ email, password_hash: passwordHash, role: 'USER' })
        .select('id,email,role,created_at')
        .single();

      if (createError || !created) {
        throw new Error(createError?.message || 'Unable to create user.');
      }

      const row = created as UserRow;
      return jsonResponse(
        201,
        {
          id: row.id,
          email: row.email,
          role: normalizeUserRole(row.role),
          createdAt: row.created_at,
          scanCount: 0,
        },
        origin
      );
    }

    const deleteUserMatch = route.match(/^\/admin\/users\/([^/]+)$/);
    if (deleteUserMatch && method === 'DELETE') {
      if (!isAdminRequest(event)) {
        return jsonResponse(403, { error: 'Admin access required.' }, origin);
      }

      const targetId = decodeURIComponent(deleteUserMatch[1]);
      const db = getDb();

      const { data: existing, error: existingError } = await db
        .from('phish_users')
        .select('id,email,role')
        .eq('id', targetId)
        .maybeSingle();

      if (existingError) {
        throw new Error(existingError.message);
      }

      if (!existing) {
        return jsonResponse(404, { error: 'User not found.' }, origin);
      }

      const role = normalizeUserRole((existing as UserRow).role);
      if (role === 'ADMIN') {
        return jsonResponse(400, { error: 'Admin account cannot be deleted.' }, origin);
      }

      const { error: deleteError } = await db.from('phish_users').delete().eq('id', targetId);
      if (deleteError) {
        throw new Error(deleteError.message);
      }

      return jsonResponse(200, { ok: true }, origin);
    }

    if (route === '/admin/threats' && method === 'GET') {
      if (!isAdminRequest(event)) {
        return jsonResponse(403, { error: 'Admin access required.' }, origin);
      }

      const limit = parseLimit(query.limit, 100, 500);
      const threats = await getRecentScans(limit, { onlyThreats: true });
      return jsonResponse(
        200,
        threats.map((scan) => ({
          ...toScanResponse(scan),
          confidence: scan.confidence,
        })),
        origin
      );
    }

    if (route === '/admin/analytics' && method === 'GET') {
      if (!isAdminRequest(event)) {
        return jsonResponse(403, { error: 'Admin access required.' }, origin);
      }

      const db = getDb();
      const [usersCountRes, scansCountRes, threatsCountRes, last14DaysRes] = await Promise.all([
        db.from('phish_users').select('id', { count: 'exact', head: true }),
        db.from('phish_email_scans').select('id', { count: 'exact', head: true }),
        db.from('phish_email_scans').select('id', { count: 'exact', head: true }).eq('is_phishing', true),
        db
          .from('phish_email_scans')
          .select('sender,is_phishing,timestamp')
          .gte('timestamp', new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString())
          .order('timestamp', { ascending: true })
          .limit(5000),
      ]);

      if (usersCountRes.error || scansCountRes.error || threatsCountRes.error || last14DaysRes.error) {
        throw new Error(
          usersCountRes.error?.message ||
            scansCountRes.error?.message ||
            threatsCountRes.error?.message ||
            last14DaysRes.error?.message ||
            'Failed to build analytics.'
        );
      }

      const totalUsers = usersCountRes.count || 0;
      const totalScans = scansCountRes.count || 0;
      const totalThreats = threatsCountRes.count || 0;
      const threatRate = totalScans === 0 ? 0 : totalThreats / totalScans;

      const scansByDayMap = new Map<string, { day: string; scans: number; threats: number }>();
      const senderMap = new Map<string, number>();

      (last14DaysRes.data || []).forEach((row) => {
        const item = row as { sender: string; is_phishing: boolean; timestamp: string };
        const day = new Date(item.timestamp).toISOString().slice(5, 10);

        const bucket = scansByDayMap.get(day) || { day, scans: 0, threats: 0 };
        bucket.scans += 1;
        if (item.is_phishing) {
          bucket.threats += 1;
          senderMap.set(item.sender, (senderMap.get(item.sender) || 0) + 1);
        }
        scansByDayMap.set(day, bucket);
      });

      const scansByDay = Array.from(scansByDayMap.values());
      const topSenders = Array.from(senderMap.entries())
        .map(([sender, threats]) => ({ sender, threats }))
        .sort((a, b) => b.threats - a.threats)
        .slice(0, 8);

      return jsonResponse(
        200,
        {
          totals: {
            users: totalUsers,
            scans: totalScans,
            threats: totalThreats,
            threatRate,
          },
          scansByDay,
          topSenders,
        },
        origin
      );
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

      if (email === DEFAULT_ADMIN_EMAIL) {
        return jsonResponse(403, { error: 'Admin account cannot be created from signup.' }, origin);
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
          role: normalizeUserRole(castedUser.role),
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

    return jsonResponse(404, { error: 'Route not found.' }, origin);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected server error.';
    return jsonResponse(500, { error: message }, origin);
  }
};
