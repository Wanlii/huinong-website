// 产品数据层 - 完整版（v2.2 恢复产品列表 + chips + 搜索 + 图集）
// Build-time only (Astro frontmatter)
//
// 结构：
//   /products/                    — 观赏苗木产品列表（默认入口）
//                                    顶部：chips(种属 拉丁+中文) + 搜索框
//                                    默认：27 个产品卡片
//                                    筛选时：3 列图集，铺开该种属的所有图片
//   /products/potted/             — 盆栽 2 张子卡（精品盆景 + 小微盆景）
//   /products/potted/jingpin/     — 精品盆景图集
//   /products/potted/xiaowei/     — 小微盆景图集

import fs from 'fs';
import path from 'path';

const CSV_PATH = path.join(process.cwd(), 'src/data/products.csv');
const IMG_ROOT = path.join(process.cwd(), 'public/assets/images/products');
const PUBLIC_POTTED = path.join(process.cwd(), 'public/assets/images/potted');

// ============================================
// CSV + 产品
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

function parseCSVLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (c === ',' && !inQuotes) {
      out.push(cur); cur = '';
    } else {
      cur += c;
    }
  }
  out.push(cur);
  return out;
}

function parseCSV(text: string): ProductCSVRow[] {
  const clean = text.charCodeAt(0) === 0xFEFF ? text.slice(1) : text;
  const lines = clean.split(/\r?\n/).filter(Boolean);
  const headers = parseCSVLine(lines[0]);
  return lines.slice(1).map(line => {
    const cells = parseCSVLine(line);
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h] = cells[i]; });
    return {
      id: obj.id,
      zhName: obj['中文名'],
      enName: obj['英文名'],
      latin: obj['拉丁学名'],
      category: obj['分类'] as 'ornamental' | 'potted',
      subcategory: (obj['子分类'] || '') as 'premium' | 'mini' | '',
      species: obj['物种'] || '',
      height: obj['高度'],
      pot: obj['盆器'],
      moq: obj['MOQ'],
      shortDesc: obj['简短描述'],
      longDesc: obj['详细描述'],
      featured: obj['精选'] === '是',
      order: parseInt(obj['排序']) || 999,
      imageFolder: obj['图片文件夹'] || '',
    } as ProductCSVRow;
  });
}

let _rows: ProductCSVRow[] | null = null;
function getRows(): ProductCSVRow[] {
  if (_rows) return _rows;
  const text = fs.readFileSync(CSV_PATH, 'utf8');
  _rows = parseCSV(text);
  return _rows;
}

export interface Product extends ProductCSVRow {
  mainImage: string;
  gallery: string[];
  emoji: string;
}

// 1.* 优先 + 数字优先 + 字母排序
function getImagesForProduct(id: string): { main: string; gallery: string[] } {
  const dir = path.join(IMG_ROOT, id);
  if (!fs.existsSync(dir)) return { main: '', gallery: [] };
  const files = fs.readdirSync(dir)
    .filter(f => /\.(jpg|jpeg|png)$/i.test(f))
    .filter(f => !f.startsWith('.'));
  if (files.length === 0) return { main: '', gallery: [] };

  const numeric = files
    .filter(f => /^\d+\./.test(f))
    .sort((a, b) => parseInt(a) - parseInt(b));
  const others = files
    .filter(f => !/^\d+\./.test(f))
    .sort((a, b) => a.localeCompare(b, 'en', { numeric: true, sensitivity: 'base' }));

  const ordered = [...numeric, ...others];
  const urls = ordered.map(f => `/assets/images/products/${id}/${f}`);
  const mainFile = ordered.find(f => /^1\./.test(f)) || ordered[0];
  const main = mainFile ? `/assets/images/products/${id}/${mainFile}` : '';
  return { main, gallery: urls };
}

function getEmoji(cat: string, zh: string): string {
  const map: Record<string, string> = {
    '紫薇': '🌸', '天鹅绒紫薇': '🌸', '川红紫薇': '🌺', '紫叶紫薇': '🍃',
    '红枫': '🍁', '黑松': '🌲', '棕榈': '🌴', '榕树': '🌳', '玉兰': '🌷',
    '北美海棠': '🌸', '杜鹃': '🌺', '红花檵木': '🌹', '罗汉松': '🌿', '银杏': '🍂',
  };
  return map[zh] || (cat === 'potted' ? '🪴' : '🌳');
}

function enrich(row: ProductCSVRow): Product {
  const imgs = getImagesForProduct(row.id);
  return {
    ...row,
    mainImage: imgs.main,
    gallery: imgs.gallery,
    emoji: getEmoji(row.category, row.zhName),
  };
}

export function getAllProducts(): Product[] {
  return getRows().map(enrich).sort((a, b) => a.order - b.order);
}

export function getProduct(id: string): Product | undefined {
  return getRows().find(r => r.id === id);
}

export function getFeaturedProducts(): Product[] {
  return getAllProducts().filter(p => p.featured);
}

export function getProductsByCategory(cat: 'ornamental' | 'potted'): Product[] {
  return getAllProducts().filter(p => p.category === cat);
}

// 取得某 category 下的所有 species（去重，按出现顺序）
// 返回 [{zh, en, latin, count}, ...]
export interface SpeciesInfo {
  zh: string;       // 中文种属名
  en: string;       // 英文种属名（用 enName 近似）
  latin: string;    // 拉丁学名
  count: number;    // 该种属下的产品数
  sample: Product;  // 代表产品（用于图集兜底）
}

export function getSpeciesByCategory(cat: 'ornamental' | 'potted'): SpeciesInfo[] {
  const map = new Map<string, SpeciesInfo>();
  for (const p of getAllProducts()) {
    if (p.category !== cat || !p.species) continue;
    if (map.has(p.species)) {
      map.get(p.species)!.count++;
    } else {
      map.set(p.species, {
        zh: p.species,
        en: p.enName,
        latin: p.latin,
        count: 1,
        sample: p,
      });
    }
  }
  return Array.from(map.values());
}

// 给定种属名，返回该种属下所有产品的图集（去重，按主产品顺序）
export function getSpeciesImages(species: string): string[] {
  const products = getAllProducts().filter(p => p.species === species);
  const images: string[] = [];
  for (const p of products) {
    for (const img of p.gallery) {
      if (!images.includes(img)) images.push(img);
    }
  }
  return images;
}

export function getActualSpeciesCounts(): { ornamental: number; potted: number; total: number } {
  const ornamental = getAllProducts().filter(p => p.category === 'ornamental').length;
  const potted = getAllProducts().filter(p => p.category === 'potted').length;
  return { ornamental, potted, total: ornamental + potted };
}

// ============================================
// 2 大类（首页 + 列表页用）
// ============================================

export interface TopCategory {
  slug: 'ornamental' | 'potted';
  zh: string;
  en: string;
  zhDesc: string;
  enDesc: string;
  cover: string;
  hasSub: boolean;
  subCount: number;
  totalPhotos: number;
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

export function getTopCategories(): TopCategory[] {
  const slugs: Array<'ornamental' | 'potted'> = ['ornamental', 'potted'];
  const pottedSub = getPottedSubCategories();
  return slugs.map(slug => {
    const meta = TOP_META[slug];
    const coverFp = path.join(process.cwd(), `public/assets/images/category/${slug}.jpg`);
    const hasSub = slug === 'potted';
    const totalPhotos = slug === 'potted' ? pottedSub.reduce((s, c) => s + c.count, 0) : 0;
    return {
      slug,
      zh: meta.zh,
      en: meta.en,
      zhDesc: meta.zhDesc,
      enDesc: meta.enDesc,
      cover: fileExists(coverFp) ? `/assets/images/category/${slug}.jpg` : '',
      hasSub,
      subCount: hasSub ? pottedSub.length : 0,
      totalPhotos,
    };
  });
}

// ============================================
// 盆栽子分类（jingpin / xiaowei）
// ============================================

export interface SubCategory {
  slug: 'jingpin' | 'xiaowei';
  parent: 'potted';
  zh: string;
  en: string;
  zhDesc: string;
  enDesc: string;
  cover: string;
  galleryDir: string;
  count: number;
}

const SUB_META: Record<string, { zh: string; en: string; zhDesc: string; enDesc: string }> = {
  jingpin: {
    zh: '精品盆景',
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

function fileExists(p: string): boolean {
  try { return fs.existsSync(p); } catch { return false; }
}

function listGalleryImages(dir: string): string[] {
  if (!fileExists(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => /\.(jpg|jpeg|png)$/i.test(f))
    .filter(f => !f.startsWith('.'))
    .sort((a, b) => a.localeCompare(b, 'en', { numeric: true, sensitivity: 'base' }));
}

export function getPottedSubCategories(): SubCategory[] {
  const slugs: Array<'jingpin' | 'xiaowei'> = ['jingpin', 'xiaowei'];
  return slugs.map(slug => {
    const meta = SUB_META[slug];
    const galleryDir = path.join(PUBLIC_POTTED, slug);
    const coverFp = path.join(PUBLIC_POTTED, `${slug}-cover.jpg`);
    const images = listGalleryImages(galleryDir);
    return {
      slug,
      parent: 'potted' as const,
      zh: meta.zh,
      en: meta.en,
      zhDesc: meta.zhDesc,
      enDesc: meta.enDesc,
      cover: fileExists(coverFp) ? `/assets/images/potted/${slug}-cover.jpg` : '',
      galleryDir,
      count: images.length,
    };
  });
}

export function getPottedSubCategory(slug: string): SubCategory | undefined {
  return getPottedSubCategories().find(s => s.slug === slug);
}

export function getPottedGallery(slug: string): string[] {
  const dir = path.join(PUBLIC_POTTED, slug);
  return listGalleryImages(dir).map(f => `/assets/images/potted/${slug}/${f}`);
}
