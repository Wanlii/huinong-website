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
// 只返回 jpg/png（不用 webp，避免图库重复显示）
function getImagesForProduct(id: string): { main: string; gallery: string[] } {
  const dir = path.join(IMG_ROOT, id);
  if (!fs.existsSync(dir)) return { main: '', gallery: [] };
  const files = fs.readdirSync(dir)
    .filter(f => /\.(jpg|jpeg|png)$/i.test(f))   // 排除 .webp
    .filter(f => !f.startsWith('.'))
    .sort();
  if (files.length === 0) return { main: '', gallery: [] };
  const urls = files.map(f => `/assets/images/products/${id}/${f}`);
  return { main: urls[0], gallery: urls };
}

let _cache: ProductCSVRow[] | null = null;
function getRows(): ProductCSVRow[] {
  if (_cache) return _cache;
  const text = fs.readFileSync(CSV_PATH, 'utf8');
  // 去掉 UTF-8 BOM
  const clean = text.charCodeAt(0) === 0xFEFF ? text.slice(1) : text;
  _cache = parseCSV(clean);
  return _cache;
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
