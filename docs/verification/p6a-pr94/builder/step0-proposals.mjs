import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));
const reference=JSON.parse(fs.readFileSync(path.join(root,'step0-proposed-items-and-pins.json'),'utf8'));
const proposals=[],copies=new Map();
function add(file,before,after,why,category='required'){
 const original=fs.readFileSync(file,'utf8').replaceAll('\r\n','\n');
 const offset=original.indexOf(before);if(offset<0)throw Error(`Anchor missing: ${file}: ${before.slice(0,90)}`);
 const line=original.slice(0,offset).split('\n').length;
 const current=copies.get(file)??original;
 if(!current.includes(before))throw Error(`Overlapping proposal: ${file}`);
 copies.set(file,current.replace(before,after));
 proposals.push({id:proposals.length+1,file,line,category,why,before,after});
}
const crime='packages/simulation/src/__tests__/crime-fixtures.test.ts';
add(crime,"it('floors wounded health at one and preserves a refused session',()=>{","it('a lethal wound sets wounds fall cause without regen and preserves a refused session',()=>{",'Decision 8 removes the health floor; the existing input has health 15 and takes damage 20.');
add(crime," expect(r.report!.crimeEvent!.lordHealthLoss).toBe(20);expect(r.next.player.character.health).toBe(1);expect(s).toEqual(before);",` expect(r.report!.crimeEvent!.lordHealthLoss).toBe(20);expect(r.next.player.character.health).toBe(0);expect(s).toEqual(before);
 expect(r.next.city.society!.crisis).toMatchObject({stage:'fallen',fallCause:'wounds'});
 expect(r.next.city.society!.pendingCard).toBeNull();
 expect(executeCharacterLifeCommand(r.next,{type:'NEXT_WEEK',expectedRevision:r.next.city.revision})).toMatchObject({success:false,error:{code:'CITY_FALLEN'}});`,'Exact death, no regeneration, pending-card removal and subsequent-command refusal replace the obsolete floor.');
add(crime,"it('preserves zero health through a non-week command and an unwounded End Week',()=>{","it('preserves zero health through a non-week command and falls at End Week',()=>{",'Decision 8 checks health <= 0 after the weekly subtraction, including a pre-existing zero. This edge needs an explicit owner ruling.','zero-health ruling');
add(crime,' expect(resolved.next.player.character.health).toBe(0);expect(s.player.character.health).toBe(0);',` expect(resolved.next.player.character.health).toBe(0);expect(s.player.character.health).toBe(0);
 expect(resolved.next.city.society!.crisis).toMatchObject({stage:'fallen',fallCause:'wounds'});
 expect(resolved.next.city.society!.pendingCard).toBeNull();`,'Keep both zero-health equalities; add the Decision 8 fall result, rather than reviving a zero-health checkpoint.','zero-health ruling');
const e2eCrime='tests/e2e/crime.spec.ts';
add(e2eCrime,'expect(result.next.player.character.health).toBe(Math.max(1,s.player.character.health-20));','expect(result.next.player.character.health).toBe(81);','Stored wound fixture starts at health 100, has no Hospital/gear, and receives 20 damage plus base regen 1. Wound-report damage text stays 20.');
const npc='packages/core/src/world/__tests__/npc.test.ts';
const oldPosts="['farm', 'processor', 'logging', 'mine', 'workshop', 'town-hall', 'town-market', 'quarry', 'sheep-pasture', 'herb-garden', 'weaver']";
add(npc,`expect([...NPC_MANAGER_BUILDING_TYPES]).toEqual(${oldPosts});`,`expect([...NPC_MANAGER_BUILDING_TYPES]).toEqual(${oldPosts.slice(0,-1)}, 'watch-house', 'military-barracks']);`,'Decision 11 appends exactly two manager post types; the matcher and existing entries stay.');
const map='packages/core/src/trial/__tests__/society-map.test.ts';
add(map,"it('pins all eighteen active town building names to the approved catalog', () => {","it('pins all nineteen active town building names to the approved catalog', () => {",'The buildable Drug Store requires a new town-terrain trial definition.');
add(map,"    'slave-quarters': 'Slave Quarters',","    'slave-quarters': 'Slave Quarters',\n    'drug-store': 'Drug Store',",'Preserve the exact active-building-name assertion and add the one new definition.');
add(map,"    'drug-store': { staff: null, reserved: true },\n",'', 'Decision 12 removes Drug Store from the reserved-only filtered object. Its staff remains null in the catalog.');
const observation='packages/simulation/src/__tests__/character-life-observation.test.ts';
const observationSource=fs.readFileSync(observation,'utf8').replaceAll('\r\n','\n');
const catalogueLine=observationSource.split('\n').find(line=>line.includes('expect(o.buildings.map(b => b.typeId)).toEqual(['));
add(observation,catalogueLine,catalogueLine.replace("'slave-quarters']);","'slave-quarters', 'drug-store']);"),'Append Drug Store to the exact projected catalog order; append its trial definition at the end. The following equality to Object.keys(TRIAL_BUILDINGS) remains intact.');
add(observation,'function reportFixture(): TileTrialReport {\n  return {',`function reportFixture(): TileTrialReport {
  return {
    items: { materials: [], found: null, expired: [], legendary: null, hospitalOperated: false, regen: 0 },`,'Required TileTrialReport.items needs an explicit inert synthetic report field. VisibleReport continues exposing its existing UI fields; no expected observation field is removed.','required report-shape addition');
const letters='packages/ui/src/__tests__/report-letters.test.ts';
add(letters,'function report(overrides: Partial<TileTrialReport> = {}): TileTrialReport {\n  return {',`function report(overrides: Partial<TileTrialReport> = {}): TileTrialReport {
  return {
    items: { materials: [], found: null, expired: [], legendary: null, hospitalOperated: false, regen: 0 },`,'The typed synthetic report helper needs the required items field; all existing letter assertions, overrides and values remain intact.','required report-shape addition');
const helper='tests/e2e/character-life-navigation.helpers.ts';
add(helper,'export async function expectReport(page: Page, expected: Readonly<TileTrialReport>): Promise<TileTrialReport> {',"export async function expectReport(page: Page, expected: Readonly<TileTrialReport>): Promise<Omit<TileTrialReport, 'items'>> {",'PR C renders item reports. This helper must explicitly describe the visible PR B UI projection, while preserving every existing visible-field assertion. Requires owner approval of the projection.','UI projection ruling');
add(helper,'  const actual: TileTrialReport = {',"  const actual: Omit<TileTrialReport, 'items'> = {",'Match the declared visible projection instead of inventing an items result from expected data.','UI projection ruling');
add(helper,'  const { society, luxuryImportedMilli, trainingGoldMilli, ...baseReport } = expected;','  const { items: _items, society, luxuryImportedMilli, trainingGoldMilli, ...baseReport } = expected;','Keep expect(actual).toEqual(baseReport) exactly; only the newly introduced, not-yet-rendered items field is excluded. New B1/B3 unit tests must assert items fully.','UI projection ruling');
const navigation='tests/e2e/character-life-navigation.spec.ts';
add(navigation,'  const {society: _society,luxuryImportedMilli: _luxury,trainingGoldMilli: _training,...expectedBase}=expected.report;','  const {items: _items,society: _society,luxuryImportedMilli: _luxury,trainingGoldMilli: _training,...expectedBase}=expected.report;','The caller repeats the same exact visible-report comparison at line 845. Keep its matcher and all previously observed fields.','UI projection ruling');
const laws='packages/simulation/src/__tests__/law-week.test.ts';
const lawSource=fs.readFileSync(laws,'utf8').replaceAll('\r\n','\n');
const start=lawSource.indexOf(' expect(society).toEqual({...oldSociety,items: {');
const end=lawSource.indexOf('\n expect(s.city.world.settlements)',start);
const beforeItems=lawSource.slice(start,end);
const afterItems=' expect(society).toEqual({...oldSociety,items: '+JSON.stringify(reference['life-5-weeks'].items,null,2)+'});';
add(laws,beforeItems,afterItems,'Decision 7 finds one common-necklace in week 3 and restocks the week-6 Market. Keep exact equality, all non-item oldSociety fields and the settlement equality. Proposed exact values depend on the documented draw schedule.');
const pins='packages/core/src/__tests__/catalog-data.test.ts';
add(pins,reference.drugStore.oldSocietyHash,reference.drugStore.proposedSocietyHash,'Decision 12 changes only society.drug-store.reserved to false.','approved Decision 9 pin update');
add(pins,reference.drugStore.oldTrialHash,reference.drugStore.proposedTrialHash,'A missing Drug Store trial definition must be added. This TRIAL_BUILDINGS pin change conflicts with the PR B brief and needs explicit authorization.','additional pin ruling');
// Optional minimal correction of a sentence that becomes false when post skills activate.
const boundary='tests/e2e/character-life-boundary.spec.ts';
add(boundary,"await expect(card.getByText('NPC effects on output are not active yet.', { exact: true })).toBeVisible();","await expect(card.getByText('NPC post skills apply at End Week.', { exact: true })).toBeVisible();",'Only if the owner moves one status sentence from PR C to PR B. Otherwise this assertion and its UI source remain untouched until PR C.','optional UI-copy ruling');
const worldNpc='tests/e2e/world-npc-session.spec.ts';
add(worldNpc,"await expect(characterWindow(page)).toContainText('NPC effects on output are not active yet.');","await expect(characterWindow(page)).toContainText('NPC post skills apply at End Week.');",'Same conditional sentence correction. NPC personality trait summaries remain inactive and their assertions stay unchanged.','optional UI-copy ruling');
add(worldNpc,"test('New Game lists 3 named starters, all unassigned, with stats, traits and disabled-effect labels',","test('New Game lists 3 named starters, all unassigned, with stats, traits and post-skill status',",'Update only the test title if the owner approves the one-sentence UI change.','optional UI-copy ruling');
fs.writeFileSync(path.join(root,'step0-proposed-edits.json'),JSON.stringify(proposals,null,2)+'\n','utf8');
let md='# Step 0 — exact proposed existing-test edits\n\nBase: 5e9674e31fb017f730dced4178514ebbfe1dbf24. PROPOSALS ONLY: no repository test or product file has been edited.\n\n';
for(const p of proposals)md+=`## P${p.id}: ${p.file}:${p.line}\n\nCategory: ${p.category}. ${p.why}\n\nBefore:\n\n\x60\x60\x60ts\n${p.before}\n\x60\x60\x60\n\nProposed after:\n\n\x60\x60\x60ts\n${p.after||'(delete this line; the filtered reserved object no longer includes Drug Store)'}\n\x60\x60\x60\n\n`;
for(const [file,text] of copies){const dest=path.join(root,'proposed-test-files',file);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,text,'utf8');}
md+=`Total: ${proposals.length} proposed edit blocks in ${copies.size} existing test/support files, including conditional options. All wait for the owner's answer.\n`;
fs.writeFileSync(path.join(root,'step0-proposed-edits.md'),md,'utf8');
console.log(`Prepared ${proposals.length} exact proposed blocks in ${copies.size} test/support files; repository files untouched.`);
