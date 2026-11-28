const fs = require('node:fs');
const cp = require('node:child_process');
const assert = require('node:assert/strict');
const root = 'C:/Users/Admin/.t3/local-drafts/mansion-r1/';
const evidence = root + 'delivery/';
const base = '8d37d16ca24420987e6b1294257da13bcdefb5a2';
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const git = (...args) => cp.execFileSync('git', args, { maxBuffer: 32 * 1024 * 1024 });
const previous = file => git('show', base + ':' + file).toString('utf8').replace(/\r\n/g, '\n');
const committed = file => git('show', 'HEAD:' + file);
const original = read(root + 'STEP0-byte-inventory.json');
const first = read(evidence + 'R1.1-HOLD-byte-inventory.json').records;
const second = read(evidence + 'R1.3-HOLD-byte-inventory.json').records;
const testFile = file => file.includes('/__tests__/') || file.startsWith('tests/e2e/');
const omit = row => row.file.endsWith('helpers/npcs.ts') && [45, 47].includes(row.line);
const edits = [...original.existingByteChanges.filter(row => testFile(row.file) && !omit(row)), ...first, ...second];
const byFile = new Map();
for (const row of edits) {
  const rows = byFile.get(row.file) ?? [];
  rows.push(row);
  byFile.set(row.file, rows);
}
const golden = original.catalogGoldenForecast;
const changed = git('diff', '--name-only', '--diff-filter=MT', base + '...HEAD').toString('utf8').trim().split(/\r?\n/);
for (const file of changed.filter(testFile)) {
  if (file === golden.file) {
    assert.deepEqual(committed(file), Buffer.from(golden.afterUtf8Base64, 'base64'), file);
    continue;
  }
  assert.ok(byFile.has(file), 'Existing test/fixture change outside byte inventory: ' + file);
  const lines = previous(file).split('\n');
  for (const row of byFile.get(file).sort((a, b) => b.line - a.line)) {
    const before = row.before.split('\n'), after = row.after.split('\n');
    assert.equal(lines.slice(row.line - 1, row.line - 1 + before.length).join('\n'), row.before, file + ':' + row.line);
    assert.equal(Buffer.from(row.afterUtf8Base64, 'base64').toString('utf8'), row.after, file + ':' + row.line);
    lines.splice(row.line - 1, before.length, ...after);
  }
  assert.equal(committed(file).toString('utf8').replace(/\r\n/g, '\n'), lines.join('\n'), file);
}
for (const row of original.newSocietyV15Forecast) {
  assert.deepEqual(committed(row.afterFile), Buffer.from(row.afterUtf8Base64, 'base64'), row.afterFile);
  assert.deepEqual(committed(row.beforeFile), git('show', base + ':' + row.beforeFile), row.beforeFile);
}
console.log('Existing changed test rows and serialized fixtures match approved bytes at ' + git('rev-parse', 'HEAD').toString().trim() + '.');

