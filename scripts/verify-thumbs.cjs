const fs = require('fs');

function check(file, name) {
  const body = fs.readFileSync(file, 'utf8');
  const renderedDivs = (body.match(/<div class="pd-thumb/g) || []).length;
  console.log(`=== ${name} ===`);
  console.log('  渲染的 thumb div:', renderedDivs);
  console.log('  pd-more 按钮 (应被删):', body.includes('pd-more') ? 'YES (BAD)' : 'no (good)');
  console.log('  查看全部/View all (应被删):', body.includes('查看全部') || body.includes('View all') ? 'YES (BAD)' : 'no (good)');
}

check('D:/agentspace/minimaxspace/huinong-website/dist/products/chuanhong/index.html', 'chuanhong (川红紫薇 17 张)');
check('D:/agentspace/minimaxspace/huinong-website/dist/products/dujuan/index.html', 'dujuan (杜鹃 10 张)');
check('D:/agentspace/minimaxspace/huinong-website/dist/products/ziteng/index.html', 'ziteng (紫藤 8 张)');
check('D:/agentspace/minimaxspace/huinong-website/dist/products/dujuan/index.html', 'dujuan (杜鹃 10 张)');

