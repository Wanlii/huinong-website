# huinongplants.com 网站项目交接文档

> **项目**：汇农天下江苏花木盆景有限公司 外贸网站
> **域名**：huinongplants.com
> **技术栈**：Astro 5（静态站）+ Cloudflare Pages + Cloudflare D1 + Resend（询盘邮件）
> **写于**：2026-09-14
> **交接方**：万里（前项目维护） → 接手人（老板朋友）
> **公司 IT 协助**：CF/Resend 账号在公司名下，接收时加新成员即可

---

## 1. 项目概览

`huinongplants.com` 是盆景出口公司的对外展示 + 询盘站。访客浏览产品（观赏苗木、精品盆景、小微盆景），感兴趣可点"询盘"留资，公司通过邮件接收询盘。

**主要功能**：
- 2 大类（观赏苗木 / 盆栽），盆栽下分精品盆景 / 小微盆景
- 55 个产品，34 张观赏苗木卡片 + 2 张盆栽子卡（精品盆景 / 小微盆景）
- 产品图集（点击展开，lightbox 大图）
- 询盘表单 → 邮件 + D1 存储
- 中英文双语

---

## 2. 你（接手人）需要的所有东西

### 2.1 GitHub 仓库
- **地址**：`https://github.com/Wanlii/huinong-website`
- 状态：万里已 transfer 到你的 GitHub 账号
- 分支：`main`
- clone：`git clone git@github.com:Wanlii/huinong-website.git`

### 2.2 Cloudflare（公司账号）
- **登录**：https://dash.cloudflare.com（用公司邮箱）
- 万里会把你加为 Member（权限：Pages + DNS + D1 + Workers）
- 涉及的资源：
  - Pages 项目 `huinong-website`（绑定域名 huinongplants.com）
  - DNS 区域 `huinongplants.com`
  - D1 数据库 `huinong-inquiries`（询盘记录）
  - Workers KV（如果有）

### 2.3 Resend（公司账号）
- **登录**：https://resend.com（用公司邮箱）
- 万里会把你加为 Team Member
- Domain `huinongplants.com` 的 DKIM/SPF 记录由公司账号管

### 2.4 域名 huinongplants.com
- **在谁名下**：公司（不用动）

### 2.5 环境变量（最关键）
需要把以下 4 个值写到项目的 `.env` 文件里（Astro + Cloudflare Pages 都要设）：

```env
# 真实值由万里线下单独提供（不要 commit 到 git）
RESEND_API_KEY=<由万里提供>
INQUIRY_TO_EMAIL=contact@huinongplants.com
ADMIN_PASSWORD=<接手人自己改>
ADMIN_SECRET=<接手人自己生成>
```

**⚠️ 安全要求**：
- `ADMIN_PASSWORD` 接手后**立刻改**（现在临时是 `huinong2026`，建议改复杂密码）
- `ADMIN_SECRET` 接手后**自己生成新值**（建议 32 字节随机字符串）
- `RESEND_API_KEY` 可以保留（公司 Resend 账号的 key），但建议**走 Cloudflare Pages 环境变量**而不是写进 .env（避免代码泄露时带秘钥）

### 2.6 原始素材
- 万里会单独把 `素材/` 目录 zip 发给你（约 1-2GB，含原始产品图 + 处理后版本）
- 用途：以后加新产品时找图源；现有网站用的图都在 `public/` 里（git 已含）

---

## 3. 本地开发

### 3.1 准备
```bash
# 1. clone 仓库
git clone git@github.com:Wanlii/huinong-website.git
cd huinong-website

# 2. 装依赖
npm install

# 3. 写 .env（参考上面的 4 个值）
# Windows: 用编辑器创建 .env 文件（无后缀）
# 注意：.env 在 .gitignore 里，不会被 commit

# 4. 启动 dev server
npm run dev
# → http://localhost:4321
```

### 3.2 项目结构
```
huinong-website/
├── src/
│   ├── data/
│   │   └── products.csv         ← 55 个产品的数据（增删改在这）
│   ├── lib/
│   │   └── products.ts          ← 数据读取 + gallery 生成
│   ├── pages/
│   │   ├── index.astro          ← 首页
│   │   ├── products/
│   │   │   ├── index.astro      ← /products/（产品列表，3 个 tab）
│   │   │   ├── ornamental/[id].astro  ← 产品详情
│   │   │   └── potted/[slug].astro    ← 盆栽子分类图集
│   │   ├── admin/
│   │   │   ├── index.astro      ← /admin/（询盘后台，密码保护）
│   │   │   └── inquiries.astro  ← 询盘列表
│   │   └── api/                  ← 询盘 API endpoints
│   ├── components/
│   │   ├── Header.astro
│   │   └── Footer.astro
│   └── styles/
│       └── global.css
├── public/
│   └── assets/images/
│       ├── category/            ← 首页/盆栽子卡封面（2 张）
│       ├── potted/              ← 盆栽图集（精品 52 张 + 小微 22 张）
│       ├── products/<id>/       ← 每个产品的图
│       ├── hero/                ← 首页大图
│       ├── company/             ← 公司图
│       └── logo/
├── 素材/                        ← 不在 git 里，万里单独发
├── .env                          ← 不在 git 里，本地新建
├── astro.config.mjs
├── package.json
└── HANDOVER.md                  ← 本文档
```

### 3.3 常用命令
```bash
npm run dev       # 本地开发（http://localhost:4321）
npm run build     # build 静态站到 dist/
npm run preview   # 预览 build 产物
node node_modules/astro/astro.js build  # 上面 build 命令的等价
```

---

## 4. 部署流程

部署是**自动的**：

1. 改代码 → `git add` + `git commit`
2. `git push origin main`
3. Cloudflare Pages 自动 build + deploy（约 1-2 分钟）
4. https://huinongplants.com 立即更新

**手动触发**：CF Dashboard → Pages → huinong-website → Deployments → Retry deployment

**回滚**：CF Dashboard → Pages → huinong-website → Deployments → 选旧版本 → Rollback

---

## 5. 怎么加新产品

### 5.1 加观赏苗木
```bash
# 1. 准备图片（缩放 + 压缩）
# 推荐尺寸：长边 1920px，质量 82，保存为 jpg
# 命名建议：1.jpg (主图), 2.jpg, 3.jpg, ... 或用中文命名

# 2. 把图放进 public/assets/images/products/<新 id>/
mkdir public/assets/images/products/<新 id>
cp ~/Pictures/新图/*.jpg public/assets/images/products/<新 id>/

# 3. 在 src/data/products.csv 末尾加一行
# 字段：id,中文名,英文名,拉丁学名,分类,子分类,物种,高度,盆器,MOQ,简短描述,详细描述,精选,排序,图片文件夹
# 分类：ornamental（观赏苗木）或 potted（盆栽）

# 4. 提交
git add . && git commit -m "feat: add 新产品" && git push origin main
```

### 5.2 加盆栽子分类图
盆栽现在用 2 张子分类卡（精品盆景 / 小微盆景），不是产品级管理。如果要新增第三个子分类（如"中式盆景"）：
```bash
# 1. 在 public/assets/images/potted/中式盆景/ 放图
mkdir public/assets/images/potted/zhongshi
cp ~/图/*.jpg public/assets/images/potted/zhongshi/

# 2. 在 public/assets/images/potted/ 中式盆景-cover.jpg 加封面

# 3. 编辑 src/lib/products.ts 的 SUB_META 加 'zhongshi' 条目

# 4. 在 src/pages/products/potted.astro 加映射
```

### 5.3 修改产品图
直接替换 `public/assets/images/products/<id>/1.jpg` 即可。建议先压缩再放（避免 Cloudflare 25MB 限制）。

---

## 6. 询盘系统

### 6.1 询盘流程
1. 访客在产品页 / 首页点"询盘"按钮 → 跳到 /contact
2. 填表 → POST 到 `/api/inquiry`
3. Resend 发邮件到 `contact@huinongplants.com`（公司销售邮箱）
4. 同时写一条到 Cloudflare D1 `huinong-inquiries` 表

### 6.2 看询盘
两种方式：
- **邮件**：询盘直接发到 `contact@huinongplants.com`
- **后台**：https://huinongplants.com/admin/（密码 `ADMIN_PASSWORD`）→ 询盘列表

### 6.3 D1 数据库结构
表名：`inquiries`
字段：
- `id` (uuid)
- `created_at` (timestamp)
- `product` (string, 询盘产品)
- `name` (string, 客户姓名)
- `email` (string)
- `phone` (string, optional)
- `company` (string, optional)
- `message` (text)
- `country` (string, optional)
- `status` (string: 'new' / 'read' / 'replied')

CF Dashboard → D1 → huinong-inquiries → Console → 可以 SQL 查询：
```sql
SELECT * FROM inquiries WHERE status = 'new' ORDER BY created_at DESC LIMIT 50;
```

---

## 7. Cloudflare Pages 环境变量

CF Dashboard → Pages → huinong-website → Settings → Environment variables

要设这 4 个（和 .env 一样）：
- `RESEND_API_KEY`
- `INQUIRY_TO_EMAIL`
- `ADMIN_PASSWORD`
- `ADMIN_SECRET`

**为什么两边都要设？** `.env` 是本地开发用，CF Environment variables 是生产环境用。

---

## 8. 已知 TODO / 待优化

接手后可以慢慢改：

| 优先级 | 问题 | 位置 |
|---|---|---|
| 🟡 中 | 玉兰 2.jpg 方向还可能不对 | `public/assets/images/products/yulan/2.jpg` |
| 🟡 中 | 紫薇（chuanhong）"图片重复" — 文件 hash 都不同，可能是视觉相似 | `public/assets/images/products/chuanhong/` |
| 🟡 中 | 玉兰产品图共 9 张（1.jpg 3072×5472 等），已重新从素材拉过一遍，但方向可能还需要手动调 | `public/assets/images/products/yulan/` |
| 🟢 低 | 把 `/admin/` 改成更安全的多用户 + 询盘导出 CSV | `src/pages/admin/` |
| 🟢 低 | 询盘 D1 加索引（按 created_at / status） | `src/pages/api/inquiry.ts` |
| 🟢 低 | 加 sitemap.xml（已有 @astrojs/sitemap，但部分页面可能没收录） | `astro.config.mjs` |
| 🟢 低 | Cloudflare Turnstile 验证码（防询盘机器人） | `src/pages/contact.astro` |
| 🟢 低 | 产品图 lazy load 优化 + WebP 格式 | `public/assets/images/` |

---

## 9. 紧急情况处理

### 9.1 网站挂了
1. https://huinongplants.com 看具体错误
2. CF Dashboard → Pages → huinong-website → Deployments → 看最近部署状态
3. 如果是部署失败，看 build 日志
4. 如果是运行时错误，看 Functions 日志

### 9.2 询盘收不到
1. 看 `contact@huinongplants.com` 邮箱（垃圾箱也看）
2. Resend Dashboard → Logs 看发件状态
3. 检查 RESEND_API_KEY 是否过期

### 9.3 域名访问不了
1. CF Dashboard → DNS → Records 看解析是否正常
2. 万里账号下 Nameservers 配置是否正确

---

## 10. 关键 URL 速查

| 用途 | URL |
|---|---|
| 线上网站 | https://huinongplants.com |
| 询盘后台 | https://huinongplants.com/admin/ |
| CF Pages | https://dash.cloudflare.com → Pages → huinong-website |
| CF D1 | https://dash.cloudflare.com → D1 → huinong-inquiries |
| Resend | https://resend.com |
| GitHub 仓库 | https://github.com/Wanlii/huinong-website |
| 域名管理 | CF Dashboard → DNS |

---

## 11. 联系人

| 角色 | 人 | 联系方式 |
|---|---|---|
| 前项目维护（离职交接中） | 万里 | （你已联系） |
| 公司业务 | 老板 / 销售 | （接手人直接联系） |
| 公司 IT（账号权限） | 老板安排 | （CF / Resend 账号在公司名下，找老板加权限） |

---

## 12. 接手人第一次操作清单

按这个顺序来：

- [ ] 1. 确认 GitHub 仓库 transfer 到了你的账号
- [ ] 2. clone 仓库到本地
- [ ] 3. 在项目根创建 `.env` 文件，填 4 个值
- [ ] 4. 改 `ADMIN_PASSWORD` 成自己的密码
- [ ] 5. 改 `ADMIN_SECRET` 成自己的随机字符串
- [ ] 6. `npm install`
- [ ] 7. `npm run dev` 验证本地能跑（http://localhost:4321）
- [ ] 8. 让 IT 加你进 Cloudflare 账号
- [ ] 9. 让 IT 加你进 Resend 账号
- [ ] 10. 在 CF Pages → Environment variables 设这 4 个值
- [ ] 11. 在 CF Pages → Settings → Builds → 确认 Build command 是 `npm run build`，Output dir 是 `dist`
- [ ] 12. 触发一次部署，验证网站能正常 deploy
- [ ] 13. 修改 D1 询盘表的访问权限（需要 IT 把你的 CF 账号加入 D1 数据库的访问列表）
- [ ] 14. 测试询盘表单：填一个测试询盘，看 `contact@huinongplants.com` 是否收到邮件
- [ ] 15. 测试 admin 后台：用新密码登录 `/admin/`，看询盘列表
- [ ] 16. 删掉旧 API token（旧 token 值由万里线下单独提供；在 CF Dashboard → My Profile → API Tokens 找到对应名称的 token 删掉）
- [ ] 17. 通知公司业务方：网站技术维护联系人更新到你

---

## 13. 文档版本

- v1.0 — 2026-09-14  万里交接时初版
- 后续接手人增补请在末尾加 `v1.x — YYYY-MM-DD — 说明`

---

**祝顺利！** 接手过程有疑问可以先问万里（离职前这段时间），之后维护问题找公司 IT 或 CF 文档。
