// node packages/simulation/src/__tests__/fixtures/golden-path-diff.ts BEFORE AFTER
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';

interface Scenario {seed:number;session:string;[key:string]:unknown}
const [beforePath,afterPath]=process.argv.slice(2);
const read=(p:string):Scenario[]=>JSON.parse(readFileSync(p,'utf8'));
function paths(a:unknown,b:unknown,path=''):string[]{
  if(JSON.stringify(a)===JSON.stringify(b))return [];
  if(a===null||b===null||typeof a!=='object'||typeof b!=='object'||Array.isArray(a)!==Array.isArray(b))return [path];
  const left=a as Record<string,unknown>,right=b as Record<string,unknown>;
  return [...new Set([...Object.keys(left),...Object.keys(right)])].flatMap(key=>{
    const p=path?`${path}.${key}`:key;
    return !Object.hasOwn(left,key)||!Object.hasOwn(right,key)?[p]:paths(left[key],right[key],p);
  });
}
const before=read(beforePath),after=read(afterPath);
assert.equal(before.length,after.length);
console.log('UTC:',new Date().toISOString());
for(const p of [beforePath,afterPath])console.log('SHA256',createHash('sha256').update(readFileSync(p)).digest('hex'),p);
for(const old of before){
  const next=after.find(s=>s.seed===old.seed);assert.ok(next);
  const {session:oldText,...oldSummary}=old,{session:newText,...newSummary}=next;
  assert.deepEqual(newSummary,oldSummary);
  const a=JSON.parse(oldText),b=JSON.parse(newText);
  assert.equal(b.format,a.format);assert.equal(b.schemaVersion,a.schemaVersion);
  assert.equal(a.cityRulesetId,'tile-society-07');assert.equal(b.cityRulesetId,'tile-society-08');
  const changed=paths(a.state,b.state);
  console.log(`Seed ${old.seed}: ${changed.join(', ')}`);
  assert.deepEqual([...changed].sort(),['city.society.items','city.society.rulesetId']);
}
console.log('PASS: only city.society.rulesetId and city.society.items differ in all decoded sessions.');
