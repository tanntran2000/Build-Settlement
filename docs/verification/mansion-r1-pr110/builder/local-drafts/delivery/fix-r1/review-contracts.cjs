const { execFileSync } = require('node:child_process');
const { readFileSync } = require('node:fs');

const revision = process.argv[2];
const read = path => revision ? execFileSync('git', ['show', revision + ':' + path], { encoding: 'utf8' }) : readFileSync(path, 'utf8');
const files = [
  'packages/core/src/mansion/__tests__/catalog.test.ts',
  'packages/simulation/src/__tests__/mansion-command.test.ts',
  'packages/persistence/src/__tests__/upgrade-v14.test.ts',
  'packages/ui/src/__tests__/v14-load.test.ts',
];
const violations = files.flatMap(path => read(path).split(/\r?\n/).flatMap((line, i) =>
  /\b(?:toMatchObject|stringContaining)\s*\(/.test(line) ? [path + ':' + (i + 1) + ' ' + line.trim()] : [],
));
console.log('Finding 8: ' + violations.length + ' prohibited assertion sites');
for (const violation of violations) console.log(violation);

const spec = read('tests/e2e/mansion-rooms.spec.ts');
const required = [
  'continues a v14 IndexedDB slot with NPCs, workshop rows and an existing migration marker',
  'successfully imports a v14 checkpoint in game without writing the local slot',
];
const missing = required.filter(title => !spec.includes("test('" + title + "'"));
console.log('Finding 10: ' + missing.length + ' required integration cases absent');
for (const title of missing) console.log(title);
console.log('The coverage audit checks registration. Browser execution verifies the assertions.');
process.exitCode = violations.length || missing.length ? 1 : 0;
