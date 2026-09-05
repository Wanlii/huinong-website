const { execSync } = require('child_process');
const repo = 'D:/agentspace/minimaxspace/huinong-website';
function run(cmd) { return execSync(`git -C "${repo}" ${cmd}`, { encoding: 'utf8' }); }

// Add the resolved files to mark them as resolved
for (const f of ['src/lib/products.ts', 'src/pages/en/products/[slug].astro', 'src/pages/products/[slug].astro']) {
  run(`add -- "${f}"`);
  console.log('Staged:', f);
}

const status = run('status --short');
const uu = status.split('\n').filter(l => /^[UAD]{2}/.test(l));
console.log('Still conflicted:', uu.length);
