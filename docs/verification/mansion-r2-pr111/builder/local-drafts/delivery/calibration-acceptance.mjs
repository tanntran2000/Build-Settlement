import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const input=process.argv[2];
if (!input) {
  const {runCalibration}=await import(pathToFileURL(resolve('scripts/money-calibration.ts')).href);
  const rows=runCalibration({seeds:[2026],difficulties:['normal'],weeks:40,levies:[0]});
  const good=rows.filter(row=>row.style==='good');
  assert.equal(good.length,40);
  assert(good.find(row=>row.week===10).mansion?.roomTypes.includes('maids-quarters'),
    'Missing Mansion calibration observation for good Normal week 10.');
} else {
  const {rows,summary,misses,commands}=JSON.parse(readFileSync(input,'utf8'));
  const key=r=>[r.seed,r.difficulty,r.style].join('/');
  assert.equal(rows.length,720);
  assert.equal(summary.length,18);
  assert.deepEqual(misses,[]);
  assert.deepEqual([...new Set(summary.map(r=>r.seed))],[2026,2027,2028]);
  for (const cell of summary) {
    const all=rows.filter(r=>key(r)===key(cell));
    assert.equal(all.length,40);
    assert(all.every((r,i)=>r.week===i+1 && r.mansion.report.upkeepMilli>=0 && r.levyPercent===0),key(cell));
    if (cell.style==='good') {
      assert(all[9].mansion.roomTypes.includes('maids-quarters'),key(cell));
      assert.equal(new Set(all[29].mansion.roomTypes).size,8,key(cell));
      assert.equal(all.slice(12).filter(r=>r.mansion.report.comfortSupply<r.mansion.report.comfortNeed).length,0,key(cell));
      assert(all[12].mansion.residents>0,key(cell));
    } else if (cell.style==='average') {
      assert(all[19].mansion.roomTypes.includes('maids-quarters'),key(cell));
      assert(all[19].mansion.residents>0,key(cell));
      assert(all.slice(19).filter(r=>r.mansion.report.comfortSupply<r.mansion.report.comfortNeed).length<=5,key(cell));
    } else {
      assert(all.every(r=>r.mansion.roomTypes.length===2),key(cell));
      assert.equal(commands.filter(r=>key(r)===key(cell)).length,0,key(cell));
    }
  }
  console.log('Verified all 18 seed/style/difficulty cells, 720 weeks, route milestones and Comfort constraints.');
}

