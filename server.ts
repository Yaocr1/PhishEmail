import express, { type Request } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { handler as apiHandler } from './netlify/functions/api.ts';
import 'dotenv/config';

function normalizeHeaders(headers: Request['headers']) {
  const normalized: Record<string, string | undefined> = {};

  for (const [key, value] of Object.entries(headers)) {
    if (typeof value === 'string') {
      normalized[key] = value;
      continue;
    }

    if (Array.isArray(value)) {
      normalized[key] = value[0];
      continue;
    }

    normalized[key] = undefined;
  }

  return normalized;
}

function normalizeQuery(query: Request['query']) {
  const normalized: Record<string, string | undefined> = {};

  for (const [key, value] of Object.entries(query)) {
    if (typeof value === 'string') {
      normalized[key] = value;
      continue;
    }

    if (Array.isArray(value)) {
      const first = value[0];
      normalized[key] = typeof first === 'string' ? first : undefined;
      continue;
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
      normalized[key] = String(value);
      continue;
    }

    normalized[key] = undefined;
  }

  return Object.keys(normalized).length > 0 ? normalized : null;
}

function serializeBody(req: Request) {
  if (req.method === 'GET' || req.method === 'HEAD') {
    return null;
  }

  if (req.body == null) {
    return null;
  }

  if (typeof req.body === 'string') {
    return req.body;
  }

  try {
    return JSON.stringify(req.body);
  } catch {
    return null;
  }
}

async function proxyApiRequest(req: Request, res: express.Response) {
  const event: Parameters<typeof apiHandler>[0] = {
    path: req.originalUrl,
    httpMethod: req.method.toUpperCase(),
    headers: normalizeHeaders(req.headers),
    body: serializeBody(req),
    isBase64Encoded: false,
    queryStringParameters: normalizeQuery(req.query),
  };

  const result = await apiHandler(event);

  if (result.headers) {
    for (const [key, value] of Object.entries(result.headers)) {
      if (value !== undefined) {
        res.setHeader(key, value);
      }
    }
  }

  res.status(result.statusCode).send(result.body);
}

async function startServer() {
  const app = express();
  const configuredPort = Number(process.env.PORT || 3000);
  const port = Number.isFinite(configuredPort) ? configuredPort : 3000;

  app.disable('x-powered-by');
  app.use(express.json({ limit: '1mb' }));

  // Keep local development behavior aligned with Netlify by routing through the same function handler.
  app.use('/api', async (req, res) => {
    try {
      await proxyApiRequest(req, res);
    } catch (error) {
      console.error('Local API proxy failed:', error);
      res.status(500).json({ error: 'Local API proxy failed.' });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
      },
      appType: 'spa',
    });

    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('/{*path}', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${port}`);
  });
}

startServer().catch((error) => {
  console.error('Server bootstrap failed:', error);
  process.exit(1);
});
