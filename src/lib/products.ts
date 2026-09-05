// 产品数据层 - 2 级分类（v2.1）
// Build-time only (Astro frontmatter)
//
// 2026-09 改造后结构：
//   2 大分类（首页 + 列表页）：
//     1) 观赏苗木 (ornamental) — 当前空（无源图）
//     2) 盆栽 (potted)
//          └─ 精品盆栽 (jingpin)  52 张图
//          └─ 小微盆景 (xiaowei)  22 张图
//
//   封面：public/assets/images/category/{slug}.jpg
//   子封面：public/assets/images/potted/{subSlug}-cover.jpg
//   图集：public/assets/images/potted/{subSlug}/*.jpg
//
// 旧 CSV-based 接口保留为安全空实现，避免引用方崩

import fs from 'fs';
import path from 'path';

const PUBLIC_CATEGORY = path.join(process.cwd(), 'public/assets/images/category');
const PUBLIC_POTTED   = path.join(process.cwd(), 'public/assets/images/potted');

// ============================================
// 2 级分类接口
// ============================================

export interface TopCategory {
  slug: 'ornamental' | 'potted';
  zh: string;
  en: string;
  zhDesc: string;
  enDesc: string;
  cover: string;          // /assets/images/category/{slug}.jpg
  hasSub: boolean;        // 是否有子分类
  subCount: number;       // 直接子分类数（图集页用）
  totalPhotos: number;    // 该分类下总图片数（用于 trust bar）
}

export interface SubCategory {
  slug: 'jingpin' | 'xiaowei';
  parent: 'potted';
  zh: string;
  en: string;
  zhDesc: string;
  enDesc: string;
  cover: string;          // /assets/images/potted/{slug}-cover.jpg
  galleryDir: string;     // 物理路径
  count: number;          // 图集图片数
}

function fileExists(p: string): boolean {
  try { return fs.existsSync(p); } catch { return false; }
}

function coverUrl(fp: string, url: string): string {
  return fileExists(fp) ? url : '';
}

function listGalleryImages(dir: string): string[] {
  if (!fileExists(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => /\.(jpg|jpeg|png)$/i.test(f))
    .filter(f => !f.startsWith('.'))
    .sort((a, b) => a.localeCompare(b, 'en', { numeric: true, sensitivity: 'base' }));
}

const TOP_META: Record<string, { zh: string; en: string; zhDesc: string; enDesc: string }> = {
  ornamental: {
    zh: '观赏苗木',
    en: 'Ornamental Plants',
    zhDesc: '造型树 · 观赏树 · 庭院与行道',
    enDesc: 'Specimen trees · Landscape trees · Garden & street',
  },
  potted: {
    zh: '盆栽',
    en: 'Potted Plants (Bonsai)',
    zhDesc: '精品盆景 · 小微盆景 · 造型与桌面摆件',
    enDesc: 'Premium bonsai · Small bonsai · Designer & desktop',
  },
};

const SUB_META: Record<string, { zh: string; en: string; zhDesc: string; enDesc: string }> = {
  jingpin: {
    zh: '精品盆栽',
    en: 'Premium Bonsai',
    zhDesc: '松柏 · 杂木 · 崖柏 · 传统造型精品',
    enDesc: 'Conifers · Hardwoods · Cliff-style · Classic Designs',
  },
  xiaowei: {
    zh: '小微盆景',
    en: 'Small Bonsai',
    zhDesc: '迷你盆景 · 桌面摆件 · 馈赠佳品',
    enDesc: 'Mini bonsai · Desktop decor · Gift choice',
  },
};

/** 2 大分类 */
export function getTopCategories(): TopCategory[] {
  const slugs: Array<'ornamental' | 'potted'> = ['ornamental', 'potted'];

  const pottedSub = getSubCategories('potted');

  return slugs.map(slug => {
    const meta = TOP_META[slug];
    const coverFp = path.join(PUBLIC_CATEGORY, `${slug}.jpg`);
    let totalPhotos = 0;
    if (slug === 'potted') {
      totalPhotos = pottedSub.reduce((s, c) => s + c.count, 0);
    }
    return {
      slug,
      zh: meta.zh,
      en: meta.en,
      zhDesc: meta.zhDesc,
      enDesc: meta.enDesc,
      cover: coverUrl(coverFp, `/assets/images/category/${slug}.jpg`),
      hasSub: slug === 'potted',
      subCount: slug === 'potted' ? pottedSub.length : 0,
      totalPhotos,
    };
  });
}

/** 单个 top category */
export function getTopCategory(slug: string): TopCategory | undefined {
  return getTopCategories().find(c => c.slug === slug);
}

/** 某 top 下的子分类（目前只有 potted 有） */
export function getSubCategories(parent: 'ornamental' | 'potted'): SubCategory[] {
  if (parent !== 'potted') return [];
  const slugs: Array<'jingpin' | 'xiaowei'> = ['jingpin', 'xiaowei'];
  return slugs.map(slug => {
    const meta = SUB_META[slug];
    const galleryDir = path.join(PUBLIC_POTTED, slug);
    const coverFp = path.join(PUBLIC_POTTED, `${slug}-cover.jpg`);
    const images = listGalleryImages(galleryDir);
    return {
      slug,
      parent: 'potted',
      zh: meta.zh,
      en: meta.en,
      zhDesc: meta.zhDesc,
      enDesc: meta.enDesc,
      cover: coverUrl(coverFp, `/assets/images/potted/${slug}-cover.jpg`),
      galleryDir,
      count: images.length,
    };
  });
}

/** 单个子分类 */
export function getSubCategory(slug: string): SubCategory | undefined {
  for (const sub of getSubCategories('potted')) {
    if (sub.slug === slug) return sub;
  }
  return undefined;
}

/** 图集图片 URL 列表（仅 jingpin/xiaowei 有图） */
export function getCategoryGallery(slug: string): string[] {
  const dir = path.join(PUBLIC_POTTED, slug);
  return listGalleryImages(dir).map(f => `/assets/images/potted/${slug}/${f}`);
}

// ============================================
// 旧接口（安全空实现，避免引用方崩）
// ============================================

export interface ProductCSVRow {
  id: string;
  zhName: string;
  enName: string;
  latin: string;
  category: 'ornamental' | 'potted';
  subcategory: 'premium' | 'mini' | '';
  species: string;
  height: string;
  pot: string;
  moq: string;
  shortDesc: string;
  longDesc: string;
  featured: boolean;
  order: number;
  imageFolder: string;
}

export interface Product extends ProductCSVRow {
  mainImage: string;
  gallery: string[];
  emoji: string;
}

let _cache: ProductCSVRow[] | null = null;
function getRows(): ProductCSVRow[] {
  if (_cache) return _cache;
  _cache = [];
  return _cache;
}

export function getAllProducts(): Product[] {
  return [];
}

export function getProduct(_id: string): Product | undefined {
  return undefined;
}

export function getFeaturedProducts(): Product[] {
  return [];
}

export function getProductsByCategory(_cat: 'ornamental' | 'potted'): Product[] {
  return [];
}

export function getSpeciesByCategory(_cat: 'ornamental' | 'potted', _lang: 'zh' | 'en' = 'zh'): string[] {
  return [];
}

export function getActualSpeciesCounts(): { ornamental: number; potted: number; total: number } {
  const subs = getSubCategories('potted');
  return {
    ornamental: 0,
    potted: subs.length,
    total: 2 + subs.length,
  };
}
