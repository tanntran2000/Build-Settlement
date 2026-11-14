import fs from 'node:fs';
const text=fs.readFileSync('C:/Users/Admin/.t3/local-drafts/p6a-prC/fix1/smoke-full.raw.txt','utf8');
const completed=text.split(/\r?\n/).filter(line=>/^\s+(?:ok|x)\s+\d+/.test(line));
console.log(JSON.stringify({passed:completed.filter(line=>/^\s+ok\s+/.test(line)).length,failed:completed.filter(line=>/^\s+x\s+/.test(line)).length,latest:completed.slice(-2)},null,2));
