# 汇农天下官网

Astro 静态站，支持中英双语，部署到 Cloudflare Pages。

## 开发

```bash
npm install
npm run dev    # 本地开发，http://localhost:4321
npm run build  # 生产构建，输出到 dist/
```

## 目录结构

```
src/
├── content/         # 内容（markdown）— 后续填充
│   ├── pages/      # 页面文案
│   ├── products/   # 每个产品 1 个 md
│   └── site/       # 站点配置
├── assets/         # 图片资源
├── components/     # 组件
├── layouts/        # 布局
├── pages/          # 路由
│   ├── index.astro       # 中文首页
│   ├── about.astro
│   ├── products/
│   └── en/                # 英文版
└── styles/         # 样式
public/             # 静态文件（favicon、PDF）
```
