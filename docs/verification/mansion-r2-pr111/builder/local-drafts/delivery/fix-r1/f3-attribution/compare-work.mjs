import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root=dirname(fileURLToPath(import.meta.url));
const read = file => JSON.parse(readFileSync(resolve(root,file),'utf8'));
const counts = {};
for (const d of ['normal','easy']) {
  const {base,head,differences,fixtureSha256} = read('cold-audit/'+d+'-work.json');
  assert.deepEqual(base.cloneCounts,head.cloneCounts);
  const cloneCalls = base.cloneCounts.reduce((sum,[,entry])=>sum+entry.calls,0);
  const cloneJsonBytes = base.cloneCounts.reduce((sum,[,entry])=>sum+entry.jsonBytes,0);
  assert.equal(cloneCalls,116);
  assert(differences.every(row => /inventory\.gold$|^next\.npcs\.\d+\.(?:life\.stress|character\.relationshipToPlayer\.affection)$|^report\.(?:order\.targets\.authority|after\.gold|householdUpkeep\.paidMilli|mansion)$/.test(row.path)));
  const coverage = side => read('cold-audit/'+d+'-'+side+'-coverage.json').flatMap(file =>
    file.functions.map(fn=>({...fn,path:file.path})));
  const paths = {base:coverage('base'),head:coverage('head')};
  const functionHit = (side,name,path) => {
    const matches = paths[side].filter(fn=>fn.name===name && (!path || fn.path.endsWith(path)));
    assert(matches.length<=1, name);
    return matches[0]?.ranges[0].count??0;
  };
  const branch = (side,name,text) => {
    const found = paths[side].find(fn=>fn.name===name).ranges.slice(1)
      .filter(row=>row.text.trimStart().startsWith(text));
    assert.equal(found.length,1, name+' / '+text);
    return found[0].count;
  };
  const common = Object.fromEntries([
    ['Character Life live validation','isLiveCharacterLifeSessionState',3],
    ['profile validation','hasCharacterLifeProfiles',3],
    ['world roster validation','isWorldNpcList',4],
    ['underlying roster validation','validNpcList',4],
    ['NPC life','runNpcLifeWeek',1],
    ['household','runHouseholdWeek',1],
    ['city crime resolve','resolveCrimeWeek',1],
    ['home robbery gate','runHomeRobberyCheck',1],
    ['birthday writes','recordNpcLifeEvent',2],
  ].map(([label,name,expected])=>{
    assert.deepEqual(['base','head'].map(side=>functionHit(side,name)),[expected,expected], name);
    return [label,expected];
  }));
  for(const side of ['base','head']){
    const work = side==='base'?base:head;
    assert.equal(branch(side,'validNpcList','if (!hasWeeklyKeys(npc'),400);
    assert.equal(branch(side,'runNpcLifeWeek','{\n        const life = npc.life'),100);
    assert.equal(branch(side,'runHouseholdWeek','{\n        const { household, character, life }'),100);
    assert.equal(branch(side,'runTileTrialWeek','stocks.gold -= due;'),3);
    assert.equal(branch(side,'runHomeRobberyCheck','const chanceBps ='),0);
    assert.equal(work.household.wagesPaidMilli,160000);
    assert.deepEqual([work.household.left.length,work.household.notices.length,work.household.unpaid.length],[0,0,0]);
    assert.deepEqual([work.npcLife.birthdays.length,work.npcLife.exhausted.length,work.npcLife.recovered.length],[2,0,0]);
    assert.deepEqual([work.cityCrime.event,work.crisis.cardOpened,work.purse.robbery??null],[null,null,null]);
    assert.equal(work.authority.after.authority,47);
  }
  assert.equal(branch('head','mansionTerms','{\n        const effects = roomLevels.get'),9);
  assert.equal(branch('head','mansionTerms','{\n        if (household.home !== MANSION_TILE_ID)'),100);
  assert.equal(branch('head','mansionTerms','const fitRoom = MANSION_CATALOG.roles'),25);
  assert.equal(branch('head','executeCharacterLifeCommand','? mansionTerms(next)'),0);
  assert.equal(branch('head','runMansionWeek',': terms.effectsByRoom.get'),30);
  assert.equal(branch('head','runMansionWeek','npc.life.stress = clamp'),5);
  assert.equal(branch('head','runMansionWeek','{\n                const relationship = npc.character'),5);
  assert.equal(branch('head','mansionUpkeepFunded','{\n        if (id === MANSION_TILE_ID)'),74);
  assert.equal(functionHit('head','prepareCrimeWeek'),1);
  assert.equal(branch('head','resolveCrimeWeek','?? prepareCrimeWeek'),0);
  counts[d] = {fixtureSha256, sharedFunctionCalls:common, cloneCalls, cloneJsonBytes,
    validatedNpcRows:400, npcLifeAndHouseholdRowsEach:100, paidHomes:3, birthdays:2,
    extra:{termsRooms:9,termsRosterRows:100,activeStaff:25,earlyFundingTileRows:74,
      mansionRoomLookups:30, bedroomStressWrites:5, bedroomAffectionWrites:5, closingTermsRebuilds:0},
    outputDifferences:differences};
}
writeFileSync(resolve(root,'work-comparison.json'),JSON.stringify(counts,null,2)+'\n','utf8');
console.log('Confirmed exact clone payload digests, common work counts and expected Mansion-specific work on both difficulties.');
