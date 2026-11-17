import fs from 'node:fs';
const dir='C:/Users/Admin/.t3/local-drafts/p6b-prC/astra-review';
const checks=JSON.parse(fs.readFileSync(dir+'/independent-checks.json','utf8'));
const results=[
'PASS: X1 exact; forwards read-only NPC list.',
'PASS: Smithy panel and NPC propagation; existing routing retained.',
'PASS: Common/Rare material hint; existing rarity label and frame retained.',
'PASS: Buy/Brew keyboard tabs, panels and error forwarding.',
'PASS: Optional crafting tables; conditional full-width layout; existing letter order retained.',
'PASS: X2/X3 exact; existing current-revision dispatcher and returned state path.',
'P2 F1: this-week count uses potential capacity without operation checks; other panel behaviors reviewed.',
'Coverage gap for F1: meaningful projection tests, but no zero-Herbs/funding parity assertion.',
'P2 F1: workshopCapacity omits Herbs and funded operation; other projections reviewed.',
'PASS: P1-P3 exact; strict visible-table parser and unique catalog lookup.',
'PASS with F1 coverage gap: real place/cancel/End Week and rendered reports; keyboard/audit cases reviewed.'
];
const rows=checks.rows.map((r,i)=>({...r,howRead:'Full individual diff, sed -n paging; saved '+String(i+1).padStart(2,'0')+'.diff',result:results[i]}));
fs.writeFileSync(dir+'/ledger.json',JSON.stringify(rows,null,2)+'\n');
fs.writeFileSync(dir+'/ledger.md','# PR #98 per-file review ledger\n\nBase 43fcb9b; head '+checks.head+'. Counts taken directly from git diff --numstat. All 11 individual diffs read fully; no large-JSON substitution needed.\n\n| Path | + | - | How read | Result |\n|---|---:|---:|---|---|\n'+rows.map(r=>`| ${r.path} | ${r.added} | ${r.deleted} | ${r.howRead} | ${r.result} |`).join('\n')+'\n| TOTAL: 11 files | 589 | 12 | | |\n');
console.log('Saved ledger.md and ledger.json: 11 rows, +589/-12.');
