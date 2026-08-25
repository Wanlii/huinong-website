// Cloudflare Pages Function: 询盘表单接收
// 部署后路径: /api/inquiry
// 配置 (Cloudflare Pages → Settings → Environment variables):
//   - RESEND_API_KEY:  https://resend.com/api-keys
//   - INQUIRY_TO_EMAIL: 询盘接收邮箱 (如 contact@huinongplants.com)
// D1 binding:
//   - Variable name: DB
//   - Database: huinong-inquiries (在 Cloudflare D1 控制台创建)
//   - Schema: 见 db/schema.sql

interface D1Database {
  prepare(query: string): D1PreparedStatement;
  exec(query: string): Promise<unknown>;
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  run(): Promise<{ success: boolean }>;
  all<T = unknown>(): Promise<{ results: T[] }>;
  first<T = unknown>(): Promise<T | null>;
}

interface Env {
  RESEND_API_KEY: string;
  INQUIRY_TO_EMAIL: string;
  DB: D1Database;
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}

function textResponse(text: string, status = 200) {
  return new Response(text, { status, headers: CORS });
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: CORS });
  }

  // 1. 解析 body
  let body: Record<string, string>;
  try {
    body = await request.json();
  } catch {
    return textResponse('Invalid JSON', 400);
  }

  // 2. 必填项校验
  const required = ['company', 'country', 'name', 'email', 'message'];
  for (const f of required) {
    if (!body[f] || !String(body[f]).trim()) {
      return textResponse(`Missing field: ${f}`, 400);
    }
  }

  // 3. 邮箱格式
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
    return textResponse('Invalid email', 400);
  }

  // 4. 写 D1（best-effort：失败不阻塞邮件）
  const ip = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || '';
  const ua = request.headers.get('user-agent') || '';
  let inquiryId: number | null = null;
  try {
    const result = await env.DB.prepare(
      `INSERT INTO inquiries (name, company, country, email, phone, category, product, message, lang, ip, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      body.name.trim(),
      body.company.trim(),
      body.country.trim(),
      body.email.trim(),
      body.phone?.trim() || null,
      body.category?.trim() || null,
      body.product?.trim() || null,
      body.message.trim(),
      body.lang || 'zh',
      ip,
      ua
    ).run();
    inquiryId = (result as unknown as { meta?: { last_row_id?: number } }).meta?.last_row_id ?? null;
    console.log(`Inquiry saved to D1, id=${inquiryId}`);
  } catch (err) {
    console.error('D1 write failed (continuing to email):', err);
  }

  // 5. 邮件内容
  const isEn = body.lang === 'en';
  const subject = isEn
    ? `[New Inquiry] ${body.company} - ${body.country}`
    : `[新询盘] ${body.company} - ${body.country}`;

  const text = isEn
    ? `New inquiry from website:

Company: ${body.company}
Country: ${body.country}
Name: ${body.name}
Email: ${body.email}
Phone: ${body.phone || '-'}
Category: ${body.category || '-'}
Product: ${body.product || '-'}

Message:
${body.message}

---
Source: ${isEn ? 'English' : 'Chinese'} page
Time: ${new Date().toISOString()}
DB ID: ${inquiryId ?? '(not saved)'}`
    : `来自网站的询盘:

公司: ${body.company}
国家: ${body.country}
姓名: ${body.name}
邮箱: ${body.email}
电话: ${body.phone || '-'}
品类: ${body.category || '-'}
产品: ${body.product || '-'}

留言:
${body.message}

---
来源: ${isEn ? '英文' : '中文'} 页面
时间: ${new Date().toISOString()}
DB ID: ${inquiryId ?? '(未保存)'}`;

  // 6. 发邮件（Resend）
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Huinong Website <noreply@huinongplants.com>',
        to: [env.INQUIRY_TO_EMAIL],
        subject,
        text,
        reply_to: body.email,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('Resend error:', err);
      return textResponse(`Email send failed: ${err}`, 500);
    }

    return jsonResponse({ ok: true, message: 'Inquiry sent', id: inquiryId });
  } catch (e) {
    return textResponse(`Server error: ${(e as Error).message}`, 500);
  }
};
