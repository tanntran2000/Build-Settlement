import fs from 'node:fs';
const root='C:/Users/Admin/.t3/local-drafts/p6b-prC/',out=root+'fix-round1/';
fs.copyFileSync(root+'checksum-verification.txt',out+'previous-checksum-verification.txt');
const source=fs.readFileSync(root+'finalize-checksums.ps1','utf8')
  .replaceAll('09a042a7a3e5c9b0cb09ccbecdd293bf86b4e29f','ed4105f9aa0054396bf0da7b21cb6a27ddbdaa37')
  .replaceAll('0ae12c7f62462fb14090a61c788a998f00a031ca','a164cb535cb914ee19f6e027b97013479c08e786');
fs.writeFileSync(out+'finalize-checksums.ps1',source,'utf8');
console.log('Prepared new-head checksum procedure; previous transcript preserved.');
