import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
const repo='C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01',out='C:/Users/Admin/.t3/local-drafts/p6b-prA';
const run=(cmd,args)=>{const r=spawnSync(cmd,args,{cwd:repo,encoding:'utf8'});if(r.error)throw r.error;return {command:[cmd,...args].join(' '),stdout:r.stdout,stderr:r.stderr,exit:r.status};};
const fetch=run('git',['fetch','origin']);
const fields=Object.fromEntries([['head',['rev-parse','HEAD']],['tree',['rev-parse','HEAD^{tree}']],['originMain',['rev-parse','origin/main']],['branch',['branch','--show-current']],['status',['status','--porcelain=v1']]].map(([key,args])=>{const r=run('git',args);if(r.exit)throw Error(key);return[key,r.stdout.trim()];}));
const ports=run('powershell.exe',['-NoProfile','-Command',"$p=@(Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { $_.LocalPort -in 4173,4174 } | Select-Object LocalPort,OwningProcess); ConvertTo-Json -InputObject $p -Compress"]);
const listeners=JSON.parse(ports.stdout.trim());
const record={...fields,utc:new Date().toISOString(),exit:fetch.exit||ports.exit||listeners.length?1:0,fetch,ports,listeners,note:'A0 preflight only. No tests, builds, product edits or process termination.'};
fs.writeFileSync(path.join(out,'step0-preflight-checks.txt'),JSON.stringify(record,null,2)+'\n','utf8');
// Normalize text evidence that PowerShell redirection may have emitted as UTF-16.
for(const name of fs.readdirSync(out))if(/\.(txt|md|json|mjs)$/.test(name)){
 const p=path.join(out,name),bytes=fs.readFileSync(p);
 if(bytes[0]===0xff&&bytes[1]===0xfe)fs.writeFileSync(p,bytes.subarray(2).toString('utf16le'),'utf8');
 else new TextDecoder('utf-8',{fatal:true}).decode(bytes);
}
fs.writeFileSync(path.join(out,'progress.md'),'# Inline ledger - plan: C:/Users/Admin/.t3/local-drafts/p6b-prA/binding-plan-cd1b18a.md\n\nA0: complete preflight; HOLD for the owner before A1 RED. 58 proposed blocks / 35 tests, no repository changes.\n\nWorkflow adaptation: use the approved external evidence root as the ledger; no subagents per direct owner instructions. Independent review belongs to Claude/Astra. No silent ruling on plan gaps: society.ts scope, two A2 test files and new set prices are included in the required single A0 HOLD.\n\nShared interface audit: A1 produces frozen ITEM_CATALOG/RECIPES/CRAFT_TRIAL; A2 consumes larger Market pool and validates v9 fixture/golden data. The deterministic append order is recorded in step0-candidates.mjs; historical ids stay intact. New workshop state and commands are PR B, with no PR A order/week/UI edits.\n','utf8');
console.log(JSON.stringify(record,null,2));
if(record.exit)process.exitCode=record.exit;
