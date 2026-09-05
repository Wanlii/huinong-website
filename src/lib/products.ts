// 产品数据层 - 盆栽图集（v2）
// Build-time only (Astro frontmatter)
//
// 结构说明（2026-09 改造后）：
//   1. products.csv 保留为 header-only（旧数据已清空）
//   2. 全部产品详情下架
//   3. 盆栽模块：仅 2 个分类（精品盆栽 / 小盆栽）
//      - 封面图：public/assets/images/potted/{slug}-cover.jpg
//      - 图集：public/assets/images/potted/{slug}/*.jpg
//   4. 旧函数（getAllProducts 等）保留空实现，避免引用方崩

import fs from 'fs';
import path from 'path';

const PUBLIC_POTTED = path.join(process.cwd(), 'public/assets/images/potted');

// 盆栽分类配置（硬编码，不走 CSV）
export interface PottedCategory {
  slug: 'jingpin' | 'xiaopin';
  zh: string;       // 中文名
  en: string;       // 英文名
  zhDesc: string;
  enDesc: string;
  cover: string;    // 封面 URL
  galleryDir: string; // 物理路径
  count: number;    // 图集图片数
}

const CATEGORY_META: Record<string, { zh: string; en: string; zhDesc: string; enDesc: string }> = {
  jingpin: {
    zh: '精品盆栽',
    en: 'Premium Bonsai',
    zhDesc: '松柏 · 杂木 · 崖柏 · 传统造型精品',
    enDesc: 'Conifers · Hardwoods · Cliff-style · Classic Designs',
  },
  xiaopin: {
    zh: '小盆栽',
    en: 'Small Bonsai',
    zhDesc: '迷你盆景 · 桌面摆件 · 馈赠佳品',
    enDesc: 'Mini Bonsai · Desktop Decor · Gift Choice',
  },
};

function getCategoryMeta(slug: string) {
  return CATEGORY_META[slug] || { zh: slug, en: slug, zhDesc: '', enDesc: '' };
}

function listGalleryImages(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => /\.(jpg|jpeg|png)$/i.test(f))
    .filter(f => !f.startsWith('.'))
    .sort((a, b) => a.localeCompare(b, 'en', { numeric: true, sensitivity: 'base' }));
}

/** 取得所有盆栽分类（精品盆栽 / 小盆栽） */
export function getPottedCategories(): PottedCategory[] {
  const slugs: Array<'jingpin' | 'xiaopin'> = ['jingpin', 'xiaopin'];
  return slugs.map(slug => {
    const galleryDir = path.join(PUBLIC_POTTED, slug);
    const coverFile = path.join(PUBLIC_POTTED, `${slug}-cover.jpg`);
    const cover = fs.existsSync(coverFile)
      ? `/assets/images/potted/${slug}-cover.jpg`
      : '';
    const meta = getCategoryMeta(slug);
    const images = listGalleryImages(galleryDir);
    return {
      slug,
      zh: meta.zh,
      en: meta.en,
      zhDesc: meta.zhDesc,
      enDesc: meta.enDesc,
      cover,
      galleryDir,
      count: images.length,
    };
  });
}

/** 取得单个分类的图集图片 URL 列表 */
export function getCategoryGallery(slug: string): string[] {
  const dir = path.join(PUBLIC_POTTED, slug);
  return listGalleryImages(dir).map(f => `/assets/images/potted/${slug}/${f}`);
}

/** 单分类元信息 */
export function getCategoryInfo(slug: string): PottedCategory | undefined {
  return getPottedCategories().find(c => c.slug === slug);
}

// ============================================
// 旧接口（保持空实现，避免引用方崩）
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
  // products.csv 现在是 header-only，没有数据行
  _cache = [];
  return _cache;
}

export function getAllProducts(): Product[] {
  return getRows().map(r => ({
    ...r,
    mainImage: '',
    gallery: [],
    emoji: '',
  })).sort((a, b) => a.order - b.order);
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
  return { ornamental: 0, potted: getPottedCategories().length, total: getPottedCategories().length };
}
