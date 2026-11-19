import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const path = "packages/core/src/trial/__tests__/society-p7b.test.ts";
const previousHead = 'ced2f88a67daffb8f9fe01fff67f966e82474fc1';
const git = (...args) => execFileSync('git', args, { encoding: 'utf8' });
assert.equal(git('rev-parse', 'HEAD').trim(), previousHead);
assert.equal(git('status', '--porcelain=v1'), '');
const before = git('cat-file', 'blob', previousHead + ':' + path);
assert.equal(readFileSync(path, 'utf8'), before);
let after = before;
for (const { before:old, after:replacement } of [{"approval":"P2","path":"packages/core/src/trial/__tests__/society-p7b.test.ts","checkoutEol":"LF","before":"import { validateBuildings } from '../../data/validate.js';\nimport buildings from '../../data/buildings.json' with { type: 'json' };\n","after":"import { validateBuildings, validateTuning } from '../../data/validate.js';\nimport buildings from '../../data/buildings.json' with { type: 'json' };\nimport tuning from '../../data/tuning.json' with { type: 'json' };\n"},{"approval":"P2","path":"packages/core/src/trial/__tests__/society-p7b.test.ts","checkoutEol":"LF","before":"it('uses the v11 ruleset and refuses the v10 checkpoint unchanged', () => {\n","after":"it(\"rejects missing and non-integer Retainers' Hall caps\", () => {\n  const failures = [{}, { maxPerCity: 1.5 }].map(RETAINERS_HALL_TRIAL => {\n    try {\n      validateTuning({ ...tuning, RETAINERS_HALL_TRIAL });\n      return null;\n    } catch (error) {\n      return error instanceof Error ? error.message : null;\n    }\n  });\n  const message = 'tuning.json#RETAINERS_HALL_TRIAL.maxPerCity: expected integer > 0';\n  expect(failures).toStrictEqual([message, message]);\n});\n\nit('uses the v11 ruleset and refuses the v10 checkpoint unchanged', () => {\n"}]) {
  assert.equal(after.split(old).length, 2, path);
  after = after.replace(old, () => replacement);
}
writeFileSync(path, after);
