// Admin login: POST { password }
// Sets signed session cookie on success
// Env: ADMIN_PASSWORD, ADMIN_SECRET

interface Env {
  ADMIN_PASSWORD: string;
  ADMIN_SECRET: string;
}

const CORS = { 'Access-Control-Allow-Origin': '*' };

async function hmac(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return Array.from(new Uint8Array(sig))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

async function makeToken(secret: string): Promise<string> {
  const ts = Date.now().toString();
  const sig = await hmac(secret, ts);
  return `${ts}.${sig}`;
}

async function verifyToken(token: string, secret: string): Promise<boolean> {
  const [ts, sig] = token.split('.');
  if (!ts || !sig) return false;
  // 7 days expiry
  if (Date.now() - Number(ts) > 7 * 24 * 60 * 60 * 1000) return false;
  const expected = await hmac(secret, ts);
  return expected === sig;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let body: { password?: string };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ ok: false, error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...CORS },
    });
  }

  if (!body.password || body.password !== env.ADMIN_PASSWORD) {
    return new Response(JSON.stringify({ ok: false, error: 'Wrong password' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', ...CORS },
    });
  }

  const token = await makeToken(env.ADMIN_SECRET);
  return new Response(JSON.stringify({ ok: true }), {
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': `admin_session=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=604800`,
      ...CORS,
    },
  });
};

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const cookie = request.headers.get('Cookie') || '';
  const match = cookie.match(/admin_session=([^;]+)/);
  const valid = match ? await verifyToken(match[1], env.ADMIN_SECRET) : false;
  return new Response(JSON.stringify({ authenticated: valid }), {
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
};
