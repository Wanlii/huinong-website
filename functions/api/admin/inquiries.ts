// Admin inquiries API
// GET  /api/admin/inquiries  - list
// POST /api/admin/inquiries  - { id, action: 'read' | 'unread' | 'archive' | 'delete' }

interface D1Database {
  prepare(query: string): D1PreparedStatement;
}
interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  run(): Promise<unknown>;
  all<T = unknown>(): Promise<{ results: T[] }>;
}

interface Env {
  ADMIN_SECRET: string;
  DB: D1Database;
}

const CORS = { 'Access-Control-Allow-Origin': '*' };

async function hmac(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function verifyToken(token: string, secret: string): Promise<boolean> {
  const [ts, sig] = token.split('.');
  if (!ts || !sig) return false;
  if (Date.now() - Number(ts) > 7 * 24 * 60 * 60 * 1000) return false;
  return (await hmac(secret, ts)) === sig;
}

async function isAuthed(request: Request, env: Env): Promise<boolean> {
  const cookie = request.headers.get('Cookie') || '';
  const m = cookie.match(/admin_session=([^;]+)/);
  return m ? await verifyToken(m[1], env.ADMIN_SECRET) : false;
}

function err(msg: string, status = 401) {
  return new Response(JSON.stringify({ ok: false, error: msg }), {
    status, headers: { 'Content-Type': 'application/json', ...CORS },
  });
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  if (!(await isAuthed(request, env))) return err('Not authenticated', 401);
  const { results } = await env.DB.prepare(
    `SELECT id, created_at, name, company, country, email, phone, category, product, message, lang, status
     FROM inquiries ORDER BY created_at DESC LIMIT 200`
  ).all();
  return new Response(JSON.stringify({ ok: true, items: results }), {
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!(await isAuthed(request, env))) return err('Not authenticated', 401);
  let body: { id?: number; action?: string };
  try { body = await request.json(); } catch { return err('Invalid JSON', 400); }
  if (!body.id || !body.action) return err('Missing id or action', 400);

  const id = Number(body.id);
  const action = body.action;

  if (action === 'delete') {
    await env.DB.prepare(`DELETE FROM inquiries WHERE id = ?`).bind(id).run();
  } else if (action === 'read') {
    await env.DB.prepare(`UPDATE inquiries SET status = 'read' WHERE id = ?`).bind(id).run();
  } else if (action === 'unread') {
    await env.DB.prepare(`UPDATE inquiries SET status = 'new' WHERE id = ?`).bind(id).run();
  } else if (action === 'archive') {
    await env.DB.prepare(`UPDATE inquiries SET status = 'archived' WHERE id = ?`).bind(id).run();
  } else {
    return err('Unknown action', 400);
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
};
