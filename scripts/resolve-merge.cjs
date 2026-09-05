const { execSync } = require('child_process');
const repo = 'D:/agentspace/minimaxspace/huinong-website';

function run(cmd) {
  return execSync(`git -C "${repo}" ${cmd}`, { encoding: 'utf8' });
}

// Take their (dev) version for all conflicted files
const conflicted = [
  'src/lib/products.ts',
  'src/pages/en/products/[slug].astro',
  'src/pages/products/[slug].astro'
];

for (const f of conflicted) {
  try {
    run(`checkout --theirs -- "${f}"`);
    console.log('Resolved (theirs):', f);
  } catch (e) {
    console.log('Error resolving', f, ':', e.message);
  }
}

// Verify no more conflicts
const status = run('status --short');
const uu = status.split('\n').filter(l => /^[UAD]{2}/.test(l));
console.log('Still conflicted:', uu.length);
uu.forEach(l => console.log(' ', l));
