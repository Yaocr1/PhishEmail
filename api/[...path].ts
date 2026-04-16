import { handler as netlifyHandler } from "../netlify/functions/api";

function normalizeHeaders(headers: Record<string, unknown> = {}) {
  const normalized: Record<string, string | undefined> = {};

  for (const [key, value] of Object.entries(headers)) {
    if (typeof value === "string") {
      normalized[key] = value;
      continue;
    }

    if (Array.isArray(value)) {
      const first = value[0];
      normalized[key] = typeof first === "string" ? first : undefined;
      continue;
    }

    normalized[key] = undefined;
  }

  return normalized;
}

function normalizeQuery(query: Record<string, unknown> = {}) {
  const normalized: Record<string, string | undefined> = {};

  for (const [key, value] of Object.entries(query)) {
    if (key === "path") {
      continue;
    }

    if (typeof value === "string") {
      normalized[key] = value;
      continue;
    }

    if (Array.isArray(value)) {
      const first = value[0];
      normalized[key] = typeof first === "string" ? first : undefined;
      continue;
    }

    if (typeof value === "number" || typeof value === "boolean") {
      normalized[key] = String(value);
      continue;
    }

    normalized[key] = undefined;
  }

  return Object.keys(normalized).length > 0 ? normalized : null;
}

function serializeBody(req: { method?: string; body?: unknown }) {
  const method = String(req.method || "GET").toUpperCase();
  if (method === "GET" || method === "HEAD") {
    return null;
  }

  if (req.body == null) {
    return null;
  }

  if (typeof req.body === "string") {
    return req.body;
  }

  try {
    return JSON.stringify(req.body);
  } catch {
    return null;
  }
}

export default async function handler(req: any, res: any) {
  const event = {
    path: req.url || "/api",
    httpMethod: String(req.method || "GET").toUpperCase(),
    headers: normalizeHeaders(req.headers || {}),
    body: serializeBody(req),
    isBase64Encoded: false,
    queryStringParameters: normalizeQuery(req.query || {}),
  };

  const result = await netlifyHandler(event);

  if (result.headers) {
    for (const [key, value] of Object.entries(result.headers)) {
      if (value !== undefined) {
        res.setHeader(key, value);
      }
    }
  }

  res.status(result.statusCode).send(result.body);
}
