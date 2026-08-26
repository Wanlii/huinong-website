const fs = require('fs');
const src1 = 'C:/Users/97126/AppData/Local/Temp/slug_171815b.astro';
const dst1 = 'D:/agentspace/minimaxspace/huinong-website/src/pages/products/[slug].astro';
fs.copyFileSync(src1, dst1);
console.log('Copied zh. Size:', fs.statSync(dst1).size, 'bytes');

const src2 = 'C:/Users/97126/AppData/Local/Temp/slug_en_171815b.astro';
const dst2 = 'D:/agentspace/minimaxspace/huinong-website/src/pages/en/products/[slug].astro';
fs.copyFileSync(src2, dst2);
console.log('Copied en. Size:', fs.statSync(dst2).size, 'bytes');
