import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

// A preflight contract reproduction, not a project gate or product edit.
const root = process.cwd();
const require = createRequire(path.join(root, 'package.json'));
const ts = require('typescript');
const coreFile = 'packages/core/src/trial/crisis.ts';
const uiFile = 'packages/ui/src/CityFallen.svelte';
const core = fs.readFileSync(coreFile, 'utf8').match(/fallCause:\s*([^;]+);/)[1];
const ui = fs.readFileSync(uiFile, 'utf8').match(/export let fallCause:\s*([^;]+);/)[1];
console.log('UTC:', new Date().toISOString());
console.log('Source:', coreFile, 'fallCause:', core);
console.log('Target:', uiFile, 'fallCause:', ui);
console.log('Assignment: packages/ui/src/TileManagement.svelte:225');

function check(label, union) {
  const name = path.join(root, '__p6a_virtual_type_contract.ts');
  const source = `type Source = ${union};\ntype Target = ${ui};\ndeclare const source: NonNullable<Source>;\nconst target: Target = source;\n`;
  const options = { strict: true, noEmit: true, skipLibCheck: true, types: [] };
  const host = ts.createCompilerHost(options);
  const original = host.getSourceFile.bind(host);
  host.getSourceFile = (file, version, onError, fresh) => path.resolve(file) === path.resolve(name)
    ? ts.createSourceFile(name, source, version, true)
    : original(file, version, onError, fresh);
  const program = ts.createProgram([name], options, host);
  const diagnostics = ts.getPreEmitDiagnostics(program);
  console.log(`${label}: ${diagnostics.length} diagnostic(s)`);
  for (const d of diagnostics) console.log(`TS${d.code}: ${ts.flattenDiagnosticMessageText(d.messageText, '\n')}`);
  return diagnostics;
}

const baseline = check('Current contract', core);
const planned = check("PR A required contract (+ 'wounds')", `${core} | 'wounds'`);
const reproduced = baseline.length === 0 && planned.some(d => d.code === 2322);
console.log('Scope conflict reproduced:', reproduced);
process.exitCode = reproduced ? 1 : 2;
