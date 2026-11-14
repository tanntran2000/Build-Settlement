import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url)),base='a391fbb3fe530d7ad5c9139c03dfe56b6bcf02ce';
const git=args=>execFileSync('git',args),text=args=>git(args).toString('utf8').trim();
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const manifest=path.join(root,'immutable-baseline.json');
const existing=text(['ls-tree','-r','--name-only',base]).split(/\r?\n/);
const approved=JSON.parse(fs.readFileSync(path.join(root,'..','step0-proposed-edits.json'),'utf8'));
const pFiles=new Set(approved.map(p=>p.file));
const protectedFiles=existing.filter(file=>pFiles.has(file)||file==='packages/simulation/src/__tests__/fixtures/catalog-golden.json'||file.startsWith('packages/persistence/src/__tests__/fixtures/')||file.startsWith('packages/core/src/data/')&&file.endsWith('.json')||/\.(test|spec)\.ts$/.test(file)||file.startsWith('tests/e2e/'));
if(process.argv.includes('--capture')){
 assert.equal(text(['rev-parse','HEAD']),base);assert.equal(text(['status','--porcelain=v1']),'');
 const files=protectedFiles.map(file=>({file,workingBytes:fs.statSync(file).size,workingSha256:hash(fs.readFileSync(file)),baseBlobSha256:hash(git(['show',`${base}:${file}`])),p1p22:pFiles.has(file)}));
 fs.writeFileSync(manifest,JSON.stringify({base,tree:text(['rev-parse','HEAD^{tree}']),utc:new Date().toISOString(),note:'Working bytes captured at the clean base; original git blob bytes are checked separately, preserving Windows line endings.',files},null,2)+'\n',{encoding:'utf8',flag:'wx'});
 console.log(`Captured immutable baseline once: ${files.length} files; ${pFiles.size} P1–P22 files.`);
}
const baseline=JSON.parse(fs.readFileSync(manifest,'utf8'));
assert.equal(baseline.base,base);assert.deepEqual(baseline.files.map(e=>e.file),protectedFiles);
for(const entry of baseline.files){
 assert.equal(hash(fs.readFileSync(entry.file)),entry.workingSha256,`HOLD working byte change: ${entry.file}`);
 assert.equal(hash(git(['show',`HEAD:${entry.file}`])),entry.baseBlobSha256,`HOLD committed blob change: ${entry.file}`);
}
const allowed=new Set(['packages/core/src/trial/items.ts','packages/core/src/trial/types.ts','packages/simulation/src/tile-trial-week.ts','packages/simulation/src/__tests__/legendary-pending.test.ts','packages/simulation/src/__tests__/exhausted-materials.test.ts']);
for(const file of text(['diff','--name-only',base]).split(/\r?\n/).filter(Boolean))assert.ok(allowed.has(file),`HOLD scope change: ${file}`);
for(const file of text(['ls-files','--others','--exclude-standard']).split(/\r?\n/).filter(Boolean))assert.ok(allowed.has(file),`HOLD untracked scope change: ${file}`);
console.log(`PASS: ${baseline.files.length} protected files retain exact working bytes and committed blobs from a391fbb; includes every existing test, all fixtures, golden, data/pins, and 12 P1–P22 files. Only correction 6 product files and two new test files may differ.`);
