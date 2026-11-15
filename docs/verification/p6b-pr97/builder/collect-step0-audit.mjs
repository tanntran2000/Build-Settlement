import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const evidence = dirname(fileURLToPath(import.meta.url));
const base = '0de2d1ffa91abadf76ced9696f440a09bf19f8af';
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const git = (...args) => execFileSync('git', args, { maxBuffer: 64 * 1024 * 1024 });
const paths = git('ls-tree', '-r', '--name-only', base).toString('utf8').trim().split('\n');
const tests = paths.filter(p => /(?:\.test|\.spec)\.[cm]?[jt]sx?$/.test(p));
const fixturePaths = paths.filter(p => /(?:^|\/)(?:fixtures|__snapshots__)(?:\/|$)/.test(p) || /(?:^|\/)fixtures\.[jt]s$/.test(p) || /golden/i.test(p));
const pinPaths = paths.filter(p => /\.[cm]?[jt]sx?$/.test(p) && !p.startsWith('docs/') && /createHash|toMatch(?:Inline)?Snapshot/.test(git('show', `${base}:${p}`).toString('utf8')));
const dataPaths = paths.filter(p => p.startsWith('packages/core/src/data/') && p.endsWith('.json'));
const immutablePaths = [...new Set([...fixturePaths, ...pinPaths, ...dataPaths])].sort();
const entries = immutablePaths.map(path => {
  const bytes = git('show', `${base}:${path}`);
  return { path, gitBlob: git('rev-parse', `${base}:${path}`).toString('utf8').trim(), sha256: sha(bytes), bytes: bytes.length,
    groups: [fixturePaths.includes(path) && 'fixture/golden', pinPaths.includes(path) && 'pin/snapshot source', dataPaths.includes(path) && 'core data'].filter(Boolean) };
});
const fixtureFindings = fixturePaths.filter(p => p.endsWith('.json')).map(path => {
  const bytes = git('show', `${base}:${path}`), text = bytes.toString('utf8');
  const value = JSON.parse(text), occurrences = [], reports = [];
  function walk(v, at) {
    if (typeof v === 'string') {
      // Golden and browser fixture maps contain serialized sessions.
      if (/^[\[{]/.test(v)) { try { walk(JSON.parse(v), `${at}::<JSON>`); } catch {} }
      return;
    }
    if (!v || typeof v !== 'object') return;
    for (const [key, child] of Object.entries(v)) {
      const next = `${at}.${key}`;
      if (key === 'workshops') occurrences.push(next);
      if (key === 'crafted' || key === 'workshopsIdle') reports.push(next);
      walk(child, next);
    }
  }
  walk(value, '$');
  return { path, sha256: sha(bytes), workshopPaths: occurrences, craftingReportPaths: reports };
});
const queries = [
  ['posts', 'NPC_MANAGER_BUILDING_TYPES|managerSlotTileIds|freeManagerSlots|postLabel|Manager —|LOCKED_POST|ASSIGN_NPC'],
  ['item-shape', 'isItemsState|ItemsState|nextItemId|materials.*market.*goals'],
  ['report-shape', 'ItemWeekReport|report\\.items|\\.report!?\\.items|readItemReport|hospitalOperated|pendingLegendary'],
  ['replace-removal', 'REPLACE|CLEAR|building\\s*=\\s*null|demolish|removeBuilding'],
  ['persistence-places', 'place:|\\.place|sessionToRecords|recordsToSession|StoreRecordError'],
  ['pins-hashes', 'createHash|[a-f0-9]{64}|toMatchSnapshot|toMatchInlineSnapshot|60 weeks|sixty weeks'],
  ['commands', 'ITEM_COMMAND_TYPES|ItemCommandType|PLACE_CRAFT_ORDER|CANCEL_CRAFT_ORDER|workshops|WORKSHOP_BUSY'],
];
const search = queries.map(([name, pattern]) => {
  const args = ['--json', '--color', 'never', '--glob', '*.ts', '--glob', '*.tsx', '--glob', '*.js', '--glob', '*.mjs', '--glob', '*.cjs', '--glob', '*.svelte', '--glob', '*.json', pattern, '.'];
  const run = spawnSync('rg', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  if (![0, 1].includes(run.status)) throw Error(`${name}: ${run.stderr}`);
  const matches = run.stdout.split('\n').filter(Boolean).map(line => JSON.parse(line)).filter(v => v.type === 'match').map(({data}) => {
    const line = data.lines.text.replace(/\r?\n$/, '');
    return { path: data.path.text.replaceAll('\\', '/').replace(/^\.\//, ''), line: data.line_number,
      text: line.length <= 800 ? line : `${line.slice(0, 400)} [LONG LINE: ${line.length} chars; full line SHA256 ${sha(Buffer.from(line))}]`,
      matched: [...new Set(data.submatches.map(m => m.match.text))] };
  });
  return { name, command: ['rg', ...args], exit: run.status, matches };
});
const write = (name, value) => writeFileSync(join(evidence, name), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
write('step0-repo-inventory.json', { base, trackedFiles: paths.length, testFiles: tests, fixtureFiles: fixturePaths, pinFiles: pinPaths, dataFiles: dataPaths });
write('immutable-baseline.json', { base, tree: git('rev-parse', `${base}^{tree}`).toString('utf8').trim(), policy: 'Exact Git bytes; zero allowed changes. Working files may use the repository CRLF checkout conversion only.', entries });
write('step0-fixture-scan.json', { base, jsonFiles: fixtureFindings.length, findings: fixtureFindings });
write('step0-search-results.json', { base, utc: new Date().toISOString(), scope: 'Whole repo: all TS/TSX/JS/MJS/CJS/Svelte/JSON sources, including root configs and all unit/e2e/tooling tests; long matching lines carry a digest and source reference.', queries: search });
console.log(JSON.stringify({ base, trackedFiles: paths.length, tests: tests.length, fixtures: fixturePaths.length, immutable: entries.length, fixtureJson: fixtureFindings.length,
  fixtureWorkshopPaths: fixtureFindings.flatMap(f => f.workshopPaths).length,
  queries: search.map(s => ({ name: s.name, matches: s.matches.length, files: new Set(s.matches.map(m => m.path)).size })) }, null, 2));
