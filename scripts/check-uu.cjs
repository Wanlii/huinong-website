const { execSync } = require('child_process');
const repo = 'D:/agentspace/minimaxspace/huinong-website';
const out = execSync(`git -C "${repo}" status --short`, { encoding: 'utf8' });
const uu = out.split('\n').filter(l => l.startsWith('UU') || l.startsWith('AA') || l.startsWith('DD'));
console.log('Still conflicted:', uu.length);
uu.forEach(l => console.log(' ', l));
