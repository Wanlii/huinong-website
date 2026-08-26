// Update CSV: add 子分类 and 物种 columns
const fs = require('fs');
const path = require('path');

const csvPath = 'D:/agentspace/minimaxspace/huinong-website/src/data/products.csv';
let text = fs.readFileSync(csvPath, 'utf8');
if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);

function parseLine(line) {
  const out = [];
  let cur = '', inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQ && line[i+1] === '"') { cur += '"'; i++; }
      else inQ = !inQ;
    } else if (c === ',' && !inQ) {
      out.push(cur); cur = '';
    } else cur += c;
  }
  out.push(cur);
  return out;
}

const lines = text.split(/\r?\n/).filter(Boolean);
const headers = parseLine(lines[0]);

// Insert 子分类 + 物种 after 分类 (index 4)
const newHeaders = [...headers.slice(0,5), '子分类', '物种', ...headers.slice(5)];

const premiumIds = new Set(['ziteng', 'zhongguobashu', 'zhongguoyabai']);

const newLines = [newHeaders.join(',')];
for (let i = 1; i < lines.length; i++) {
  const row = parseLine(lines[i]);
  const id = row[0];
  const cat = row[4];
  const folder = row[12] || '';

  // 子分类
  let sub = '';
  if (cat === 'potted') sub = premiumIds.has(id) ? 'premium' : 'mini';

  // 物种
  const parts = folder.split('/').filter(Boolean);
  let species = '';
  if (cat === 'ornamental') {
    species = parts[0] === '观赏苗木' ? parts[parts.length - 1] : (parts[0] || '');
  } else {
    species = parts[0] === '盆栽' && parts.length > 1 ? parts[1] : (parts[0] || '');
  }

  const newRow = [...row.slice(0,5), sub, species, ...row.slice(5)];
  newLines.push(newRow.map(v => {
    const s = String(v);
    return /[,"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }).join(','));
}

fs.writeFileSync(csvPath, '\ufeff' + newLines.join('\n') + '\n', 'utf8');
console.log('Done. Wrote', newLines.length, 'lines');

// Sample
const newHeadersPrint = newHeaders.slice(0,8).join(',');
console.log('New header (first 8):', newHeadersPrint);
for (const sampleId of ['tianerong', 'ziteng', 'jushu']) {
  const idx = newLines.findIndex(l => l.startsWith(sampleId + ','));
  if (idx > 0) {
    console.log('Sample:', newLines[idx].split(',').slice(0,8).join(','));
  }
}
