# 询盘表单后端配置（Cloudflare Pages Functions + Resend）

询盘提交后流程：
```
浏览器 form submit
  → POST /api/inquiry (Cloudflare Pages Function)
  → 校验字段
  → Resend API 发送邮件到 export@huinongplants.com
```

## 部署时需要的 3 步

### 1. 注册 Resend（5 分钟）
- 打开 https://resend.com 注册（免费 100 封/天，3000 封/月）
- 添加域名 `huinongplants.com`（按提示加 DNS 记录）
- 获取 API Key（`re_xxxxxxxx`）
- 验证完成后可以从 `noreply@huinongplants.com` 发邮件

### 2. 在 Cloudflare Pages 配置环境变量
- 登录 https://dash.cloudflare.com
- Pages → huinong-website → Settings → Environment variables
- 添加：
  - `RESEND_API_KEY` = `re_xxxxxxxx`（从 Resend 拿）
  - `INQUIRY_TO_EMAIL` = `export@huinongplants.com`（收询盘的邮箱）

### 3. 重新部署
- push 代码到 GitHub
- Cloudflare Pages 自动检测并重新部署
- 测试询盘 → 检查 `export@huinongplants.com` 是否收到邮件

## 9/1 上线前如果来不及配 Resend
临时方案：把 `functions/api/inquiry.ts` 里的 Resend 代码注释掉，加一个 console.log 临时存到 Cloudflare Workers 日志。
- Workers 日志查看：Cloudflare Pages → 项目 → Logs → Real-time Logs
- 这样询盘不会丢，只是不会自动发邮件

## 测试
- 进入网站联系页，填表提交
- 打开 Cloudflare Pages → Logs 看是否调用 /api/inquiry
- 如果 Resend 配好，应该 1 分钟内收到邮件
