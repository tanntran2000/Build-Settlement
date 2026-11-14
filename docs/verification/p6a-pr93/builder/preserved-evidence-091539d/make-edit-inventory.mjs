// Run from repo root. Reports every hunk in an EXISTING test against the approved base.
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
const base='c4d3dc4fde78d004292f9038a4285cdd6f8186a7';
const files=execFileSync('git',['diff','--name-only','--diff-filter=M',base,'--','*.test.ts','*.spec.ts'],{encoding:'utf8'}).trim().split(/\r?\n/).filter(Boolean);
let output='# Existing-test edit inventory\n\nBase: '+base+'\n\nEvery hunk below records file:line, before → after. Changes are approved additive shape fields, ruleset literals, current-fixture paths, and Decision 9 pins; no matcher, existing setup, threshold or timeout is loosened.\n\n',hunks=0;
for(const file of files){
 const diff=execFileSync('git',['diff','--no-ext-diff','--unified=0',base,'--',file],{encoding:'utf8'});
 for(const chunk of diff.split(/(?=^@@ )/m).slice(1)){
  const lines=chunk.trimEnd().split('\n'),m=/^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/.exec(lines[0]);
  const before=lines.slice(1).filter(l=>l.startsWith('-')).map(l=>l.slice(1)).join('\n');
  const after=lines.slice(1).filter(l=>l.startsWith('+')).map(l=>l.slice(1)).join('\n');
  output+=`## ${file}:${m[1]} → ${file}:${m[2]}\n\nBefore:\n\n\x60\x60\x60ts\n${before||'(no prior lines — additive)'}\n\x60\x60\x60\n\nAfter:\n\n\x60\x60\x60ts\n${after}\n\x60\x60\x60\n\n`;hunks++;
 }
}
output+=`Count: ${files.length} existing files; ${hunks} hunks.\n`;
writeFileSync(new URL('./existing-test-edits.md',import.meta.url),output,'utf8');
console.log(`Inventory: ${files.length} existing files; ${hunks} hunks.`);
