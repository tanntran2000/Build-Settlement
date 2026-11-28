
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const {scoreMansionCalibration}=await import('./scripts/mansion-calibration.ts');
const input=JSON.parse(readFileSync('C:/Users/Admin/.t3/local-drafts/mansion-r2/delivery/r2.4-retune-1.json','utf8'));
const rows=structuredClone(input.rows);
const changed=rows.find(row=>row.seed===2026 && row.difficulty==='normal' && row.style==='good' && row.week===13);
const {comfortSupply,comfortNeed}=changed.mansion.report;
changed.mansion.report.comfortSupply=comfortNeed-1;
const misses=scoreMansionCalibration(rows).misses;
assert.deepEqual(scoreMansionCalibration(input.rows).misses,[]);
assert.deepEqual(misses,['2026/normal/good: good-comfort']);
console.log(JSON.stringify({changed:{seed:2026,difficulty:'normal',style:'good',week:13,comfortSupplyBefore:comfortSupply,comfortSupplyAfter:comfortNeed-1,comfortNeed},misses}));

