const ts = require(require.resolve('typescript', { paths: [process.cwd()] }));
const { registerHooks } = require('node:module');
const { existsSync, readFileSync, writeFileSync } = require('node:fs');
const { createHash } = require('node:crypto');
const { resolve } = require('node:path');
const { fileURLToPath, pathToFileURL } = require('node:url');
const assert = require('node:assert/strict');
const dir = 'C:/Users/Admin/.t3/local-drafts/mansion-r1/delivery/';
const file = 'packages/core/src/world/__tests__/npc-generator.test.ts';
const logs = readFileSync(dir+'R1.1-generator-blocker.txt','utf8');
const pairs = Array.from(logs.matchAll(/Expected: "([0-9a-f]{64})"\r?\nReceived: "([0-9a-f]{64})"/g), ([, before, after]) => ({ before, after }));
assert.equal(pairs.length,4);
const lines=require('node:child_process').execFileSync('git',['show','8d37d16ca24420987e6b1294257da13bcdefb5a2:'+file],{encoding:'utf8'}).split(/\r?\n/);
const samples=[[0,1,'guild',0],[42,3,'auction-house',2],[2026,4,'slave-market','lot'],[2026,1,'auction-house','lot']];
const sha = value => createHash('sha256').update(JSON.stringify(value),'utf8').digest('hex');
registerHooks({
  load(url, context, next) {
    if (url.startsWith('file:') && url.endsWith('.ts')) {
      const source = readFileSync(fileURLToPath(url),'utf8');
      const compiled = ts.transpileModule(source,{ fileName: fileURLToPath(url), compilerOptions:{module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022} });
      return {source:compiled.outputText,format:'module',shortCircuit:true};
    }
    return next(url,context);
  },
  resolve(specifier, context, next) {
    if (specifier.startsWith('.') && specifier.endsWith('.js') && context.parentURL?.startsWith('file:')) {
      const source = new URL(specifier.slice(0, -3)+'.ts',context.parentURL);
      if (existsSync(fileURLToPath(source))) return next(source.href,context);
    }
    return next(specifier,context);
  }
});
async function record() {
  const { generateNpc } = await import(pathToFileURL(resolve('packages/core/src/world/npc-generator.ts')).href);
  const records = pairs.map((pair, index) => {
    const sample = samples[index], generated = generateNpc(...sample), baseline = structuredClone(generated);
    for (const key of ['room','role','training']) {
      assert.equal(generated.npc.household[key],null);
      delete baseline.npc.household[key];
    }
    assert.equal(sha(baseline),pair.before);
    assert.equal(sha(generated),pair.after);
    const line=24+index, old=lines[line-1];
    assert.ok(old.includes(pair.before));
    const after=old.replace(pair.before,pair.after);
    return {file,line,sample,before:old,after,afterUtf8Base64:Buffer.from(after).toString('base64'),beforeHash:pair.before,afterHash:pair.after};
  });
  writeFileSync(dir+'R1.1-HOLD-byte-inventory.json',JSON.stringify({reason:'Only room, role and training initialized to null changed the four serialized NPCs',records},null,2)+'\n');
  for (const r of records) console.log(r.file+':'+r.line, r.beforeHash,'→',r.afterHash);
}
record().catch(error=>{console.error(error);process.exitCode=1;});
