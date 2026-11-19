import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { stripVTControlCharacters } from 'node:util';

const evidence = process.argv[2];
const read = file => readFileSync(file, 'utf8').replace(/^\uFEFF/, '');
const source = stripVTControlCharacters(read(join(evidence, 'smoke-full.txt')));
const gates = JSON.parse(read(join(evidence, 'gate-summary.json')));
const previousFailures = JSON.parse(read(join(evidence, '..', 'smoke-reruns', 'summary.json')));
assert.equal(previousFailures.results.length, 56);
assert.match(source, /^CI=1\r?$/m);
const launch = /Running (\d+) tests using 1 worker/.exec(source);
assert(launch, 'Expected the full single-worker smoke log');
const banners = [...source.matchAll(/^\s*(ok|x|×|✘|-)\s+(\d+)\s+\[chromium\]\s+›\s+(tests[\\/].+?\.spec\.ts):(\d+):\d+\s+›\s+([^\r\n]+)$/gm)];
const cases = banners.map(([,status,position,file,line,title]) => ({
  result: status === 'ok' ? 'passed' : status === '-' ? 'skipped' : 'failed',
  position: Number(position),
  file: file.replaceAll('\\','/'),
  line: Number(line),
  title: title.replace(/\s+\(\d+(?:\.\d+)?(?:ms|s|m)\)\s*$/, '').trim(),
}));
assert.equal(cases.length, Number(launch[1]));
assert.deepEqual(cases.map(row => row.position), Array.from({length: cases.length}, (_,index) => index+1));
const map = new Map(cases.map(row => [row.file+'\0'+row.title, row]));
const previous = previousFailures.results.map(({file,title}) => {
  const result = map.get(file+'\0'+title);
  assert(result, 'Prior failure absent from completed smoke: '+file+' '+title);
  return result;
});
const totals = Object.fromEntries(['passed','failed','skipped'].map(result => [result,cases.filter(row => row.result === result).length]));
for (const [result,count] of Object.entries(totals)) {
  const declared = new RegExp('^\\s*(\\d+) '+result+'(?: \\(.*\\))?\\s*$','m').exec(source);
  assert.equal(declared ? Number(declared[1]) : 0, count, result);
}
const step = gates.gates.find(gate => gate.id === 'smoke-full');
assert.equal(step.exitCode, totals.failed > 0 ? 1 : 0);
assert(source.startsWith('HEAD '+gates.head));
const result = { head:gates.head, tree:gates.tree, CI:1, cases:cases.length, totals,
  elapsedMs:Date.parse(step.endUtc)-Date.parse(step.startUtc),
  priorFailuresAtCorrection4:previous.length,
  nowPassed:previous.filter(row => row.result === 'passed').length,
  priorCasesOnThisHead:previous,
  failed:cases.filter(row => row.result === 'failed') };
writeFileSync(join(evidence, 'smoke-summary.json'), JSON.stringify(result, null, 2)+'\n');
console.log(JSON.stringify({...result,priorCasesOnThisHead:undefined},null,2));
