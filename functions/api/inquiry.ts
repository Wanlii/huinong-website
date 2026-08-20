// Cloudflare Pages Function: 询盘表单接收
// 部署后路径: /api/inquiry
// 配置环境变量 (Cloudflare Pages → Settings → Environment variables):
//   - RESEND_API_KEY: 在 https://resend.com 注册并获取
//   - INQUIRY_TO_EMAIL: 询盘接收邮箱 (如 export@huinongplants.com)

interface Env {
  RESEND_API_KEY: string;
  INQUIRY_TO_EMAIL: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  // CORS
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  let body: Record<string, string>;
  try {
    body = await request.json();
  } catch {
    return new Response('Invalid JSON', {
      status: 400,
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
  }

  // 必填项校验
  const required = ['company', 'country', 'name', 'email', 'message'];
  for (const f of required) {
    if (!body[f] || !String(body[f]).trim()) {
      return new Response(`Missing field: ${f}`, {
        status: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
      });
    }
  }

  // 邮箱格式
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
    return new Response('Invalid email', {
      status: 400,
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
  }

  // 邮件内容
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
Time: ${new Date().toISOString()}`
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
时间: ${new Date().toISOString()}`;

  // 发送邮件（Resend）
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
      return new Response(`Email send failed: ${err}`, {
        status: 500,
        headers: { 'Access-Control-Allow-Origin': '*' },
      });
    }

    return new Response(JSON.stringify({ ok: true, message: 'Inquiry sent' }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (e) {
    return new Response(`Server error: ${(e as Error).message}`, {
      status: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
  }
};
