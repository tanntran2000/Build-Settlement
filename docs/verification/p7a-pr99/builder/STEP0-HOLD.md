# P7-A PR A — Step 0 preflight (owner HOLD)

Status: A0 research complete; HOLD before RED, existing-test edits, or product edits.
UTC: 2026-11-17T06:15:04.652706+00:00
Base / current HEAD: 753e4503673df86830fba2ef2c9ef1e64a843729
Tree: 77cbeae3332cfaf26ba23e08ae67300d49d8c69d
Branch: feat/p7a-npc-life-data
Owner authority: Tân, 2026-11-17: "Duyệt P7-A" and "Duyệt, giao Builder A".
The worktree was reused. git fetch origin exited 0. Before branch creation, git status --porcelain=v1 was empty and neither 4173 nor 4174 had a listener. No process was killed; no dependency was installed. No test, build, generator, or smoke has run in A0.

## Scope and method

Read all binding documents and repo AGENTS.md in UTF-8. Scanned 478 tracked paths (476 readable text files), including unit, e2e, tools, historical fixtures and docs. Used rg first for literals and git ls-files for the complete tracked-file pass. Full matched lines are in step0-search-matches.json; exact proposed line edits are in step0-proposed-edits.json.
No .codegraph directory exists in this worktree. The codebase-memory list_projects/index_status/search_graph tools were tried; this path is not indexed. Other indexed worktrees are not evidence for this head. Direct source reads and the complete tracked-path scan are the fallback; no index was created.
The executing-plans task-by-task approach applies after this mandatory A0 HOLD. The explicit instruction to use no subagents takes precedence over its reviewer delegation guidance. Claude remains Tester/Orchestrator; Astra reviews separately.

## Decisions required in this one HOLD

1. Approve the exact existing-test line edits below and the listed new test paths. This includes current-fixture consumers in simulation, UI unit tests and e2e under the plan's 'edits approved at Step 0' provision. No UI product file changes are proposed.
2. Clarify the historical NPC record scope: binding-plan-2761d05.md:65 restricts session-records.ts to 'v9 historical only', but strict WorldNpc.life makes its line 169 reject ALL v1–v9 NPC rows. Existing session-records.test.ts:12,19 and society-v8-fixture.test.ts:15–18 require exact historical reconstruction and refusal. Recommended: explicitly allow preserving the prior three-key historical NPC validator in session-records.ts for rulesets 01–09, while current v10 always requires life. No life insertion, migration, mutation, missing-life tolerance on v10, or assertion removal. The concrete proposed validator and branch replacement follow below.
3. Clarify golden/envelope scope: binding-plan-2761d05.md:48,100 require only city.society.rulesetId / npcs.*.life.* in the state diff, but serializeCharacterLifeSave at character-life-save.ts:18 also writes outer cityRulesetId. Recommended: keep the strict state whitelist and separately assert that the envelope differs ONLY by cityRulesetId: 'tile-society-09' → 'tile-society-10' (tile fixture outer rulesetId likewise). This mirrors the existing p6b-crafting-path-diff.ts:21–26; it does not permit other state paths.
4. Approve the A1 persistence test filename (new core/persistence tests are globally allowed but binding-plan-2761d05.md:92 only names npc-life.test.ts and catalog-data.test.ts), and settle the A1/A2 GREEN staging conflict described below (plan :95 vs :98–101). Recommended: A1 GREEN covers its full acceptance suite and directly affected current-factory checks; historical/current-fixture integration GREEN is A2 after ruleset 10 and new fixtures. Approve the necessary seeded life initialization in createNpcWorldSession (npc.ts:75–76), in addition to the named WorldNpc/isWorldNpcList changes. These remain in the named product files.

## Full existing-test / literal / pin edit list

50 exact line replacements/additions across 37 existing files; 34 are existing test files. Numbers are source lines at the base commit. Multi-line replacements are shown in full. There are no wildcard or blanket test rewrites.
### E01 — packages/core/src/__tests__/catalog-data.test.ts:8 (A1)

Import the three new explicitly pinned catalog views.

Before:
```ts
} from '../index.js';
```
After:
```ts
  NPC_ORIGINS, NPC_HOBBIES, P7A_TRIAL,
} from '../index.js';
```

### E02 — packages/core/src/__tests__/catalog-data.test.ts:21 (A1)

Add a case to all existing validation, exact error, missing-root and deep-freeze checks; retain every existing case.

Before:
```ts
] as const;
```
After:
```ts
  { file: 'npc-life.json', validator: 'validateNpcLife', view: () => ({ origins: NPC_ORIGINS, hobbies: NPC_HOBBIES, P7A_TRIAL }),
    path: ['origins', 'frontier', 'name'], wrong: 7, message: 'npc-life.json#frontier.name: expected nonempty string' },
] as const;
```

### E03 — packages/core/src/__tests__/catalog-data.test.ts:86 (A2)

The sole existing hash change is the ruleset string 09 → 10, calculated without importing or editing product code.

Before:
```ts
  { name: 'SOCIETY_TRIAL', value: SOCIETY_TRIAL, hash: '49add1753fd6d630e3cf7f4f7395f2bd7b844936086ef0b9f06fb6cb595090e6' },
```
After:
```ts
  { name: 'SOCIETY_TRIAL', value: SOCIETY_TRIAL, hash: '69779e596f2abca5afe88b5858be9d850a6a062dd772ea093bbfebf3ec983acc' },
```

### E04 — packages/core/src/__tests__/catalog-data.test.ts:111 (A1)

Add the three new canonical hashes in a separate P7-A pin test; all other pins stay byte-for-byte the same.

Before:
```ts
});
```
After:
```ts
});
it.each([
  { name: 'NPC_ORIGINS', value: NPC_ORIGINS, hash: 'c252b2c5d31d302c307df967c94b43714f4e3debd527299819f60117f0378f09' },
  { name: 'NPC_HOBBIES', value: NPC_HOBBIES, hash: '8a4c0e75fca9aa9b8fd5e26a5bfac38aa161864e02b97832c77955089d7205c2' },
  { name: 'P7A_TRIAL', value: P7A_TRIAL, hash: 'b1429bf557d9a96e825a2d9a6d788524ee1e57db1572d35a6c405f2924797013' },
])('$name keeps the P7-A canonical JSON hash', ({ value, hash }) => {
  expect(catalogHash(value)).toBe(hash);
});
```

### E05 — packages/core/src/data/tuning.json:181 (A2)

Current ruleset assertion/envelope follows Decision 4; all other expectations stay exact.

Before:
```json
    "rulesetId": "tile-society-09",
```
After:
```json
    "rulesetId": "tile-society-10",
```

### E06 — packages/core/src/data/validate.ts:308 (A2)

Current ruleset assertion/envelope follows Decision 4; all other expectations stay exact.

Before:
```ts
    readonly rulesetId: "tile-society-09";
```
After:
```ts
    readonly rulesetId: "tile-society-10";
```

### E07 — packages/core/src/data/validate.ts:628 (A2)

Current ruleset assertion/envelope follows Decision 4; all other expectations stay exact.

Before:
```ts
        "rulesetId": literal("tile-society-09"), "standing": nonnegative, "laws": object({
```
After:
```ts
        "rulesetId": literal("tile-society-10"), "standing": nonnegative, "laws": object({
```

### E08 — packages/core/src/trial/__tests__/crime.test.ts:7 (A2)

Current ruleset assertion/envelope follows Decision 4; all other expectations stay exact.

Before:
```ts
it('starts v6 with neutral standing and no fall cause',()=>{expect(createSocietyState().society).toMatchObject({rulesetId:'tile-society-09',standing:50,crisis:{fallCause:null}});});
```
After:
```ts
it('starts v6 with neutral standing and no fall cause',()=>{expect(createSocietyState().society).toMatchObject({rulesetId:'tile-society-10',standing:50,crisis:{fallCause:null}});});
```

### E09 — packages/core/src/trial/__tests__/crisis.test.ts:6 (A2)

Current ruleset assertion/envelope follows Decision 4; all other expectations stay exact.

Before:
```ts
 expect(s.rulesetId).toBe('tile-society-09');
```
After:
```ts
 expect(s.rulesetId).toBe('tile-society-10');
```

### E10 — packages/core/src/trial/__tests__/items.test.ts:8 (A2)

Current ruleset assertion/envelope follows Decision 4; all other expectations stay exact.

Before:
```ts
 expect(createSocietyState().society!.rulesetId).toBe('tile-society-09');
```
After:
```ts
 expect(createSocietyState().society!.rulesetId).toBe('tile-society-10');
```

### E11 — packages/core/src/trial/__tests__/law.test.ts:12 (A2)

Current ruleset assertion/envelope follows Decision 4; all other expectations stay exact.

Before:
```ts
  expect(society.rulesetId).toBe('tile-society-09');
```
After:
```ts
  expect(society.rulesetId).toBe('tile-society-10');
```

### E12 — packages/core/src/trial/__tests__/order.test.ts:33 (A2)

Current ruleset assertion/envelope follows Decision 4; all other expectations stay exact.

Before:
```ts
 expect(s.society!.rulesetId).toBe('tile-society-09');
```
After:
```ts
 expect(s.society!.rulesetId).toBe('tile-society-10');
```

### E13 — packages/core/src/trial/__tests__/outside.test.ts:21 (A2)

Current ruleset assertion/envelope follows Decision 4; all other expectations stay exact.

Before:
```ts
 expect(s.rulesetId).toBe('tile-society-09');
```
After:
```ts
 expect(s.rulesetId).toBe('tile-society-10');
```

### E14 — packages/core/src/trial/__tests__/society.test.ts:8 (A2)

Current ruleset assertion/envelope follows Decision 4; all other expectations stay exact.

Before:
```ts
    rulesetId: 'tile-society-09', standing:50,
```
After:
```ts
    rulesetId: 'tile-society-10', standing:50,
```

### E15 — packages/core/src/trial/society.ts:14 (A2)

Current ruleset assertion/envelope follows Decision 4; all other expectations stay exact.

Before:
```ts
export const SOCIETY_RULESET = 'tile-society-09';
```
After:
```ts
export const SOCIETY_RULESET = 'tile-society-10';
```

### E16 — packages/core/src/world/__tests__/npc.test.ts:62 (A1)

New life is seed-dependent. Preserve exact cross-seed equality for every pre-P7 field; new life determinism/ranges are asserted separately in the new npc-life.test.ts. Lines 10 and 38 stay unchanged, including the full seed-0 template equality.

Before:
```ts
    expect(unnamed(a.npcs)).toEqual(unnamed(b.npcs));
```
After:
```ts
    expect(a.npcs.map(({ character, traits, postTileId }) => ({ character: { ...character, name: '' }, traits, postTileId })))
      .toEqual(b.npcs.map(({ character, traits, postTileId }) => ({ character: { ...character, name: '' }, traits, postTileId })));
```

### E17 — packages/core/src/world/__tests__/session.test.ts:32 (A2)

Current ruleset assertion/envelope follows Decision 4; all other expectations stay exact.

Before:
```ts
  ] } } }); expect(WORLD_SESSION_CITY_RULESET).toBe('tile-society-09');
```
After:
```ts
  ] } } }); expect(WORLD_SESSION_CITY_RULESET).toBe('tile-society-10');
```

### E18 — packages/persistence/src/__tests__/character-life-save.test.ts:18 (A2)

Current ruleset assertion/envelope follows Decision 4; all other expectations stay exact.

Before:
```ts
  expect(JSON.parse(text)).toMatchObject({ format: CHARACTER_LIFE_SAVE_FORMAT, schemaVersion: 1, cityRulesetId: 'tile-society-09' });
```
After:
```ts
  expect(JSON.parse(text)).toMatchObject({ format: CHARACTER_LIFE_SAVE_FORMAT, schemaVersion: 1, cityRulesetId: 'tile-society-10' });
```

### E19 — packages/persistence/src/__tests__/character-life-save.test.ts:91 (A2)

Current ruleset assertion/envelope follows Decision 4; all other expectations stay exact.

Before:
```ts
 expect(value.cityRulesetId).toBe('tile-society-09');
```
After:
```ts
 expect(value.cityRulesetId).toBe('tile-society-10');
```

### E20 — packages/persistence/src/__tests__/item-records.test.ts:32 (A2)

Current ruleset assertion/envelope follows Decision 4; all other expectations stay exact.

Before:
```ts
it('loads every new v9 Character Life fixture as current and round-trips exact bytes',()=>{
```
After:
```ts
it('loads every new v10 Character Life fixture as current and round-trips exact bytes',()=>{
```

### E21 — packages/persistence/src/__tests__/item-records.test.ts:33 (A2)

This test loads or writes the current playable fixture; point at the new v10 copy and preserve all assertions.

Before:
```ts
 const root=new URL('./fixtures/society-v9/',import.meta.url),files=readdirSync(root).filter(f=>f.startsWith('life-'));
```
After:
```ts
 const root=new URL('./fixtures/society-v10/',import.meta.url),files=readdirSync(root).filter(f=>f.startsWith('life-'));
```

### E22 — packages/persistence/src/__tests__/items-rebuild-order.test.ts:58 (A2)

Current ruleset assertion/envelope follows Decision 4; all other expectations stay exact.

Before:
```ts
  const checkpoint = JSON.stringify({ format: 'haven.character-life-session.save', schemaVersion: 1, cityRulesetId: 'tile-society-09', state: s });
```
After:
```ts
  const checkpoint = JSON.stringify({ format: 'haven.character-life-session.save', schemaVersion: 1, cityRulesetId: 'tile-society-10', state: s });
```

### E23 — packages/persistence/src/__tests__/session-records.test.ts:14 (A2)

Only v10 is current; v9 joins the unchanged historical refusal branch.

Before:
```ts
      if (version === 'society-v9') {
```
After:
```ts
      if (version === 'society-v10') {
```

### E24 — packages/persistence/src/__tests__/society-new-game-fixture.test.ts:8 (A2)

This test loads or writes the current playable fixture; point at the new v10 copy and preserve all assertions.

Before:
```ts
 if(process.env.GENERATE_SOCIETY_FIXTURES==='1')writeFileSync(new URL('./fixtures/society-v9/new-game.json',import.meta.url),JSON.stringify({format:'haven.tile-trial.save',schemaVersion:1,rulesetId:'tile-society-09',state}),'utf8');
```
After:
```ts
 if(process.env.GENERATE_SOCIETY_FIXTURES==='1')writeFileSync(new URL('./fixtures/society-v10/new-game.json',import.meta.url),JSON.stringify({format:'haven.tile-trial.save',schemaVersion:1,rulesetId:'tile-society-10',state}),'utf8');
```

### E25 — packages/persistence/src/__tests__/society-new-game-fixture.test.ts:9 (A2)

This test loads or writes the current playable fixture; point at the new v10 copy and preserve all assertions.

Before:
```ts
 const bytes = readFileSync(new URL('./fixtures/society-v9/new-game.json', import.meta.url), 'utf8');
```
After:
```ts
 const bytes = readFileSync(new URL('./fixtures/society-v10/new-game.json', import.meta.url), 'utf8');
```

### E26 — packages/persistence/src/__tests__/society-new-game-fixture.test.ts:12 (A2)

Current ruleset assertion/envelope follows Decision 4; all other expectations stay exact.

Before:
```ts
 const encoded = ({ success: true, text: JSON.stringify({ format: 'haven.tile-trial.save', schemaVersion: 1, rulesetId: 'tile-society-09', state }) });
```
After:
```ts
 const encoded = ({ success: true, text: JSON.stringify({ format: 'haven.tile-trial.save', schemaVersion: 1, rulesetId: 'tile-society-10', state }) });
```

### E27 — packages/persistence/src/__tests__/society-new-game-fixture.test.ts:25 (A2)

This test loads or writes the current playable fixture; point at the new v10 copy and preserve all assertions.

Before:
```ts
 if(process.env.GENERATE_SOCIETY_FIXTURES==='1')writeFileSync(new URL('./fixtures/society-v9/life-new-game.json',import.meta.url),encoded.text,'utf8');
```
After:
```ts
 if(process.env.GENERATE_SOCIETY_FIXTURES==='1')writeFileSync(new URL('./fixtures/society-v10/life-new-game.json',import.meta.url),encoded.text,'utf8');
```

### E28 — packages/persistence/src/__tests__/society-new-game-fixture.test.ts:26 (A2)

This test loads or writes the current playable fixture; point at the new v10 copy and preserve all assertions.

Before:
```ts
 const bytes = readFileSync(new URL('./fixtures/society-v9/life-new-game.json', import.meta.url), 'utf8');
```
After:
```ts
 const bytes = readFileSync(new URL('./fixtures/society-v10/life-new-game.json', import.meta.url), 'utf8');
```

### E29 — packages/persistence/src/__tests__/society-new-game-fixture.test.ts:31 (A2)

This test loads or writes the current playable fixture; point at the new v10 copy and preserve all assertions.

Before:
```ts
 const bytes=readFileSync(new URL('./fixtures/society-v9/life-new-game.json',import.meta.url),'utf8');
```
After:
```ts
 const bytes=readFileSync(new URL('./fixtures/society-v10/life-new-game.json',import.meta.url),'utf8');
```

### E30 — packages/persistence/src/__tests__/society-new-game-fixture.test.ts:38 (A2)

This test loads or writes the current playable fixture; point at the new v10 copy and preserve all assertions.

Before:
```ts
 const bytes = readFileSync(new URL('./fixtures/society-v9/life-new-game.json',import.meta.url),'utf8');
```
After:
```ts
 const bytes = readFileSync(new URL('./fixtures/society-v10/life-new-game.json',import.meta.url),'utf8');
```

### E31 — packages/simulation/src/__tests__/crime-fixtures.test.ts:9 (A2)

This test loads or writes the current playable fixture; point at the new v10 copy and preserve all assertions.

Before:
```ts
const url=(name:Name)=>new URL(`../../../persistence/src/__tests__/fixtures/society-v9/life-crime-${name}.json`,import.meta.url);
```
After:
```ts
const url=(name:Name)=>new URL(`../../../persistence/src/__tests__/fixtures/society-v10/life-crime-${name}.json`,import.meta.url);
```

### E32 — packages/simulation/src/__tests__/crisis-fixtures.test.ts:7 (A2)

This test loads or writes the current playable fixture; point at the new v10 copy and preserve all assertions.

Before:
```ts
 const url=new URL(`../../../persistence/src/__tests__/fixtures/society-v9/${name}.json`,import.meta.url);
```
After:
```ts
 const url=new URL(`../../../persistence/src/__tests__/fixtures/society-v10/${name}.json`,import.meta.url);
```

### E33 — packages/simulation/src/__tests__/law-fixture.test.ts:27 (A2)

This test loads or writes the current playable fixture; point at the new v10 copy and preserve all assertions.

Before:
```ts
const url=new URL('../../../persistence/src/__tests__/fixtures/society-v9/life-laws.json',import.meta.url);
```
After:
```ts
const url=new URL('../../../persistence/src/__tests__/fixtures/society-v10/life-laws.json',import.meta.url);
```

### E34 — packages/simulation/src/__tests__/law-week.test.ts:80 (A2)

This test loads or writes the current playable fixture; point at the new v10 copy and preserve all assertions.

Before:
```ts
 const bytes=readFileSync(new URL('../../../persistence/src/__tests__/fixtures/society-v9/life-new-game.json',import.meta.url),'utf8');
```
After:
```ts
 const bytes=readFileSync(new URL('../../../persistence/src/__tests__/fixtures/society-v10/life-new-game.json',import.meta.url),'utf8');
```

### E35 — packages/simulation/src/__tests__/lord-health.test.ts:26 (A2)

This test loads or writes the current playable fixture; point at the new v10 copy and preserve all assertions.

Before:
```ts
  const r = deserializeCharacterLifeSave(readFileSync(new URL('../../../persistence/src/__tests__/fixtures/society-v9/life-crime-wound.json',import.meta.url),'utf8'));
```
After:
```ts
  const r = deserializeCharacterLifeSave(readFileSync(new URL('../../../persistence/src/__tests__/fixtures/society-v10/life-crime-wound.json',import.meta.url),'utf8'));
```

### E36 — packages/simulation/src/__tests__/smithy-data.test.ts:22 (A2)

Current ruleset assertion/envelope follows Decision 4; all other expectations stay exact.

Before:
```ts
  expect(createSocietyState().society!.rulesetId).toBe('tile-society-09');
```
After:
```ts
  expect(createSocietyState().society!.rulesetId).toBe('tile-society-10');
```

### E37 — packages/ui/src/__tests__/character-life-session.test.ts:13 (A2)

This test loads or writes the current playable fixture; point at the new v10 copy and preserve all assertions.

Before:
```ts
  const decoded=deserializeCharacterLifeSave(readFileSync('packages/persistence/src/__tests__/fixtures/society-v9/life-new-game.json','utf8'));
```
After:
```ts
  const decoded=deserializeCharacterLifeSave(readFileSync('packages/persistence/src/__tests__/fixtures/society-v10/life-new-game.json','utf8'));
```

### E38 — packages/ui/src/__tests__/world-session.test.ts:95 (A2)

Current ruleset assertion/envelope follows Decision 4; all other expectations stay exact.

Before:
```ts
  const text = () => JSON.stringify({ format: 'haven.world-session.save', schemaVersion: 1, cityRulesetId: 'tile-society-09', state: loaded });
```
After:
```ts
  const text = () => JSON.stringify({ format: 'haven.world-session.save', schemaVersion: 1, cityRulesetId: 'tile-society-10', state: loaded });
```

### E39 — tests/e2e/crime.spec.ts:9 (A2)

This test loads or writes the current playable fixture; point at the new v10 copy and preserve all assertions.

Before:
```ts
async function fixture(name:string){const r=deserializeCharacterLifeSave(await readFile(new URL(`../../packages/persistence/src/__tests__/fixtures/society-v9/life-${name}.json`,import.meta.url),'utf8'));if(!r.success)throw Error(r.error.message);return r.state;}
```
After:
```ts
async function fixture(name:string){const r=deserializeCharacterLifeSave(await readFile(new URL(`../../packages/persistence/src/__tests__/fixtures/society-v10/life-${name}.json`,import.meta.url),'utf8'));if(!r.success)throw Error(r.error.message);return r.state;}
```

### E40 — tests/e2e/crisis.spec.ts:9 (A2)

This test loads or writes the current playable fixture; point at the new v10 copy and preserve all assertions.

Before:
```ts
async function fixture(name:string){const r=deserializeCharacterLifeSave(await readFile(new URL(`../../packages/persistence/src/__tests__/fixtures/society-v9/${name}.json`,import.meta.url),'utf8'));if(!r.success)throw Error(r.error.message);return r.state;}
```
After:
```ts
async function fixture(name:string){const r=deserializeCharacterLifeSave(await readFile(new URL(`../../packages/persistence/src/__tests__/fixtures/society-v10/${name}.json`,import.meta.url),'utf8'));if(!r.success)throw Error(r.error.message);return r.state;}
```

### E41 — tests/e2e/garrison.spec.ts:22 (A2)

This test loads or writes the current playable fixture; point at the new v10 copy and preserve all assertions.

Before:
```ts
 const loaded=deserializeCharacterLifeSave(await readFile(new URL('../../packages/persistence/src/__tests__/fixtures/society-v9/life-crime-raid.json',import.meta.url),'utf8'));if(!loaded.success)throw Error(loaded.error.message);const s=loaded.state;
```
After:
```ts
 const loaded=deserializeCharacterLifeSave(await readFile(new URL('../../packages/persistence/src/__tests__/fixtures/society-v10/life-crime-raid.json',import.meta.url),'utf8'));if(!loaded.success)throw Error(loaded.error.message);const s=loaded.state;
```

### E42 — tests/e2e/items.spec.ts:133 (A2)

This test loads or writes the current playable fixture; point at the new v10 copy and preserve all assertions.

Before:
```ts
  const decoded=deserializeCharacterLifeSave(await readFile('packages/persistence/src/__tests__/fixtures/society-v9/life-crime-wound.json','utf8'));if(!decoded.success)throw Error('wound fixture');decoded.state.player.character.health=20;
```
After:
```ts
  const decoded=deserializeCharacterLifeSave(await readFile('packages/persistence/src/__tests__/fixtures/society-v10/life-crime-wound.json','utf8'));if(!decoded.success)throw Error('wound fixture');decoded.state.player.character.health=20;
```

### E43 — tests/e2e/laws.spec.ts:24 (A2)

This test loads or writes the current playable fixture; point at the new v10 copy and preserve all assertions.

Before:
```ts
 const decoded=deserializeCharacterLifeSave(await readFile(new URL('../../packages/persistence/src/__tests__/fixtures/society-v9/life-laws.json',import.meta.url),'utf8'));if(!decoded.success)throw Error(decoded.error.message);let state=decoded.state;
```
After:
```ts
 const decoded=deserializeCharacterLifeSave(await readFile(new URL('../../packages/persistence/src/__tests__/fixtures/society-v10/life-laws.json',import.meta.url),'utf8'));if(!decoded.success)throw Error(decoded.error.message);let state=decoded.state;
```

### E44 — tests/e2e/ledger.spec.ts:11 (A2)

This test loads or writes the current playable fixture; point at the new v10 copy and preserve all assertions.

Before:
```ts
  const result = deserializeCharacterLifeSave(await readFile(new URL(`../../packages/persistence/src/__tests__/fixtures/society-v9/${name}.json`, import.meta.url), 'utf8'));
```
After:
```ts
  const result = deserializeCharacterLifeSave(await readFile(new URL(`../../packages/persistence/src/__tests__/fixtures/society-v10/${name}.json`, import.meta.url), 'utf8'));
```

### E45 — tests/e2e/society.spec.ts:17 (A2)

Current ruleset assertion/envelope follows Decision 4; all other expectations stay exact.

Before:
```ts
  const saved=await exportLife(page);expect(saved.city.society!.rulesetId).toBe('tile-society-09');
```
After:
```ts
  const saved=await exportLife(page);expect(saved.city.society!.rulesetId).toBe('tile-society-10');
```

### E46 — tests/e2e/storage.spec.ts:14 (A2)

This test loads or writes the current playable fixture; point at the new v10 copy and preserve all assertions.

Before:
```ts
async function fallenFixture(){const r=deserializeCharacterLifeSave(await readFile(new URL('../../packages/persistence/src/__tests__/fixtures/society-v9/life-rebellion-last-week.json',import.meta.url),'utf8'));if(!r.success)throw Error(r.error.message);return r.state;}
```
After:
```ts
async function fallenFixture(){const r=deserializeCharacterLifeSave(await readFile(new URL('../../packages/persistence/src/__tests__/fixtures/society-v10/life-rebellion-last-week.json',import.meta.url),'utf8'));if(!r.success)throw Error(r.error.message);return r.state;}
```

### E47 — tests/e2e/tile-save.spec.ts:12 (A2)

Current ruleset assertion/envelope follows Decision 4; all other expectations stay exact.

Before:
```ts
 const text=await encoded(page),saved=JSON.parse(text);expect(saved).toMatchObject({format:'haven.character-life-session.save',schemaVersion:1,cityRulesetId:'tile-society-09',state:{city:{phase:'planning',world:{week:3}}}});
```
After:
```ts
 const text=await encoded(page),saved=JSON.parse(text);expect(saved).toMatchObject({format:'haven.character-life-session.save',schemaVersion:1,cityRulesetId:'tile-society-10',state:{city:{phase:'planning',world:{week:3}}}});
```

### E48 — tests/e2e/title.spec.ts:149 (A2)

This test loads or writes the current playable fixture; point at the new v10 copy and preserve all assertions.

Before:
```ts
  const parsed = deserializeCharacterLifeSave(await readFile(new URL('../../packages/persistence/src/__tests__/fixtures/society-v9/life-laws.json', import.meta.url), 'utf8'));
```
After:
```ts
  const parsed = deserializeCharacterLifeSave(await readFile(new URL('../../packages/persistence/src/__tests__/fixtures/society-v10/life-laws.json', import.meta.url), 'utf8'));
```

### E49 — tests/e2e/title.spec.ts:185 (A2)

This test loads or writes the current playable fixture; point at the new v10 copy and preserve all assertions.

Before:
```ts
  const parsed = deserializeCharacterLifeSave(await readFile(new URL('../../packages/persistence/src/__tests__/fixtures/society-v9/life-rebellion-last-week.json', import.meta.url), 'utf8'));
```
After:
```ts
  const parsed = deserializeCharacterLifeSave(await readFile(new URL('../../packages/persistence/src/__tests__/fixtures/society-v10/life-rebellion-last-week.json', import.meta.url), 'utf8'));
```

### E50 — tests/e2e/world-session.spec.ts:23 (A2)

Current ruleset assertion/envelope follows Decision 4; all other expectations stay exact.

Before:
```ts
 await page.addInitScript(()=>{Object.defineProperty(crypto,'getRandomValues',{value:(array:Uint32Array)=>{const draw=Number(sessionStorage.getItem('test-world-seed-draw')??'0');sessionStorage.setItem('test-world-seed-draw',String(draw+1));array[0]=draw===0?0:4294967295;return array;}});});await fresh(page);const region=page.getByRole('region',{name:'Outside world',exact:true});const disclosure=region.locator('summary');await disclosure.click();const summary=await region.innerText(),a=await exportLife(page);expect(summary).toContain('90');expect(summary).toContain('80');expect(summary).toContain('Exploration is not available yet.');expect(a.city.society!.rulesetId).toBe('tile-society-09');expect(a.city.goodsStock!.amountMilli).toBe(10000);expect(a.outside.tiles.filter(t=>t.owner!==null)).toHaveLength(10);await go(page,'city');const metadata=await region.evaluate(root=>[root,...root.querySelectorAll('*')].flatMap(el=>[...el.attributes].filter(a=>a.name.startsWith('data-')||a.name.startsWith('aria-')||a.name==='title').map(a=>a.value)));expect(metadata.join(' ')).not.toMatch(/o\d{2}|seed|loot|deposit|wheat|wood|iron/i);expect(metadata).not.toContain(String(a.outside.seed));expect(summary).not.toMatch(/o\d{2}|seed|loot|deposit|wheat|wood|iron/i);await page.reload();await fresh(page);await page.getByRole('region',{name:'Outside world',exact:true}).locator('summary').click();expect(await region.innerText()).toBe(summary);const b=await exportLife(page);expect(b.outside.seed).not.toBe(a.outside.seed);
```
After:
```ts
 await page.addInitScript(()=>{Object.defineProperty(crypto,'getRandomValues',{value:(array:Uint32Array)=>{const draw=Number(sessionStorage.getItem('test-world-seed-draw')??'0');sessionStorage.setItem('test-world-seed-draw',String(draw+1));array[0]=draw===0?0:4294967295;return array;}});});await fresh(page);const region=page.getByRole('region',{name:'Outside world',exact:true});const disclosure=region.locator('summary');await disclosure.click();const summary=await region.innerText(),a=await exportLife(page);expect(summary).toContain('90');expect(summary).toContain('80');expect(summary).toContain('Exploration is not available yet.');expect(a.city.society!.rulesetId).toBe('tile-society-10');expect(a.city.goodsStock!.amountMilli).toBe(10000);expect(a.outside.tiles.filter(t=>t.owner!==null)).toHaveLength(10);await go(page,'city');const metadata=await region.evaluate(root=>[root,...root.querySelectorAll('*')].flatMap(el=>[...el.attributes].filter(a=>a.name.startsWith('data-')||a.name.startsWith('aria-')||a.name==='title').map(a=>a.value)));expect(metadata.join(' ')).not.toMatch(/o\d{2}|seed|loot|deposit|wheat|wood|iron/i);expect(metadata).not.toContain(String(a.outside.seed));expect(summary).not.toMatch(/o\d{2}|seed|loot|deposit|wheat|wood|iron/i);await page.reload();await fresh(page);await page.getByRole('region',{name:'Outside world',exact:true}).locator('summary').click();expect(await region.innerText()).toBe(summary);const b=await exportLife(page);expect(b.outside.seed).not.toBe(a.outside.seed);
```

## WorldNpc keys, starter literals, and existing checks

- npc.ts:13: `export interface WorldNpc { character: NamedCharacter; traits: string[]; postTileId: string | null }` → `export interface WorldNpc { character: NamedCharacter; traits: string[]; postTileId: string | null; life: NpcLife }` (life last).
- npc.ts:50: `if (!hasWeeklyKeys(npc, ['character', 'traits', 'postTileId'])) return false;` → `if (!hasWeeklyKeys(npc, ['character', 'traits', 'postTileId', 'life']) || !isNpcLife(npc.life)) return false;`. Current NPCs must be female adults; the generic shared NamedCharacter validator stays generic. Validate derived age at the single city world week; preserve character.health unchanged.
- npc-content.ts:27,29,31: append respectively `life: createNpcLife(0, 'npc_starter_1', 27)`, `life: createNpcLife(0, 'npc_starter_2', 31)`, `life: createNpcLife(0, 'npc_starter_3', 24)` after `postTileId: null`. Template ages, names, health, skills, traits and ordering remain exact.
- npc.ts:76: retain the exact existing name-draw order/stream, then initialize each `npc.life = createNpcLife(base.value.outside.seed, npc.character.id, npc.character.age);` using the independent NPC life stream. No draws added to the name/outside/item streams.
- npc.test.ts:10,38 stay unchanged (full template comparison at seed 0). The cross-seed assertion at :62 changes only as E-listed; every old field remains exactly compared. New tests cover life on all three starters, same seed/id determinism, seed/id variation, deep isolation and ages 27/31/24 at week 1.
- character/__tests__/validate.test.ts:308–314 already validates lists made by the factory; no literal edit needed. :264 tests changed character.age boundary values; do not add an unrequested character.age === derived-age invariant. Existing shared-character and UI age fixtures stay unchanged.
- character/__tests__/session.test.ts:132–133,139–160,193–199; character/__tests__/describe.test.ts:8,19; world-npc-session.spec.ts:7,34 and historical inline NPC snapshots in character-life.spec.ts:297 / ui character-life-session.test.ts:62 stay unchanged. Profile fixtures are CharacterProfile/NamedCharacter, not a raw WorldNpc missing life. Historical checkpoint strings remain original bytes and continue to be refused.
- No tracked .snap files were found. Observation key tests (character-life-observation.test.ts:65,81) describe the existing observation DTO, not WorldNpc, and stay unchanged. UI NPC sheet/weekly/report expansion belongs to PR B/C.

## Historical NPC record preservation — concrete scope amendment proposal

The following is proposed text only, not applied. It preserves the exact old list checks in the persistence module. A2 changes the existing historical city regex at session-records.ts:18 from `/^tile-society-0([1-8])$/` to `/^tile-society-0([1-9])$/`. That regex must not be the only compatibility edit.
In A2 at the NPC branch, use current validation when meta.rulesetId === SOCIETY_RULESET; use the historical validator only for /^tile-society-0[1-9]$/. Keep all id/profile/order checks and error refs unchanged. A1/A2 sequencing is unresolved until the owner answers; see the next paragraph.
A1/A2 dependency conflict: A1 adds life while SOCIETY_RULESET remains 09 until A2. The nine existing v9 fixtures have no life and are still treated as current in session-records.test.ts:14. A1 cannot both require life for current records and keep all existing fixture tests GREEN without an approved staging policy. Recommended owner correction: A1 GREEN is its complete RED acceptance suite plus directly affected current-factory checks; full legacy/current-fixture GREEN is A2 after ruleset 10 and v10 fixtures. A1 must not introduce a temporary missing-life acceptance for v9 current saves. Historical validation is added in A2 under the strict old-ruleset branch. Alternative sequencing needs an explicit owner correction, not a silent builder choice.
Proposed A2 helper (imports isNamedCharacterRecord, managerSlotTileIds, WORLD_TRAITS and type TileTrialState from the existing core exports; local descriptor-only dense reader keeps the previous rejection behavior):
```ts
function isHistoricalNpcList(raw: unknown, city: TileTrialState): boolean {
  try {
    if (!Array.isArray(raw) || Object.getPrototypeOf(raw) !== Array.prototype ||
        Reflect.ownKeys(raw).length !== raw.length + 1) return false;
    const slots = managerSlotTileIds(city), traitIds = WORLD_TRAITS.map(t => t.id);
    const ids = new Set<string>(), posts = new Set<string>();
    for (let i = 0; i < raw.length; i++) {
      const entry = Object.getOwnPropertyDescriptor(raw, String(i));
      if (!entry?.enumerable || !('value' in entry)) return false;
      const npc = entry.value;
      if (!hasWeeklyKeys(npc, ['character', 'traits', 'postTileId'])) return false;
      const c = npc.character, traits = npc.traits;
      if (!isNamedCharacterRecord(c) || ids.has(c.id) || !Array.isArray(traits) ||
          Object.getPrototypeOf(traits) !== Array.prototype || Reflect.ownKeys(traits).length !== traits.length + 1) return false;
      const seenTraits = new Set<string>();
      for (let j = 0; j < traits.length; j++) {
        const trait = Object.getOwnPropertyDescriptor(traits, String(j));
        if (!trait?.enumerable || !('value' in trait) || typeof trait.value !== 'string' ||
            !traitIds.includes(trait.value) || seenTraits.has(trait.value)) return false;
        seenTraits.add(trait.value);
      }
      const post = npc.postTileId;
      if (post !== null && (typeof post !== 'string' || !slots.includes(post) || posts.has(post))) return false;
      ids.add(c.id); if (post !== null) posts.add(post);
    }
    return true;
  } catch { return false; }
}
```

Replace only the validator subexpression in session-records.ts:169:
```ts
// Before
!isWorldNpcList([...npcs.map(n => n.npc), v.npc], city)
// After (A2 only)
!(meta.rulesetId === SOCIETY_RULESET
  ? isWorldNpcList([...npcs.map(n => n.npc), v.npc], city)
  : /^tile-society-0[1-9]$/.test(meta.rulesetId) && isHistoricalNpcList([...npcs.map(n => n.npc), v.npc], city))
```

No existing historical assertion changes beyond the v10 current-branch selector listed above. Historical rows are reconstructed unchanged solely for the existing old-checkpoint refusal. No migration is implemented.

## Expected fixture and golden path set

Exactly 10 new fixtures under packages/persistence/src/__tests__/fixtures/society-v10/; every society-v1…v9 file remains byte-identical. Source lines are 1 because these files are minified JSON. The state transforms are ruleset only plus each existing NPC gets life as its last key; envelope transforms are separately exact-checked. Seed and existing NPC character.age feed createNpcLife, without rewriting any pre-existing state field. All 9 Character Life scenarios use the same three NPCs (ages 27,31,24).
- `packages/persistence/src/__tests__/fixtures/society-v9/life-5-weeks.json:1` → `packages/persistence/src/__tests__/fixtures/society-v10/life-5-weeks.json`; envelope `cityRulesetId` 09 → 10; state `city.society.rulesetId` 09 → 10; append `npcs.0.life`, `npcs.1.life`, `npcs.2.life`.
- `packages/persistence/src/__tests__/fixtures/society-v9/life-crime-death.json:1` → `packages/persistence/src/__tests__/fixtures/society-v10/life-crime-death.json`; envelope `cityRulesetId` 09 → 10; state `city.society.rulesetId` 09 → 10; append `npcs.0.life`, `npcs.1.life`, `npcs.2.life`.
- `packages/persistence/src/__tests__/fixtures/society-v9/life-crime-raid.json:1` → `packages/persistence/src/__tests__/fixtures/society-v10/life-crime-raid.json`; envelope `cityRulesetId` 09 → 10; state `city.society.rulesetId` 09 → 10; append `npcs.0.life`, `npcs.1.life`, `npcs.2.life`.
- `packages/persistence/src/__tests__/fixtures/society-v9/life-crime-robbery.json:1` → `packages/persistence/src/__tests__/fixtures/society-v10/life-crime-robbery.json`; envelope `cityRulesetId` 09 → 10; state `city.society.rulesetId` 09 → 10; append `npcs.0.life`, `npcs.1.life`, `npcs.2.life`.
- `packages/persistence/src/__tests__/fixtures/society-v9/life-crime-wound.json:1` → `packages/persistence/src/__tests__/fixtures/society-v10/life-crime-wound.json`; envelope `cityRulesetId` 09 → 10; state `city.society.rulesetId` 09 → 10; append `npcs.0.life`, `npcs.1.life`, `npcs.2.life`.
- `packages/persistence/src/__tests__/fixtures/society-v9/life-demand-card.json:1` → `packages/persistence/src/__tests__/fixtures/society-v10/life-demand-card.json`; envelope `cityRulesetId` 09 → 10; state `city.society.rulesetId` 09 → 10; append `npcs.0.life`, `npcs.1.life`, `npcs.2.life`.
- `packages/persistence/src/__tests__/fixtures/society-v9/life-laws.json:1` → `packages/persistence/src/__tests__/fixtures/society-v10/life-laws.json`; envelope `cityRulesetId` 09 → 10; state `city.society.rulesetId` 09 → 10; append `npcs.0.life`, `npcs.1.life`, `npcs.2.life`.
- `packages/persistence/src/__tests__/fixtures/society-v9/life-new-game.json:1` → `packages/persistence/src/__tests__/fixtures/society-v10/life-new-game.json`; envelope `cityRulesetId` 09 → 10; state `city.society.rulesetId` 09 → 10; append `npcs.0.life`, `npcs.1.life`, `npcs.2.life`.
- `packages/persistence/src/__tests__/fixtures/society-v9/life-rebellion-last-week.json:1` → `packages/persistence/src/__tests__/fixtures/society-v10/life-rebellion-last-week.json`; envelope `cityRulesetId` 09 → 10; state `city.society.rulesetId` 09 → 10; append `npcs.0.life`, `npcs.1.life`, `npcs.2.life`.
- `packages/persistence/src/__tests__/fixtures/society-v9/new-game.json:1` → `packages/persistence/src/__tests__/fixtures/society-v10/new-game.json`; envelope `rulesetId` 09 → 10; state `society.rulesetId` 09 → 10; no NPC/life paths (tile-only fixture).

`packages/simulation/src/__tests__/fixtures/catalog-golden.json` (existing, 3 entries):

- Keep seeds [0,42,20261028], 60 weeks, crimeEvents/crisisReports/outsideReports and array order exact. Each session is a JSON string; decode it for the path diff and separately exact-check its outer envelope. The current source lines containing session strings are 8,16,24 (confirmed by the scanner).
- Allowed state leaves: `city.society.rulesetId`; `npcs.{0,1,2}.life.{mind,lust,lustBase,arousal,stress,beauty,birthWeek,origin,hobbies.{0,1},working,sexExp.{hand,mouth,breast,vagina,ass}.{level,exp},history.{counters,recent}}`. Report `npcLife` is not expected in PR A. Every other diff is HOLD. Added life objects must be expanded into leaves or explicitly checked as the complete life subtree; absence must not bypass the whitelist.
- Use the unchanged existing make-catalog-golden.ts once with GENERATE_CATALOG_GOLDEN=1. Preserve the base JSON outside the worktree before removal, because the generator uses flag 'wx' and refuses overwrite. Do not edit the generator, scenario, its consumers, historical path-diff scripts or past path-diff outputs.
- New committed artifacts: `packages/simulation/src/__tests__/fixtures/p7a-path-diff.ts` and `.txt`. Compare base 753e450 against the generated golden/v10 set; assert all historical fixture and generator Git blobs unchanged. Keep every existing golden test exact, including its existing 20 s timeout and mutation-detection test.

## Pin changes

Hashes are SHA-256(JSON.stringify(view)); proposed new catalog text is step0-proposed-npc-life.json. These are computed from data only, before product imports or edits.

- `SOCIETY_TRIAL` (A2): `49add1753fd6d630e3cf7f4f7395f2bd7b844936086ef0b9f06fb6cb595090e6` → `69779e596f2abca5afe88b5858be9d850a6a062dd772ea093bbfebf3ec983acc`.
- `NPC_ORIGINS` (A1): `(new)` → `c252b2c5d31d302c307df967c94b43714f4e3debd527299819f60117f0378f09`.
- `NPC_HOBBIES` (A1): `(new)` → `8a4c0e75fca9aa9b8fd5e26a5bfac38aa161864e02b97832c77955089d7205c2`.
- `P7A_TRIAL` (A1): `(new)` → `b1429bf557d9a96e825a2d9a6d788524ee1e57db1572d35a6c405f2924797013`.

## New tests and acceptance placement

- A1 `packages/core/src/world/__tests__/npc-life.test.ts`: full approved catalog validation/exact malformed-copy messages; deterministic independent NPC RNG, distinct hobbies, fixed starts and ranges; deep isolation; title edges 18/29/30/49/50 and 40-week boundaries; isNpcLife rejects all Review Focus 5 cases plus malformed/untrusted shapes; three starter lives and unchanged shown ages. No weekly-rule code/tests added.
- A1 proposed addition `packages/persistence/src/__tests__/npc-life-records.test.ts`: each Review Focus 5 imported-life case yields StoreRecordError with ref characters:npc_starter_1; original stored rows and serialized bytes stay unchanged; actual store import failure preserves the previously stored session. This path needs explicit per-task scope approval. A2 can add the byte-identical v10 life save/load acceptance to this file.
- A2 `packages/persistence/src/__tests__/society-v9-fixture.test.ts` (new): mirror the entire existing v8 refusal matrix for the 9 v9 Character Life files plus tile fixture, including store reconstruction, exact state/source-byte preservation, old-checkpoint message, and absence of life migration. Existing v8 tests stay untouched.

## Allowlist / task Files exceptions and unchanged candidates

Existing test edits outside specifically named task Files (requested under Step 0's edit-approval clause):

- `packages/core/src/trial/__tests__/crime.test.ts` — A2 current ruleset/fixture reference; exact affected lines are E-listed above.
- `packages/core/src/trial/__tests__/crisis.test.ts` — A2 current ruleset/fixture reference; exact affected lines are E-listed above.
- `packages/core/src/trial/__tests__/items.test.ts` — A2 current ruleset/fixture reference; exact affected lines are E-listed above.
- `packages/core/src/trial/__tests__/law.test.ts` — A2 current ruleset/fixture reference; exact affected lines are E-listed above.
- `packages/core/src/trial/__tests__/order.test.ts` — A2 current ruleset/fixture reference; exact affected lines are E-listed above.
- `packages/core/src/trial/__tests__/outside.test.ts` — A2 current ruleset/fixture reference; exact affected lines are E-listed above.
- `packages/core/src/trial/__tests__/society.test.ts` — A2 current ruleset/fixture reference; exact affected lines are E-listed above.
- `packages/core/src/world/__tests__/npc.test.ts` — A1 preserves the pre-P7 cross-seed assertion for existing fields.
- `packages/core/src/world/__tests__/session.test.ts` — A2 current ruleset/fixture reference; exact affected lines are E-listed above.
- `packages/persistence/src/__tests__/character-life-save.test.ts` — A2 current ruleset/fixture reference; exact affected lines are E-listed above.
- `packages/persistence/src/__tests__/item-records.test.ts` — A2 current ruleset/fixture reference; exact affected lines are E-listed above.
- `packages/persistence/src/__tests__/items-rebuild-order.test.ts` — A2 current ruleset/fixture reference; exact affected lines are E-listed above.
- `packages/persistence/src/__tests__/session-records.test.ts` — A2 current ruleset/fixture reference; exact affected lines are E-listed above.
- `packages/persistence/src/__tests__/society-new-game-fixture.test.ts` — A2 current ruleset/fixture reference; exact affected lines are E-listed above.
- `packages/simulation/src/__tests__/crime-fixtures.test.ts` — A2 current ruleset/fixture reference; exact affected lines are E-listed above.
- `packages/simulation/src/__tests__/crisis-fixtures.test.ts` — A2 current ruleset/fixture reference; exact affected lines are E-listed above.
- `packages/simulation/src/__tests__/law-fixture.test.ts` — A2 current ruleset/fixture reference; exact affected lines are E-listed above.
- `packages/simulation/src/__tests__/law-week.test.ts` — A2 current ruleset/fixture reference; exact affected lines are E-listed above.
- `packages/simulation/src/__tests__/lord-health.test.ts` — A2 current ruleset/fixture reference; exact affected lines are E-listed above.
- `packages/simulation/src/__tests__/smithy-data.test.ts` — A2 current ruleset/fixture reference; exact affected lines are E-listed above.
- `packages/ui/src/__tests__/character-life-session.test.ts` — A2 current ruleset/fixture reference; exact affected lines are E-listed above.
- `packages/ui/src/__tests__/world-session.test.ts` — A2 current ruleset/fixture reference; exact affected lines are E-listed above.
- `tests/e2e/crime.spec.ts` — A2 current ruleset/fixture reference; exact affected lines are E-listed above.
- `tests/e2e/crisis.spec.ts` — A2 current ruleset/fixture reference; exact affected lines are E-listed above.
- `tests/e2e/garrison.spec.ts` — A2 current ruleset/fixture reference; exact affected lines are E-listed above.
- `tests/e2e/items.spec.ts` — A2 current ruleset/fixture reference; exact affected lines are E-listed above.
- `tests/e2e/laws.spec.ts` — A2 current ruleset/fixture reference; exact affected lines are E-listed above.
- `tests/e2e/ledger.spec.ts` — A2 current ruleset/fixture reference; exact affected lines are E-listed above.
- `tests/e2e/society.spec.ts` — A2 current ruleset/fixture reference; exact affected lines are E-listed above.
- `tests/e2e/storage.spec.ts` — A2 current ruleset/fixture reference; exact affected lines are E-listed above.
- `tests/e2e/tile-save.spec.ts` — A2 current ruleset/fixture reference; exact affected lines are E-listed above.
- `tests/e2e/title.spec.ts` — A2 current ruleset/fixture reference; exact affected lines are E-listed above.
- `tests/e2e/world-session.spec.ts` — A2 current ruleset/fixture reference; exact affected lines are E-listed above.

Product-file scope clarifications: session-records.ts historical NPC shape branch (beyond a regex-only v9 addition), and npc.ts session-seeded life initialization (required by Decision 3). New persistence test paths need per-task Files clarification. No new subsystem, new dependency, weekly code, UI product code, docs file, timeout or threshold is proposed.

Unchanged candidates explicitly checked:

- `packages/simulation/src/__tests__/fixtures/make-catalog-golden.ts`, `catalog-golden.test.ts`, and all older golden/path-diff scripts/outputs: consumers remain exact and historical evidence is not rewritten.
- `packages/persistence/src/__tests__/society-v1-fixture.test.ts` through `society-v8-fixture.test.ts`, `garrison-fixtures.test.ts`, the v7 historical item-records test, `society-only-save.test.ts`, legacy-v1/goods-v1 snapshots, old inline e2e checkpoint strings: preserve fixtures/assertions and old-save refusal. New strict life must not make recordsToSession throw on their historical NPCs.
- `packages/ui/src/data-inspector.ts:22–43` / `__tests__/data-inspector.test.ts:38–50`: explicit five-catalog inspector registry; it does not auto-enumerate data files (already omits items/recipes). No PR A UI expansion or test baseline change.
- `packages/simulation/src/__tests__/lord-health.test.ts:73` and `society-renewable-support.test.ts:160`: retain the owner-approved 15 s timeouts. The :26 fixture path in lord-health.test.ts is the only proposed edit in that file. Every other timeout remains unchanged.
- Existing identity/health/skills/profile/body metrics/observation DTO assertions, 320/375 e2e and performance thresholds stay exact. No assertion is dropped or converted to a partial matcher.

## Full expected product-branch file inventory

Expected 59 paths: 9 named product files (including 2 new), 34 existing tests, 3 new tests, 10 new fixtures, 1 golden and 2 new path-diff artifacts. This is the candidate inventory, not authorization to bypass the owner HOLD.

```text
packages/core/src/__tests__/catalog-data.test.ts
packages/core/src/data/npc-life.json
packages/core/src/data/tuning.json
packages/core/src/data/validate.ts
packages/core/src/index.ts
packages/core/src/trial/__tests__/crime.test.ts
packages/core/src/trial/__tests__/crisis.test.ts
packages/core/src/trial/__tests__/items.test.ts
packages/core/src/trial/__tests__/law.test.ts
packages/core/src/trial/__tests__/order.test.ts
packages/core/src/trial/__tests__/outside.test.ts
packages/core/src/trial/__tests__/society.test.ts
packages/core/src/trial/society.ts
packages/core/src/world/__tests__/npc-life.test.ts
packages/core/src/world/__tests__/npc.test.ts
packages/core/src/world/__tests__/session.test.ts
packages/core/src/world/npc-content.ts
packages/core/src/world/npc-life.ts
packages/core/src/world/npc.ts
packages/persistence/src/__tests__/character-life-save.test.ts
packages/persistence/src/__tests__/fixtures/society-v10/life-5-weeks.json
packages/persistence/src/__tests__/fixtures/society-v10/life-crime-death.json
packages/persistence/src/__tests__/fixtures/society-v10/life-crime-raid.json
packages/persistence/src/__tests__/fixtures/society-v10/life-crime-robbery.json
packages/persistence/src/__tests__/fixtures/society-v10/life-crime-wound.json
packages/persistence/src/__tests__/fixtures/society-v10/life-demand-card.json
packages/persistence/src/__tests__/fixtures/society-v10/life-laws.json
packages/persistence/src/__tests__/fixtures/society-v10/life-new-game.json
packages/persistence/src/__tests__/fixtures/society-v10/life-rebellion-last-week.json
packages/persistence/src/__tests__/fixtures/society-v10/new-game.json
packages/persistence/src/__tests__/item-records.test.ts
packages/persistence/src/__tests__/items-rebuild-order.test.ts
packages/persistence/src/__tests__/npc-life-records.test.ts
packages/persistence/src/__tests__/session-records.test.ts
packages/persistence/src/__tests__/society-new-game-fixture.test.ts
packages/persistence/src/__tests__/society-v9-fixture.test.ts
packages/persistence/src/session-records.ts
packages/simulation/src/__tests__/crime-fixtures.test.ts
packages/simulation/src/__tests__/crisis-fixtures.test.ts
packages/simulation/src/__tests__/fixtures/catalog-golden.json
packages/simulation/src/__tests__/fixtures/p7a-path-diff.ts
packages/simulation/src/__tests__/fixtures/p7a-path-diff.txt
packages/simulation/src/__tests__/law-fixture.test.ts
packages/simulation/src/__tests__/law-week.test.ts
packages/simulation/src/__tests__/lord-health.test.ts
packages/simulation/src/__tests__/smithy-data.test.ts
packages/ui/src/__tests__/character-life-session.test.ts
packages/ui/src/__tests__/world-session.test.ts
tests/e2e/crime.spec.ts
tests/e2e/crisis.spec.ts
tests/e2e/garrison.spec.ts
tests/e2e/items.spec.ts
tests/e2e/laws.spec.ts
tests/e2e/ledger.spec.ts
tests/e2e/society.spec.ts
tests/e2e/storage.spec.ts
tests/e2e/tile-save.spec.ts
tests/e2e/title.spec.ts
tests/e2e/world-session.spec.ts
```

## Handoff state

No RED/GREEN or A3 PASS claimed. No implementation commit, push, PR, or merge. Product status is empty. Branch/base/tree are at the top. All A0 evidence lives outside the worktree at C:/Users/Admin/.t3/local-drafts/p7a-prA/; no docs files were written on the product branch. Existing worktrees retained; storage reclaimed: 0 bytes. Ports must be rechecked before smoke and on final handoff.

Owner action: approve this Step 0 inventory and resolve the historical-record/A1-staging and envelope-guard clarifications. Until that answer, HOLD remains in force.
