const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const ts = require(resolve(process.cwd(), 'node_modules/typescript'));

const inputs = JSON.parse(readFileSync(0, 'utf8'));
for (const { path, before, after } of inputs) {
  function emit(raw) {
    const result = ts.transpileModule(Buffer.from(raw, 'base64').toString('utf8'), {
      fileName: path,
      compilerOptions: { target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.ESNext },
      reportDiagnostics: true,
    });
    assert.deepEqual(result.diagnostics, [], path);
    return result.outputText;
  }
  const prior = emit(before);
  assert.equal(emit(after), prior, path);
  console.log(path + ' identical emitted JavaScript SHA-256 ' +
    createHash('sha256').update(prior).digest('hex'));
}
