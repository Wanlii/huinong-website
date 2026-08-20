# 部署到 Cloudflare Pages

## 部署前要准备的 3 件事

### 1. GitHub 仓库（如果还没有）
- 在 https://github.com 创建新仓库 `huinong-website`（私有）
- 告诉我仓库地址（如果你要我推代码）；或者你自己 push

### 2. Cloudflare 账号
- 你的域名 `huinongplants.com` 已经在 Cloudflare 上
- 登录 https://dash.cloudflare.com

### 3. Resend 邮件服务（可选，9/1 前必须）
- 注册 https://resend.com（免费 100 封/天）
- 添加域名 `huinongplants.com`，按提示加 3 条 DNS 记录
- 创建 API Key，复制备用

---

## 部署步骤

### Step 1：连接 GitHub 到 Cloudflare Pages
1. Cloudflare Dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
2. 选 GitHub → 授权 → 选 `huinong-website` 仓库
3. 配置构建：
   - **Framework preset**: Astro
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Node.js version**: 20（或 22）
4. 点 **Save and Deploy**

### Step 2：配置环境变量
部署完成后（第一次会失败，functions 需要环境变量）：
1. 项目 → **Settings** → **Environment variables**
2. 添加：
   - `RESEND_API_KEY` = `re_xxxxxxxx`（Resend 提供的 key）
   - `INQUIRY_TO_EMAIL` = `export@huinongplants.com`
3. **Production** 和 **Preview** 都要加
4. 改完后 Cloudflare 自动重新部署

### Step 3：绑定自定义域名
1. 项目 → **Custom domains** → **Set up a custom domain**
2. 输入 `huinongplants.com` 和 `www.huinongplants.com`
3. Cloudflare 会自动加 DNS 记录（CNAME）
4. 等待 DNS 生效（5-30 分钟）
5. **SSL/TLS** → **Full (strict)** 模式
6. **Edge Certificates** → 开启 **Always Use HTTPS**

### Step 4：部署
- push 代码到 GitHub 触发自动部署
- Cloudflare 会跑 `npm run build` → 部署到全球 CDN
- 部署成功会发邮件给你

---

## 9/1 上线检查清单

- [ ] 域名 `huinongplants.com` 解析到 Cloudflare Pages ✓
- [ ] SSL 证书自动签发 ✓
- [ ] 中文首页 `/` 正常显示
- [ ] 英文首页 `/en/` 正常显示
- [ ] 切换中英文按钮工作
- [ ] 首页 → 产品 → 详情 流程通
- [ ] 询盘表单提交 → 收到邮件（需 Resend）
- [ ] sitemap-index.xml 可访问
- [ ] robots.txt 可访问
- [ ] 404 页正常

---

## 临时方案（如果 Resend 没配好）

修改 `functions/api/inquiry.ts`，把 Resend 部分注释掉，改为：
```ts
console.log('New inquiry:', body);
return new Response(JSON.stringify({ ok: true, dev: true }), {
  headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
});
```

这样询盘会落到 Cloudflare Workers 日志（不会丢），等你配好 Resend 再切换回来。

查看日志：Cloudflare Pages → 项目 → **Logs** → **Real-time Logs**
