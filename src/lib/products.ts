// 产品数据层 - 读取 CSV + 扫描 public/ 下的图片
// Build-time only (Astro frontmatter)

import fs from 'fs';
import path from 'path';

const CSV_PATH = path.join(process.cwd(), 'src/data/products.csv');
const IMG_ROOT = path.join(process.cwd(), 'public/assets/images/products');

export interface ProductCSVRow {
  id: string;
  zhName: string;
  enName: string;
  latin: string;
  category: 'ornamental' | 'potted';
  subcategory: 'premium' | 'mini' | '';  // 仅 potted 有值: premium=精品盆栽, mini=小微盆栽
  species: string;                          // 物种（用于分组筛选）
  height: string;
  pot: string;
  moq: string;
  shortDesc: string;
  longDesc: string;
  featured: boolean;
  order: number;
  imageFolder: string;
}

// 简单 CSV 解析器（支持引号转义）
function parseCSV(text: string): ProductCSVRow[] {
  const lines: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (inQuotes && text[i + 1] === '"') { cur += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (c === '\n' || c === '\r') {
      if (cur.length) { lines.push(cur); cur = ''; }
      if (c === '\r' && text[i + 1] === '\n') i++;
    } else {
      cur += c;
    }
  }
  if (cur.length) lines.push(cur);

  const headers = lines[0].split(',');
  return lines.slice(1).map(line => {
    const cells = parseCSVLine(line);
    const obj: any = {};
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

// 读取产品图片
// 用户约定:
//   1) 优先 1.* 作为主图
//   2) 没有 1.* 时按"数字优先 + 非数字字母序"取第一张
//   3) 整体顺序: 数字编号图片按数字大小排在前，非数字命名的按文件名字母序排在后
function getImagesForProduct(id: string): { main: string; gallery: string[] } {
  const dir = path.join(IMG_ROOT, id);
  if (!fs.existsSync(dir)) return { main: '', gallery: [] };
  const files = fs.readdirSync(dir)
    .filter(f => /\.(jpg|jpeg|png)$/i.test(f))   // 排除 .webp (避免重复)
    .filter(f => !f.startsWith('.'));
  if (files.length === 0) return { main: '', gallery: [] };

  // 数字命名 (1.jpg, 2.jpg, ..., 20.jpg) → 按数字升序
  const numeric = files
    .filter(f => /^\d+\./.test(f))
    .sort((a, b) => parseInt(a) - parseInt(b));
  // 非数字命名 (a.jpg, hash 文件名等) → 按字母升序
  const others = files
    .filter(f => !/^\d+\./.test(f))
    .sort((a, b) => a.localeCompare(b, 'en', { numeric: true, sensitivity: 'base' }));

  const ordered = [...numeric, ...others];
  const urls = ordered.map(f => `/assets/images/products/${id}/${f}`);

  // 主图: 找 1.* (精准匹配, 不会误中 10.jpg/11.jpg); 没有则取排序后第一张
  const mainFile = ordered.find(f => /^1\./.test(f)) || ordered[0];
  const main = mainFile ? `/assets/images/products/${id}/${mainFile}` : '';
  return { main, gallery: urls };
}

let _cache: ProductCSVRow[] | null = null;
function getRows(): ProductCSVRow[] {
  if (_cache) return _cache;
  const text = fs.readFileSync(CSV_PATH, 'utf8');
  // 去掉 UTF-8 BOM
  const clean = text.charCodeAt(0) === 0xFEFF ? text.slice(1) : text;
  const rows = parseCSV(clean);
  // 兜底: 如果 CSV 里没填 species/subcategory，从 imageFolder 推断
  for (const r of rows) {
    if (!r.species) r.species = deriveSpecies(r);
    if (r.category === 'potted' && !r.subcategory) r.subcategory = 'mini'; // 默认小微
  }
  _cache = rows;
  return _cache;
}

function deriveSpecies(r: ProductCSVRow): string {
  const parts = r.imageFolder.split('/').filter(Boolean);
  if (r.category === 'ornamental') {
    // 路径以"观赏苗木"开头 → species 是最后一段
    if (parts[0] === '观赏苗木') return parts[parts.length - 1] || r.zhName;
    // 否则 species 是第一段
    return parts[0] || r.zhName;
  }
  // potted: 都是 "盆栽/X" → X
  if (parts[0] === '盆栽' && parts.length > 1) return parts[1];
  return parts[0] || r.zhName;
}

// 公开接口（带图片）
export interface Product extends ProductCSVRow {
  mainImage: string;
  gallery: string[];
  emoji: string;
}

// 分类 emoji 映射
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
  return enrich(getRows().find(r => r.id === id)!);
}

export function getFeaturedProducts(): Product[] {
  return getAllProducts().filter(p => p.featured);
}

export function getProductsByCategory(cat: 'ornamental' | 'potted'): Product[] {
  return getAllProducts().filter(p => p.category === cat);
}

// 从素材目录统计实际品种数（CSV 可能滞后，以源文件为准）
// 观赏苗木 = 造型树 + 观赏树，盆栽 = 盆栽目录
// Build-time only
export function getActualSpeciesCounts(): { ornamental: number; potted: number; total: number } {
  const root = path.join(process.cwd(), '素材/处理后/产品图片');
  let ornamental = 0;
  let potted = 0;

  for (const sub of ['观赏苗木/造型树', '观赏苗木/观赏树']) {
    const dir = path.join(root, sub);
    if (fs.existsSync(dir)) {
      ornamental += fs.readdirSync(dir, { withFileTypes: true })
        .filter(d => d.isDirectory()).length;
    }
  }

  const pottedDir = path.join(root, '盆栽');
  if (fs.existsSync(pottedDir)) {
    potted = fs.readdirSync(pottedDir, { withFileTypes: true })
      .filter(d => d.isDirectory()).length;
  }

  return { ornamental, potted, total: ornamental + potted };
}

// 取得某 category 下的所有 species（去重，按出现顺序）
export function getSpeciesByCategory(cat: 'ornamental' | 'potted'): string[] {
  const seen: string[] = [];
  for (const p of getAllProducts()) {
    if (p.category === cat && p.species && !seen.includes(p.species)) {
      seen.push(p.species);
    }
  }
  return seen;
}
