import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

export function quantile(samples, proportion) {
  assert(samples.length > 0);
  return [...samples].sort((a, b) => a - b)[Math.ceil(proportion * samples.length) - 1];
}

export function readBlocks(file) {
  return readFileSync(file, 'utf8').trimEnd().split(/\r?\n/).map(line => JSON.parse(line));
}

export function legacyRule(rows, quantiles = [0.5, 0.95]) {
  return quantiles.map(q => {
    const shift = rows.map(row => quantile(row.headMs, q) - quantile(row.baseMs, q));
    const control = rows.map(row => Math.abs(quantile(row.aa2, q) - quantile(row.aa1, q)));
    return { q, candidate: quantile(shift, 0.5), control: Math.max(...control),
      met: quantile(shift, 0.5) <= Math.max(...control) };
  });
}

if (process.argv[2]) {
  const all = readBlocks(process.argv[2]);
  const legacy = Object.fromEntries(['normal', 'easy'].map(difficulty =>
    [difficulty, legacyRule(all.filter(row => row.difficulty === difficulty))]));
  console.log(JSON.stringify(legacy, null, 2));
  assert.equal(legacy.normal.every(metric => metric.met), false, 'Normal tail is unresolved and must not clear acceptance');
}
