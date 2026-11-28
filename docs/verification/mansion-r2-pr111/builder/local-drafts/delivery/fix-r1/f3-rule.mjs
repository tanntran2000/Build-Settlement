import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

function quantile(samples, fraction) {
  assert(samples.length > 0);
  return [...samples].sort((a, b) => a - b)[Math.ceil(samples.length * fraction) - 1];
}

export function stats(samples) {
  return {
    n: samples.length, median: quantile(samples, 0.5), p95: quantile(samples, 0.95),
    min: Math.min(...samples), max: Math.max(...samples),
  };
}

// Predeclared F3 acceptance. Pooled and block summaries use identical nearest-rank
// statistics on both pairs. A positive A/B shift must fit the observed A/A noise.
// Cap the pooled A/A tolerance at the 87.5th percentile of absolute A/A block
// shifts. Also compare that robust control bound against the signed candidate
// block shifts at the same percentile. The largest block cannot set either limit.
// A negative candidate shift poses no regression for the corresponding statistic.
export function compare(blocks) {
  const sides = ['baseMs', 'headMs', 'aa1', 'aa2'];
  const pooled = Object.fromEntries(sides.map(side => [side, stats(blocks.flatMap(block => block[side]))]));
  const perBlock = blocks.map(block => ({
    block: block.block, order: block.order,
    ...Object.fromEntries(sides.map(side => [side, stats(block[side])])),
  }));
  const metrics = Object.fromEntries(['median', 'p95'].map(key => {
    const pooledCandidate = pooled.headMs[key] - pooled.baseMs[key];
    const pooledControl = pooled.aa2[key] - pooled.aa1[key];
    const deltas = perBlock.map(block => ({
      block: block.block, candidate: block.headMs[key] - block.baseMs[key], control: block.aa2[key] - block.aa1[key],
    }));
    const controlBound = quantile(deltas.map(row => Math.abs(row.control)), 0.875);
    const pooledBound = Math.min(Math.abs(pooledControl), controlBound);
    const blockCandidate = quantile(deltas.map(row => row.candidate), 0.875);
    return [key, { pooledCandidate, pooledControl, pooledBound, blockCandidate, controlBound,
      pooledMet: pooledCandidate <= pooledBound, blockMet: blockCandidate <= controlBound, deltas }];
  }));
  const met = Object.values(metrics).every(metric => metric.pooledMet && metric.blockMet);
  return { met, pooled, metrics, perBlock };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const rows = readFileSync(process.argv[2], 'utf8').trimEnd().split(/\r?\n/).map(line => JSON.parse(line));
  const replay = Object.fromEntries(['normal', 'easy'].map(difficulty =>
    [difficulty, compare(rows.filter(row => row.difficulty === difficulty))]));
  assert.equal(replay.normal.metrics.p95.pooledMet, false);
  assert.equal(replay.normal.met, false);
  console.log(JSON.stringify(replay, null, 2));
}
