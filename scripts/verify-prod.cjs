const fs = require('fs');
const body = fs.readFileSync('C:/Users/97126/AppData/Local/Temp/prod_chuanhong.html', 'utf8');
console.log('=== 详情页 chuanhong (生产) ===');
console.log('  thumb divs:', (body.match(/<div class="pd-thumb/g) || []).length, '(期望 17 + 1 容器 = 18)');
console.log('  pd-more (应被删):', body.includes('pd-more') ? 'YES (BAD)' : 'no (good)');
console.log('  查看全部 (应被删):', body.includes('查看全部') ? 'YES (BAD)' : 'no (good)');
console.log('  1.5fr 1fr grid:', body.includes('1.5fr 1fr') ? 'yes' : 'no');
console.log('  询盘此产品 btn:', body.includes('询盘此产品') ? 'yes' : 'no');

// also test dujuan
const d = fs.readFileSync('C:/Users/97126/AppData/Local/Temp/prod_chuanhong.html', 'utf8');
console.log('  data-gallery attr:', d.includes('data-gallery=') ? 'yes' : 'no');
