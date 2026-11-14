import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const root=path.dirname(fileURLToPath(import.meta.url));
const base='5e9674e31fb017f730dced4178514ebbfe1dbf24';
const git=args=>execFileSync('git',args,{encoding:'utf8'}).trim();
assert.equal(git(['rev-parse','HEAD']),base);
assert.equal(git(['status','--porcelain=v1']),'');
assert.equal(git(['diff','--name-only',base+'...HEAD']),'');
const proposals=JSON.parse(fs.readFileSync(path.join(root,'step0-proposed-edits.json'),'utf8'));
const reference=JSON.parse(fs.readFileSync(path.join(root,'step0-proposed-items-and-pins.json'),'utf8'));
const index=JSON.parse(fs.readFileSync(path.join(root,'step0-test-file-index.json'),'utf8'));
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
for(const entry of index)assert.equal(hash(fs.readFileSync(entry.file)),entry.sha256,`Source changed: ${entry.file}`);
function paths(a,b,p=''){
 if(JSON.stringify(a)===JSON.stringify(b))return [];
 if(a===null||b===null||typeof a!=='object'||typeof b!=='object'||Array.isArray(a)!==Array.isArray(b))return[p];
 return [...new Set([...Object.keys(a),...Object.keys(b)])].flatMap(k=>!Object.hasOwn(a,k)||!Object.hasOwn(b,k)?[p?p+'.'+k:k]:paths(a[k],b[k],p?p+'.'+k:k));
}
const fixtureDiff=[];
for(const name of ['life-5-weeks','life-laws']){
 const file=`packages/persistence/src/__tests__/fixtures/society-v8/${name}.json`;
 const before=JSON.parse(fs.readFileSync(file,'utf8')),after=JSON.parse(fs.readFileSync(path.join(root,'proposed-fixtures',name+'.json'),'utf8'));
 const changed=paths(before.state,after.state);
 assert.ok(changed.length>0&&changed.every(p=>p.startsWith('city.society.items.')));
 fixtureDiff.push({file,line:1,beforeSha256:hash(fs.readFileSync(file)),proposalSha256:hash(fs.readFileSync(path.join(root,'proposed-fixtures',name+'.json'))),paths:changed});
}
fs.writeFileSync(path.join(root,'step0-proposed-fixture-paths.json'),JSON.stringify(fixtureDiff,null,2)+'\n','utf8');
const line=(file,needle)=>fs.readFileSync(file,'utf8').split(/\r?\n/).findIndex(l=>l.includes(needle))+1;
const plan='C:/Users/Admin/.t3/local-drafts/p6a-prA/binding-plan-ba75ec8.md';
const sourcePoints={
 pinRule:line(plan,'Hash pins:'),decision12:line(plan,'12. **Drug Store'),allowlist:line(plan,'PR B  packages/simulation'),
 floor:line('packages/simulation/src/character-life-command.ts','Math.max(1'),
 validateIds:line('packages/core/src/data/validate.ts','const BUILDING_IDS'),
 uiSentence:line('packages/ui/src/CharacterLifeCharacters.svelte','NPC effects on output'),
 fixture5:line('packages/simulation/src/__tests__/crisis-fixtures.test.ts',"expect(readFileSync(url,'utf8')).toBe(bytes)"),
 fixtureLaw:line('packages/simulation/src/__tests__/law-fixture.test.ts','expect(bytes).toBe(encoded.text)'),
};
const summary=proposals.reduce((map,p)=>{const value=map.get(p.file)??{file:p.file,lines:[],ids:[]};value.lines.push(p.line);value.ids.push('P'+p.id);map.set(p.file,value);return map;},new Map());
const rows=[...summary.values()].map(p=>`| ${p.file}:${[...new Set(p.lines)].join(', ')} | ${p.ids.join(', ')} |`).join('\n');
const report=`# P6-A PR B — Step 0 HOLD

**Status: HOLD for owner decision.** No RED, unit/e2e suite, build, fixture generator, product/test edit or commit ran. This is a static source audit plus independent proposed draw/hash calculations.

Branch: feat/p6a-week-rules. HEAD/base: ${base}. Tree: ${git(['rev-parse','HEAD^{tree}'])}. Working status: empty. UTC: ${new Date().toISOString()}.

Owner Tân, 2026-11-14, verbatim: **"Giao Builder B"**. Binding plan: [ba75ec8](binding-plan-ba75ec8.md); [spec v0.3](binding-spec-17e7aaf.md). The user's Step 0 requires this HOLD before RED or product work, even though the executing-plans skill normally continues between tasks.

## Audit coverage

Scanned **${index.length} tracked unit/e2e/architecture test and support TypeScript files** across the repo. [Complete file index with source SHA-256](step0-test-file-index.json); [untruncated topic matches](step0-search-hits.json); [search script](step0-scan.mjs). Topics: health/floor/wounds, reserved/catalog/Drug Store, NPC posts, Market/item state, report shapes and fixture/golden equality. Read the affected assertions and their producers/importers. [All ten v8 fixture states and hashes](step0-v8-fixture-manifest.json).

## Exact existing-test proposals

The complete current text, reason and exact after-text for every proposed edit are in [step0-proposed-edits.md](step0-proposed-edits.md) and machine-readable [JSON](step0-proposed-edits.json). Full proposed file copies are under proposed-test-files/, outside the repo. **22 blocks in 12 files**, of which P20–P22 (two files) are conditional on a minimal UI-copy scope extension. P3–P4 explicitly ask for the zero-health policy; P13–P16 ask for the visible-report projection. Nothing has been applied.

| Existing source locations | Proposal blocks |
|---|---|
${rows}

These cover: lethal wound health 0 and wounds fall cause; the existing zero-health edge; wound fixture health 81 after damage 20 + regen 1; two appended NPC post types; Drug Store catalog/name/reserved expectations; two typed synthetic report additions; the UI report parser's new-field projection; exact five-week item state; both catalog pins; and optional status-sentence tests.

## Confirmed plan/allowlist gaps requiring the owner

1. **Drug Store needs a trial definition and a second pin change.** buildings.json has society.drug-store reserved=true but no trial.drug-store. Decision 12 (plan line ${sourcePoints.decision12}) requires Hospital-level-1 costs/upkeep, so merely setting reserved=false cannot make it buildable. TRIAL_BUILDINGS is validated against a closed id list at packages/core/src/data/validate.ts:${sourcePoints.validateIds}; add only drug-store to that list, which is outside the PR B allowlist at plan line ${sourcePoints.allowlist}. The brief permits only SOCIETY_BUILDINGS to change, but TRIAL_BUILDINGS must also change. Proposed new definition (append at the end of trial catalog):

\`\`\`json
${JSON.stringify(reference.drugStore.definition,null,2)}
\`\`\`

maxLevel 1 and maxWorkers 0 are proposed minimal choices needing confirmation with the catalog exception. The cost is 8 Gold / 4 Wood / 2 Iron and upkeep is 1 Gold, copied exactly from Hospital level 1. Society staff remains null. Pin proposals:

\`\`\`text
SOCIETY_BUILDINGS: ${reference.drugStore.oldSocietyHash} → ${reference.drugStore.proposedSocietyHash}
TRIAL_BUILDINGS: ${reference.drugStore.oldTrialHash} → ${reference.drugStore.proposedTrialHash}
\`\`\`

All other pins remain unchanged. These are candidate hashes for this exact catalog/order, not product changes.

2. **Two v8 fixtures need scoped regeneration.** packages/simulation/src/__tests__/crisis-fixtures.test.ts:${sourcePoints.fixture5} pins runtime-generated bytes; law-fixture.test.ts:${sourcePoints.fixtureLaw} does the same. life-5-weeks resolves 5 End Weeks, life-laws resolves 3. Decision 7 changes finds and Market stock, so these cannot remain byte-equal to the PR A files while retaining their assertions. Request permission to regenerate ONLY life-5-weeks.json and life-laws.json once using the existing generators; keep both equality assertions unchanged. Exact proposed after-files are [life-5-weeks.json](proposed-fixtures/life-5-weeks.json) and [life-laws.json](proposed-fixtures/life-laws.json); [path diff](step0-proposed-fixture-paths.json) contains only city.society.items.*. Both keep health 100 and all other state unchanged.

The other eight v8 files need no change: new-game.json, life-new-game.json, life-demand-card.json, life-rebellion-last-week.json, and all four life-crime-*.json checkpoints are created before the first End Week (the crafted raid builds/staffs but does not advance time). Their old-byte round-trip/import assertions stay. All v7 and older fixtures stay untouched.

3. **Report items are not rendered until PR C.** Required TileTrialReport.items means the typed fake report constructors need the inert items field (P11–P12). The e2e parser at character-life-navigation.helpers.ts:219,281,379 reads visible UI and currently compares the complete expected base report. Copying expected.items into actual would fake coverage. Proposed P13–P16 explicitly type the parsed result as Omit<TileTrialReport,'items'> and exclude ONLY the newly added field from the expected visible projection; every prior UI field and exact matcher stays. New B1/B3 tests cover the complete items payload. This projection needs owner approval, since existing setup/projection edits are restricted. No UI item panel or item rendering moves into PR B.

4. **Existing zero-health checkpoint policy needs confirmation.** crime-fixtures.test.ts:52–59 starts at health 0 with no wound and pins health 0. Decision 8's literal weekly algorithm checks health <= 0 after subtraction; proposed P3–P4 keep health 0, preserve the non-week command behavior, and assert fallen/wounds at End Week. This does not add a new floor or revive the lord. Confirm this reading, or amend the health rule explicitly.

5. **Optional one-sentence UI correction, or explicit deferral to PR C.** CharacterLifeCharacters.svelte:${sourcePoints.uiSentence} says "NPC effects on output are not active yet." After B2 this is false. Proposed replacement: **"NPC post skills apply at End Week."** If the owner allows this one UI line in PR B, P20–P22 update its two e2e assertions/title only. Otherwise leave source and assertions untouched until PR C and record the temporary stale copy. Personality-trait summaries such as Frugal's "effect not active yet" stay correct and unchanged; P6-A activates skills and the four wearable Legendary traits, not those personality effects.

## Draw schedule behind the exact five-week/fixture proposals

[Independent reference script](step0-reference-items.mjs), [raw proposed results](step0-proposed-items-and-pins.json). Proposed conventional schedule: itemRandom(seed, resolvedWeek, find), first draw selects cumulative Common/Rare/Epic thresholds 2500/3500/4100 bps, a second draw selects from that rarity's catalog-ordered wearables; Market restock uses the next planning week's market stream. No material draws occur because all fixture NPCs are unposted. Goals stay false because authority is below 90, no rebellion was seen, research is incomplete and week is below 52.

For seed 20261028, the first five find rolls are 8618,5008,26,7245,8471: only week 3 hits, giving common-necklace id 1, nextItemId 2. The exact week-4 and week-6 Markets are in the raw results and proposed fixture files. The proposal asks the owner to accept this draw schedule along with the exact expected values. No product random helper or generator was run.

## Golden and assertions that stay unchanged

- catalog-golden.test.ts:9 keeps exact equality against the newly generated golden, and its >0 crime events / 60 crisis reports / 60 outside reports / existing 20-second timeouts stay. catalog-golden.json must be regenerated ONCE after authorized implementation, as already approved in Decision 9. Its exact final bytes are not fabricated in Step 0. A committed script/output against 5e9674e must prove only city.society.items.*, player.character.health and report items paths changed; any other path is a HOLD.
- New-game Market literals in core society.test.ts and world/session.test.ts pin week 1, so they stay. Item purchase tests use the stored offer price and no posted Market NPC, so they stay. Potion immediate-heal tests stay.
- Core manager-slot and UI Manager-option arrays for the starting city stay: no new Watch House/Barracks is built initially. world-npc.test.ts's stats/traits equality compares assignment itself, not End Week, so it stays. Replace/pause/unassign tests stay, with new B2 equipment-retention tests added separately.
- character-life-command.test.ts's live legacy-delegate comparisons (81,242–243) use no posts at End Week, an unequipped Player with skills below 50 and health 100. Keep them unchanged: base regen clamps at 100 and both paths produce the same item tick; context-free effect calculations stay unchanged. No expected report field is copied from the actual result to preserve parity.
- UI VisibleReport's field contract (character-life-observation.test.ts:42–58 and expected observation at 307 onward) remains a UI projection until PR C. Only its typed input report fixture gets P11. Other synthetic partial-report casts and exact crime/order/law text remain unchanged. In particular the wound damage text stays -20 for the stored fixture's medical 20 and no gear.
- Historical refusal tests, v8 record/serialization round trips, and e2e UI-vs-current-executor/state comparisons remain exact. The only health formula pin among those e2e tests is crime.spec.ts:18 (P5). Non-item society/economy equality in law-week.test.ts stays exact while its item literal is replaced by P17.

## Handoff

Await one owner response covering the required semantic/shape edits, the Drug Store validator + TRIAL_BUILDINGS pin exception and proposed definition, the two v8 fixture regenerations, the zero-health reading, and either the minimal sentence correction or its explicit deferral. No implementation may begin before that answer. No push, PR, merge, dependency install, server, new worktree or clone was performed. Ports 4173/4174 remain free. Owner approval will be recorded verbatim before B1 RED.
`;
fs.writeFileSync(path.join(root,'STEP0-HOLD.md'),report,'utf8');
const readme=`# P6-A PR B — Step 0 evidence\n\nStatus: **HOLD for owner decision**. Open [STEP0-HOLD.md](STEP0-HOLD.md) for the full audit and decisions, and [step0-proposed-edits.md](step0-proposed-edits.md) for every exact before → after.\n\nHEAD: ${base}\n\nTree: ${git(['rev-parse','HEAD^{tree}'])}\n\nBranch: feat/p6a-week-rules. Git status: empty. No RED/test/build, product/test edit, fixture regeneration or commit.\n\nOwner Tân: "Giao Builder B". The plan/spec have been read fully. ${index.length} test/support sources were scanned and their hashes checked again after proposal generation. All generated proposal files are outside the worktree.\n\nThis is preflight evidence, not B1–B4 completion evidence. Gate, smoke, bundle, RED/GREEN and final implementation inventory will be added after the Step 0 HOLD is released. Current executed edit inventory: zero files / zero hunks.\n\nAll text is UTF-8. SHA256SUMS.txt covers this package; the owner can review complete proposed test copies and two exact proposed fixture copies.\n`;
fs.writeFileSync(path.join(root,'README.md'),readme,'utf8');
let all=[];function collect(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,entry.name);if(entry.isDirectory())collect(file);else if(entry.name!=='SHA256SUMS.txt')all.push(file);}}
collect(root);
for(const file of all){const text=new TextDecoder('utf8',{fatal:true}).decode(fs.readFileSync(file));assert.ok(!text.includes('\ufffd'),`Damaged Unicode: ${file}`);}
fs.writeFileSync(path.join(root,'SHA256SUMS.txt'),all.sort().map(f=>`${hash(fs.readFileSync(f))}  ${path.relative(root,f).replaceAll('\\','/')}`).join('\n')+'\n','utf8');
console.log(`Step 0 HOLD ready: ${index.length} source files audited, ${proposals.length} exact proposals, ${copiesCount()} proposed test files, 2 proposed v8 fixtures. ${all.length} UTF-8 artifacts hashed. Git status empty.`);
function copiesCount(){return new Set(proposals.map(p=>p.file)).size;}
