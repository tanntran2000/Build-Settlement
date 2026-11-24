# B2 Step 0 unit-test inventory

Baseline 7e1aca45e35be17772ff770c3a4595c8213b0d3b. Tree fd04e1f2d7f6f47270a2e7ac82d18b68729a6372. Static inspection and byte replay only. Reconstructed after removal of the assigned checkout. The B1 Git blobs are intact. The former worktree bytes and line endings are unavailable. The proposal has 169 exact hunks in 26 existing files. The separate save and economy inventory owns version folders and Gold pin edits.

Test hydration uses the session's outside seed and the fixed keys `{week: 1, source: 'guild', slot: 0|1|2}` in that order, with `estate-2` as the existing Hall and no caller-supplied salt. `withNpcs` returns a detached session and supplies aligned profiles for Character Life only. Explicit overrides are local to a single oracle or to the isolated NPC weekly suite. These are proposed source bytes and every affected suite still needs RED and GREEN on an approved B2 branch.

The approved plan covers new tests and places existing starter-NPC test edits under owner approval at Step 0. The files below come from that approval condition. The observation action list remains the established partial command projection unless a separate decision extends it.

## Proposed changes by pinned source location

The inventory gives original and proposed UTF-8 Git blob strings. On modified hunks below, `−` and `+` show before and after content. The JSON encodes actual line endings and EOF explicitly. Affected pinned lines outside a revised hunk continue using that file's fixture change and list unchanged text under `sourceOccurrences`.

### packages/core/src/character/__tests__/describe.test.ts

Standalone P7-A profile-rendering examples supply their own fixtures. Give their character and profile IDs test-only names so the cases retain fixed prose, occupations, traits, and pronoun branches independent of New Game.

Clara and Ruth are authored P7-A formatting examples here, with exact names retained in character creation and all text assertions.

`packages/core/src/character/__tests__/describe.test.ts:8`

```diff
−   character: createNamedCharacter({ id: 'npc_starter_1', name: 'Clara', gender: 'female', age: 27, occupation: 'technician', socialClass: 'skilled', legalStatus: 'citizen' }),
+   character: createNamedCharacter({ id: 'npc_description_a', name: 'Clara', gender: 'female', age: 27, occupation: 'technician', socialClass: 'skilled', legalStatus: 'citizen' }),
```

`packages/core/src/character/__tests__/describe.test.ts:10`

```diff
−     id: 'npc_starter_1',
+     id: 'npc_description_a',
```

`packages/core/src/character/__tests__/describe.test.ts:19`

```diff
−   character: createNamedCharacter({ id: 'npc_starter_2', name: 'Ruth', gender: 'female', age: 31, occupation: 'doctor', socialClass: 'skilled', legalStatus: 'free_resident' }),
+   character: createNamedCharacter({ id: 'npc_description_b', name: 'Ruth', gender: 'female', age: 31, occupation: 'doctor', socialClass: 'skilled', legalStatus: 'free_resident' }),
```

`packages/core/src/character/__tests__/describe.test.ts:21`

```diff
−     id: 'npc_starter_2',
+     id: 'npc_description_b',
```

### packages/core/src/character/__tests__/session.test.ts

Session shape, NPC/profile order and valid profiles remain tested with generated rows. New Game player seeding and detachment stay exact. The fixed third template and frozen starter assertions end with deletion of the named templates. The standalone P7-A character description tests still pin both exact descriptions, and B2.1 pins generated profiles.

`appearance.measurements` is optional in the pre-B2 profile type, and B2 explicitly rolls from the appearance data. Gate the generated presence/disclosure in B2.1 and retain existing positive and negative measurements validation, including `validate.test.ts:52,115–138` and observation tests.

`packages/core/src/character/__tests__/session.test.ts:2 (insert before)`

```diff
+ import { NPC_TEST_KEYS, withNpcs } from '../../__tests__/helpers/npcs.js';
```

`packages/core/src/character/__tests__/session.test.ts:3–6`

```diff
− import { WORLD_STARTER_NPCS } from '../../world/npc-content.js';
− import { describeShort } from '../describe.js';
− import { createCharacterLifeSession, createPlayerCharacter, validatePlayerDraft } from '../session.js';
− import { DEFAULT_PLAYER_DRAFT, PLAYER_APPEARANCE_PRESETS, STARTER_PROFILES, type PlayerDraft } from '../starter-profiles.js';
+ import { createCharacterLifeSession, createPlayerCharacter, DEFAULT_PLAYER_DRAFT, PLAYER_APPEARANCE_PRESETS, validatePlayerDraft, type PlayerDraft } from '../session.js';
```

`packages/core/src/character/__tests__/session.test.ts:130–134`

```diff
− describe('starter content', () => {
−   it('starter profiles validate against their characters', () => {
−     expect(STARTER_PROFILES.map(p => p.id)).toEqual(WORLD_STARTER_NPCS.map(n => n.character.id));
−     STARTER_PROFILES.forEach((p, i) => expect(isCharacterProfile(p, WORLD_STARTER_NPCS[i].character)).toBe(true));
−     for (const p of STARTER_PROFILES) {
+ describe('player presets and generated profiles', () => {
+   it('pairs generated profiles with their characters and omits unset private identity fields', () => {
+     const s = withNpcs(session(0, draft()), NPC_TEST_KEYS);
+     expect(s.profiles.map(p => p.id)).toEqual(s.npcs.map(n => n.character.id));
+     s.profiles.forEach((p, i) => expect(isCharacterProfile(p, s.npcs[i].character)).toBe(true));
+     for (const p of s.profiles) {
```

`packages/core/src/character/__tests__/session.test.ts:136`

```diff
−       expect([Object.hasOwn(p, 'private'), Object.hasOwn(p.traits, 'intimacyKnowledge'), Object.hasOwn(p.appearance, 'measurements')]).toEqual([false, false, false]);
+       expect([Object.hasOwn(p, 'private'), Object.hasOwn(p.traits, 'intimacyKnowledge')]).toEqual([false, false]);
```

`packages/core/src/character/__tests__/session.test.ts:138–146`

```diff
−   });
−   it('npc_starter_3 uses the plan values', () => {
−     expect(STARTER_PROFILES[2]).toEqual({
−       id: 'npc_starter_3',
−       identity: { birthName: null, label: null, pronouns: 'she', birthplaceId: 'cinder_hollow', origin: { regionId: 'ashfield', upbringing: 'city' }, currentLocationId: 'haven', biography: null },
−       traits: { attractiveness: 72, learningAptitude: 48, warmth: 45 },
−       appearance: { presentation: 'feminine', skinTone: 'fair', eyeColor: 'green', hair: { color: 'red', length: 'long', texture: 'wavy', style: 'braided' },
−         face: { shape: 'round', features: ['high_cheekbones'] }, build: 'slim', heightCm: 162, weightKg: 55, outfit: 'role_default' },
−     });
```

`packages/core/src/character/__tests__/session.test.ts:154`

```diff
−   it('default draft, presets and starter profiles are deep-frozen', () => {
+   it('default draft and presets are deep-frozen', () => {
```

`packages/core/src/character/__tests__/session.test.ts:157`

```diff
−     expect(deepFrozen(STARTER_PROFILES)).toBe(true);
```

`packages/core/src/character/__tests__/session.test.ts:159`

```diff
−     expect(() => { (STARTER_PROFILES[0].traits as { warmth: number }).warmth = 1; }).toThrow();
```

`packages/core/src/character/__tests__/session.test.ts:164`

```diff
−   it('createCharacterLifeSession(0, valid) equals createNpcWorldSession(0) plus player and STARTER_PROFILES, passes isCharacterLifeSessionState', () => {
+   it('createCharacterLifeSession(0, valid) equals createNpcWorldSession(0) plus player and empty profiles, passes isCharacterLifeSessionState', () => {
```

`packages/core/src/character/__tests__/session.test.ts:168`

```diff
−     expect(s).toEqual({ ...npc.value, player: player(full()), profiles: STARTER_PROFILES });
+     expect(s).toEqual({ ...npc.value, player: player(full()), profiles: [] });
```

`packages/core/src/character/__tests__/session.test.ts:183–184`

```diff
−   it('editing one session cannot leak into templates or the next New Game', () => {
−     const d = draft(), first = session(0, d);
+   it('editing one session cannot leak into the next New Game or another generated fixture', () => {
+     const d = draft(), first = withNpcs(session(0, d), NPC_TEST_KEYS);
+     const before = structuredClone(first);
```

`packages/core/src/character/__tests__/session.test.ts:189`

```diff
−     expect(second.profiles).toEqual(STARTER_PROFILES);
+     expect(second.npcs).toEqual([]); expect(second.profiles).toEqual([]);
```

`packages/core/src/character/__tests__/session.test.ts:191–192`

```diff
−     expect(second.npcs[0].character.name).not.toBe('Changed');
−     expect(first.profiles[0]).not.toBe(STARTER_PROFILES[0]);
+     const generated = withNpcs(second, NPC_TEST_KEYS);
+     expect(generated).toEqual(before);
+     expect(first.profiles[0]).not.toBe(generated.profiles[0]);
```

`packages/core/src/character/__tests__/session.test.ts:194`

```diff
−   it('keeps the seeded NPC names, ids, stats and assignment; profiles are separate', () => {
+   it('keeps generated names, ids, stats and posts across world and life fixture hydration', () => {
```

`packages/core/src/character/__tests__/session.test.ts:197–204`

```diff
−     const s = session(3, draft());
−     expect(s.npcs).toEqual(npc.value.npcs);
−     expect(s.npcs.map(n => n.postTileId)).toEqual(WORLD_STARTER_NPCS.map(n => n.postTileId));
−   });
−   it('describeShort for npc_starter_1 equals spec Example A short line except the drawn name', () => {
−     const s = session(0, draft()), npc = s.npcs[0];
−     expect(describeShort({ character: npc.character, profile: s.profiles[0], role: 'npc', postBuildingName: null }))
−       .toBe(`${npc.character.name} · 27 · Technician from Northreach · average height, slim · light olive skin · shoulder-length brown hair · grey eyes · attractive · quick learner · reserved`);
+     const s = withNpcs(session(3, draft()), NPC_TEST_KEYS);
+     expect(s.npcs).toEqual(withNpcs(npc.value, NPC_TEST_KEYS).npcs);
+     expect(s.npcs.map(n => n.postTileId)).toEqual([null, null, null]);
+     expect(s.profiles.map(p => p.id)).toEqual(s.npcs.map(n => n.character.id));
```

### packages/core/src/character/__tests__/validate.test.ts

Generated owner and profile pairs are in the positive/malformed validator fixtures. Keep the separately authored base profile to isolate validation cases from generator output.

`packages/core/src/character/__tests__/validate.test.ts:2 (insert before)`

```diff
+ import { NPC_TEST_KEYS, withNpcs } from '../../__tests__/helpers/npcs.js';
```

`packages/core/src/character/__tests__/validate.test.ts:10`

```diff
− const npcSession = () => { const r = createNpcWorldSession(0); if (!r.success) throw Error(r.error.message); return r.value; };
+ const npcSession = () => { const r = createNpcWorldSession(0); if (!r.success) throw Error(r.error.message); return withNpcs(r.value, NPC_TEST_KEYS); };
```

`packages/core/src/character/__tests__/validate.test.ts:18–30`

```diff
− const starterProfiles = (): CharacterProfile[] => {
−   const ruth = base('npc_starter_2');
−   ruth.identity = { ...ruth.identity, birthplaceId: 'tidewall', origin: { regionId: 'saltmere', upbringing: 'port_town' } };
−   ruth.appearance = { ...ruth.appearance, skinTone: 'deep_brown', eyeColor: 'brown', hair: { color: 'black', length: 'short', texture: 'straight', style: 'loose' },
−     face: { shape: 'heart_shaped', features: ['glasses'] }, build: 'average', heightCm: 174, weightKg: 70 };
−   ruth.traits = { attractiveness: 50, learningAptitude: 55, warmth: 78 };
−   const third = base('npc_starter_3');
−   third.identity = { ...third.identity, birthplaceId: 'cinder_hollow', origin: { regionId: 'ashfield', upbringing: 'city' } };
−   third.appearance = { ...third.appearance, skinTone: 'fair', eyeColor: 'green', hair: { color: 'red', length: 'long', texture: 'wavy', style: 'braided' },
−     face: { shape: 'round', features: ['high_cheekbones'] }, heightCm: 162, weightKg: 55 };
−   third.traits = { attractiveness: 72, learningAptitude: 48, warmth: 45 };
−   return [base('npc_starter_1'), ruth, third];
− };
```

`packages/core/src/character/__tests__/validate.test.ts:40`

```diff
− const lifeSession = () => ({ ...npcSession(), player: player(), profiles: starterProfiles() });
+ const lifeSession = () => { const r = createNpcWorldSession(0); if (!r.success) throw Error(r.error.message); return withNpcs({ ...r.value, player: player(), profiles: [] as CharacterProfile[] }, NPC_TEST_KEYS); };
```

`packages/core/src/character/__tests__/validate.test.ts:42`

```diff
− const profileWith = (mutate: (p: Mutable) => void, id = 'npc_starter_1') => { const p = structuredClone(base(id)) as Mutable; mutate(p); return p; };
+ const profileWith = (mutate: (p: Mutable) => void, id = 'npc_w1_guild_0') => { const p = structuredClone(base(id)) as Mutable; mutate(p); return p; };
```

`packages/core/src/character/__tests__/validate.test.ts:46–47`

```diff
−   it('accepts a valid profile for each starter', () => {
−     const npcs = npcSession().npcs, profiles = starterProfiles();
+   it('accepts a valid profile for each generated NPC', () => {
+     const { npcs, profiles } = lifeSession();
```

`packages/core/src/character/__tests__/validate.test.ts:55`

```diff
−     expect(isCharacterProfile(base('npc_starter_2'), character())).toBe(false);
+     expect(isCharacterProfile(base('npc_w1_guild_1'), character())).toBe(false);
```

`packages/core/src/character/__tests__/validate.test.ts:111`

```diff
−     expect(isCharacterProfile(base('npc_starter_1'), minor)).toBe(true);
+     expect(isCharacterProfile(base('npc_w1_guild_0'), minor)).toBe(true);
```

`packages/core/src/character/__tests__/validate.test.ts:150`

```diff
−     expect(isPlayerCharacter({ ...player(), character: playerCharacter({ id: 'npc_starter_1' }) })).toBe(false);
+     expect(isPlayerCharacter({ ...player(), character: playerCharacter({ id: 'npc_w1_guild_0' }) })).toBe(false);
```

`packages/core/src/character/__tests__/validate.test.ts:152`

```diff
−     expect(isPlayerCharacter({ ...player(), profile: base('npc_starter_1') })).toBe(false);
+     expect(isPlayerCharacter({ ...player(), profile: base('npc_w1_guild_0') })).toBe(false);
```

`packages/core/src/character/__tests__/validate.test.ts:163`

```diff
−     expect(isCharacterLifeSessionState({ ...s, profiles: [...s.profiles, base('npc_starter_4')] })).toBe(false);
+     expect(isCharacterLifeSessionState({ ...s, profiles: [...s.profiles, base('npc_extra_profile')] })).toBe(false);
```

`packages/core/src/character/__tests__/validate.test.ts:298`

```diff
−   it('accepts every starter character and the player character', () => {
+   it('accepts every generated NPC character and the player character', () => {
```

`packages/core/src/character/__tests__/validate.test.ts:330`

```diff
−       isPlayerCharacter(adultPlayer({ occupation: 'governor' })), isCharacterProfile(base('npc_starter_1'), character(17))];
+       isPlayerCharacter(adultPlayer({ occupation: 'governor' })), isCharacterProfile(base('npc_w1_guild_0'), character(17))];
```

`packages/core/src/character/__tests__/validate.test.ts:344`

```diff
−       isPlayerCharacter(adultPlayer({ occupation: 'governor' })), isCharacterProfile(base('npc_starter_1'), character(17))]).toEqual(before);
+       isPlayerCharacter(adultPlayer({ occupation: 'governor' })), isCharacterProfile(base('npc_w1_guild_0'), character(17))]).toEqual(before);
```

### packages/core/src/trial/__tests__/items-canonical.test.ts

Uses synthetic character IDs passed directly into the item validator. Rename the fixture ID; the canonical empty-owner rejection and every exact assertion stay intact.

`packages/core/src/trial/__tests__/items-canonical.test.ts:9`

```diff
−   ['empty NPC equipment', items => { items.equipped = { npc_starter_1: {} }; }],
+   ['empty NPC equipment', items => { items.equipped = { npc_test_owner: {} }; }],
```

`packages/core/src/trial/__tests__/items-canonical.test.ts:17`

```diff
−   expect(isItemsState(items, ['player', 'npc_starter_1'])).toBe(false);
+   expect(isItemsState(items, ['player', 'npc_test_owner'])).toBe(false);
```

### packages/core/src/trial/__tests__/items.test.ts

Inject a real Hall NPC only in the post-equipment case. Keep the exact effective skill, trait, no-mutation and null-post proofs and the malformed item owner test. The NPC's combat is pinned at 30 so the +12 calculation can never depend on a generated cap.

`items.test.ts:8` current-ruleset pin belongs to the save/Gold inventory. Its older `starts society v9` case title should say `starts society v12` when that hunk is consolidated.

`packages/core/src/trial/__tests__/items.test.ts:2 (insert before)`

```diff
+ import { NPC_TEST_KEYS, withNpcs } from '../../__tests__/helpers/npcs.js';
```

`packages/core/src/trial/__tests__/items.test.ts:28–29`

```diff
−  const r=createCharacterLifeSession(0,{...structuredClone(DEFAULT_PLAYER_DRAFT),currentName:'Ana'});if(!r.success)throw Error();const s=r.value;
−  s.npcs[0].postTileId='field-1';s.city.society!.items.equipped.npc_starter_1={weapon:{id:1,defId:'wardens-oath'}};s.city.society!.items.nextItemId=2;
+  const r=createCharacterLifeSession(0,{...structuredClone(DEFAULT_PLAYER_DRAFT),currentName:'Ana'});if(!r.success)throw Error();const s=withNpcs(r.value,NPC_TEST_KEYS.slice(0,1));
+  s.npcs[0].character.skills.combat=30;
+  s.npcs[0].postTileId='field-1';s.city.society!.items.equipped.npc_w1_guild_0={weapon:{id:1,defId:'wardens-oath'}};s.city.society!.items.nextItemId=2;
```

`packages/core/src/trial/__tests__/items.test.ts:31`

```diff
−  s.npcs[0].postTileId=null;expect(api.buildItemWeekContext(s).postSkills).toEqual({});expect(s.city.society!.items.equipped.npc_starter_1.weapon).toBeDefined();
+  s.npcs[0].postTileId=null;expect(api.buildItemWeekContext(s).postSkills).toEqual({});expect(s.city.society!.items.equipped.npc_w1_guild_0.weapon).toBeDefined();
```

`packages/core/src/trial/__tests__/items.test.ts:51`

```diff
−  expect(api.isItemsState(s,['player','npc_starter_1'])).toBe(false);
+  expect(api.isItemsState(s,['player','npc_test_owner'])).toBe(false);
```

### packages/core/src/trial/__tests__/society-stock-integrity.test.ts

Seed and detachment coverage keeps the existing exact equality and manager slot oracles. Both sessions hydrate the three generated Hall NPCs before mutations.

`packages/core/src/trial/__tests__/society-stock-integrity.test.ts:2 (insert before)`

```diff
+ import { NPC_TEST_KEYS, withNpcs } from '../../__tests__/helpers/npcs.js';
```

`packages/core/src/trial/__tests__/society-stock-integrity.test.ts:56–66`

```diff
−   expect({ ...b.value, city: a.value.city }).toEqual(a.value);
−   expect(isCharacterLifeSessionState(b.value)).toBe(true);
−   expect(isLiveCharacterLifeSessionState(b.value)).toBe(true);
−   expect(managerSlotTileIds(a.value.city)).toEqual(['field-1', 'plain-1', 'spec-1']);
−   expect(managerSlotTileIds(b.value.city)).toEqual(['field-1', 'plain-1', 'spec-1']);
−   const before = structuredClone(a.value);
−   b.value.city.goodsStock!.amountMilli = 0;
−   b.value.outside.tiles[0].knownBy.length = 0;
−   b.value.npcs[0].character.name = 'Changed';
−   b.value.player.character.name = 'Changed';
−   expect(a.value).toEqual(before);
+   const first = withNpcs(a.value, NPC_TEST_KEYS), second = withNpcs(b.value, NPC_TEST_KEYS);
+   expect({ ...second, city: first.city }).toEqual(first);
+   expect(isCharacterLifeSessionState(second)).toBe(true);
+   expect(isLiveCharacterLifeSessionState(second)).toBe(true);
+   expect(managerSlotTileIds(first.city)).toEqual(['field-1', 'plain-1', 'spec-1']);
+   expect(managerSlotTileIds(second.city)).toEqual(['field-1', 'plain-1', 'spec-1']);
+   const before = structuredClone(first);
+   second.city.goodsStock!.amountMilli = 0;
+   second.outside.tiles[0].knownBy.length = 0;
+   second.npcs[0].character.name = 'Changed';
+   second.player.character.name = 'Changed';
+   expect(first).toEqual(before);
```

### packages/core/src/world/__tests__/npc-life.test.ts

The old fixed ages, health, PR-A life stream equality and frozen starter values belong to deleted templates. Replace with exact generated object order including household, save-valid lives with matching generation ages, exact generated life parity, and isolated nested mutations. Independent P7-A `createNpcLife` range and seed oracles elsewhere in this file remain.

`packages/core/src/world/__tests__/npc-life.test.ts:2 (insert before)`

```diff
+ import { NPC_TEST_KEYS, withNpcs } from '../../__tests__/helpers/npcs.js';
```

`packages/core/src/world/__tests__/npc-life.test.ts:85`

```diff
−   it('initializes the three starter lives last, preserves ages/health and isolates all nested state', () => {
+   it('initializes generated live NPC records with household last and isolates nested state', () => {
```

`packages/core/src/world/__tests__/npc-life.test.ts:88–92`

```diff
−     expect(made.value.npcs.map(n => api.npcAge(n.life, 1))).toEqual([27, 31, 24]);
−     expect(made.value.npcs.map(n => n.character.health)).toEqual([100, 85, 100]);
−     for (const npc of made.value.npcs) {
−       expect(Object.keys(npc)).toEqual(['character', 'traits', 'postTileId', 'life']);
−       expect(npc.life).toEqual(api.createNpcLife(42, npc.character.id, npc.character.age));
+     const first = withNpcs(made.value, NPC_TEST_KEYS), second = withNpcs(again.value, NPC_TEST_KEYS);
+     const before = structuredClone(second.npcs);
+     expect(first.npcs).toEqual(before);
+     expect(first.npcs.map(n => api.npcAge(n.life, 1))).toEqual(first.npcs.map(n => n.character.age));
+     for (const npc of first.npcs) {
+       expect(Object.keys(npc)).toEqual(['character', 'traits', 'postTileId', 'life', 'household']);
+       expect(api.isNpcLife(npc.life)).toBe(true);
+       expect(api.isNpcHousehold(npc.household)).toBe(true);
```

`packages/core/src/world/__tests__/npc-life.test.ts:94–97`

```diff
−     made.value.npcs[0].life.sexExp.hand.exp = 1; made.value.npcs[0].life.hobbies[0] = 'walking';
−     expect(again.value.npcs[0].life.sexExp.hand.exp).toBe(0);
−     expect(api.WORLD_STARTER_NPCS[0].life.sexExp.hand.exp).toBe(0);
−     expect(Object.isFrozen(api.WORLD_STARTER_NPCS[0].life.sexExp.hand)).toBe(true);
+     first.npcs[0].life.sexExp.hand.exp += 1; first.npcs[0].life.hobbies[0] = first.npcs[0].life.hobbies[1];
+     expect(second.npcs).toEqual(before);
```

### packages/core/src/world/__tests__/npc.test.ts

The world constructor is now empty. Exercise owned validation and post mutations with exact generator keys. Immutable retained trait and manager-type catalogs, seed-independent outside state, ambient randomness, names, ID format and independent outputs remain directly checked. Old fixed skill/trait/template facts are superseded by B2.1's data and exact generated pins.

The full names format assumes only the proposed two title-cased tokens. Original old-name exclusion (`Mai`, `Vy`, `Trang`) and original pooled immutable value tests are superseded by B2.1 reviewing the complete candidate name arrays as owner-approved JSON, validating each nonempty/unique list, and pinning exact names. Existing no-random test hydrates through `session(9)`.

`packages/core/src/world/__tests__/npc.test.ts:2 (insert before)`

```diff
+ import { NPC_TEST_KEYS, withNpcs } from '../../__tests__/helpers/npcs.js';
```

`packages/core/src/world/__tests__/npc.test.ts:3`

```diff
− import { NPC_MANAGER_BUILDING_TYPES,WORLD_NPC_GIVEN_NAMES,WORLD_STARTER_NPCS,WORLD_TRAITS } from '../npc-content.js';
+ import { NPC_MANAGER_BUILDING_TYPES,WORLD_TRAITS } from '../npc-content.js';
```

`packages/core/src/world/__tests__/npc.test.ts:7`

```diff
− const session = (seed = 0) => { const r = createNpcWorldSession(seed); if (!r.success) throw Error(r.error.message); return r.value; };
+ const emptySession = (seed = 0) => { const r = createNpcWorldSession(seed); if (!r.success) throw Error(r.error.message); return r.value; };
+ const session = (seed = 0) => withNpcs(emptySession(seed), NPC_TEST_KEYS);
```

`packages/core/src/world/__tests__/npc.test.ts:10`

```diff
− const unnamed = (npcs: readonly { character: { name: string } }[]) => npcs.map(n => ({ ...n, character: { ...n.character, name: '' } }));
```

`packages/core/src/world/__tests__/npc.test.ts:13–16`

```diff
− describe('starter content', () => {
−   it('has exactly 3 frozen, valid, unassigned female starters with known traits', () => {
−     expect(WORLD_STARTER_NPCS).toHaveLength(3);
−     expect(WORLD_STARTER_NPCS.map(n => n.character.id)).toEqual(['npc_starter_1', 'npc_starter_2', 'npc_starter_3']);
+ describe('generated NPC content', () => {
+   it('generates three valid, unassigned adult women with distinct ids and known traits for the owned fixture', () => {
+     const s = session();
+     expect(s.npcs.map(n => n.character.id)).toEqual(['npc_w1_guild_0', 'npc_w1_guild_1', 'npc_w1_guild_2']);
```

`packages/core/src/world/__tests__/npc.test.ts:18–19`

```diff
−     for (const npc of WORLD_STARTER_NPCS) {
−       expect(npc.character.gender).toBe('female');
+     for (const npc of s.npcs) {
+       expect(npc.character.gender).toBe('female'); expect(npc.character.age).toBeGreaterThanOrEqual(18);
```

`packages/core/src/world/__tests__/npc.test.ts:24`

```diff
−       expect(Object.isFrozen(npc) && Object.isFrozen(npc.character) && Object.isFrozen(npc.character.skills) && Object.isFrozen(npc.traits)).toBe(true);
```

`packages/core/src/world/__tests__/npc.test.ts:26–27`

```diff
−     expect(Object.isFrozen(WORLD_STARTER_NPCS) && Object.isFrozen(WORLD_TRAITS) && Object.isFrozen(NPC_MANAGER_BUILDING_TYPES)).toBe(true);
−     expect(isWorldNpcList(WORLD_STARTER_NPCS, createSocietyState())).toBe(true);
+     expect(Object.isFrozen(WORLD_TRAITS) && Object.isFrozen(NPC_MANAGER_BUILDING_TYPES)).toBe(true);
+     expect(WORLD_TRAITS.every(Object.isFrozen)).toBe(true);
+     expect(isWorldNpcList(s.npcs, s.city)).toBe(true);
```

`packages/core/src/world/__tests__/npc.test.ts:35–36`

```diff
−   it('creates a valid session whose npcs do not alias starter content', () => {
−     const s = session();
+   it('creates a valid empty session and fresh generated fixture instances', () => {
+     const empty = emptySession(), s = withNpcs(empty, NPC_TEST_KEYS), again = session();
+     expect(isNpcWorldSessionState(empty)).toBe(true); expect(empty.npcs).toEqual([]);
```

`packages/core/src/world/__tests__/npc.test.ts:38`

```diff
−     expect(unnamed(s.npcs)).toEqual(unnamed(WORLD_STARTER_NPCS));
+     expect(s.npcs).toEqual(again.npcs);
+     const before = structuredClone(again);
```

`packages/core/src/world/__tests__/npc.test.ts:40–41`

```diff
−     expect(WORLD_STARTER_NPCS[0].character.skills.technical).toBe(65);
−     expect(WORLD_STARTER_NPCS[0].traits).toEqual(['frugal', 'restless']);
+     expect(again).toEqual(before);
```

`packages/core/src/world/__tests__/npc.test.ts:43`

```diff
−   it('resolves three distinct English pool names from the seed, reproducibly', () => {
+   it('resolves three distinct English full names from the seeded fixture keys', () => {
```

`packages/core/src/world/__tests__/npc.test.ts:46`

```diff
−       expect(new Set(n).size).toBe(3); n.forEach(name => expect(WORLD_NPC_GIVEN_NAMES).toContain(name));
+       expect(new Set(n).size).toBe(3); n.forEach(name => expect(name).toMatch(/^[A-Z][a-z]+ [A-Z][a-z]+$/));
```

`packages/core/src/world/__tests__/npc.test.ts:58`

```diff
−   it('keeps identity, stats and traits independent of the resolved names', () => {
+   it('keeps ids tied to generation keys across seeds and accepts valid names without fixture provenance', () => {
```

`packages/core/src/world/__tests__/npc.test.ts:61–63`

```diff
−     expect(a.npcs.map(n => n.character.id)).toEqual(['npc_starter_1', 'npc_starter_2', 'npc_starter_3']);
−     expect(a.npcs.map(({ character, traits, postTileId }) => ({ character: { ...character, name: '' }, traits, postTileId })))
−       .toEqual(b.npcs.map(({ character, traits, postTileId }) => ({ character: { ...character, name: '' }, traits, postTileId })));
+     expect(a.npcs.map(n => n.character.id)).toEqual(['npc_w1_guild_0', 'npc_w1_guild_1', 'npc_w1_guild_2']);
+     expect(a.npcs.map(n => n.character.id)).toEqual(b.npcs.map(n => n.character.id));
```

`packages/core/src/world/__tests__/npc.test.ts:65–71`

```diff
−   });
−   it('has a small original English name pool and no fixed provisional names', () => {
−     expect(WORLD_NPC_GIVEN_NAMES.length).toBeGreaterThanOrEqual(3);
−     expect(new Set(WORLD_NPC_GIVEN_NAMES).size).toBe(WORLD_NPC_GIVEN_NAMES.length);
−     WORLD_NPC_GIVEN_NAMES.forEach(name => expect(name).toMatch(/^[A-Z][a-z]+$/));
−     expect(Object.isFrozen(WORLD_NPC_GIVEN_NAMES)).toBe(true);
−     for (const old of ['Mai', 'Vy', 'Trang']) expect(JSON.stringify([WORLD_STARTER_NPCS, WORLD_NPC_GIVEN_NAMES])).not.toContain(old);
```

`packages/core/src/world/__tests__/npc.test.ts:110`

```diff
−     ['untrimmed id', (n: Mutable[]) => { n[0].character.id = ' npc_mai'; }],
+     ['untrimmed id', (n: Mutable[]) => { n[0].character.id = ' npc_test_untrimmed'; }],
```

### packages/simulation/src/__tests__/character-life-command.test.ts

The two-cycle legacy parity sequence, exact failure precedence, deep detachment and malformed delegated-result tests operate with owned Hall NPCs. Retain all exact branch and same-state assertions. The live Report save-boundary case uses the raw empty factory deliberately, and New Game gains independent B2.2 checks.

`packages/simulation/src/__tests__/character-life-command.test.ts:2 (insert before)`

```diff
+ import { NPC_TEST_KEYS, withNpcs } from '../../../core/src/__tests__/helpers/npcs.js';
```

`packages/simulation/src/__tests__/character-life-command.test.ts:13`

```diff
−   return r.value;
+   return withNpcs(r.value, NPC_TEST_KEYS);
```

`packages/simulation/src/__tests__/character-life-command.test.ts:83`

```diff
−     { type: 'ASSIGN_NPC', npcId: 'npc_starter_1', tileId: 'forest-1' },
+     { type: 'ASSIGN_NPC', npcId: 'npc_w1_guild_0', tileId: 'forest-1' },
```

`packages/simulation/src/__tests__/character-life-command.test.ts:86–87`

```diff
−     { type: 'UNASSIGN_NPC', npcId: 'npc_starter_1' },
−     { type: 'ASSIGN_NPC', npcId: 'npc_starter_2', tileId: 'plain-1' },
+     { type: 'UNASSIGN_NPC', npcId: 'npc_w1_guild_0' },
+     { type: 'ASSIGN_NPC', npcId: 'npc_w1_guild_1', tileId: 'plain-1' },
```

`packages/simulation/src/__tests__/character-life-command.test.ts:130–131`

```diff
−     { type: 'ASSIGN_NPC', fields: { npcId: 'npc_starter_1', tileId: 'field-1' }, bad: { npcId: 7 }, code: 'INVALID_COMMAND' },
−     { type: 'UNASSIGN_NPC', fields: { npcId: 'npc_starter_1' }, bad: { npcId: 7 }, code: 'INVALID_COMMAND' },
+     { type: 'ASSIGN_NPC', fields: { npcId: 'npc_w1_guild_0', tileId: 'field-1' }, bad: { npcId: 7 }, code: 'INVALID_COMMAND' },
+     { type: 'UNASSIGN_NPC', fields: { npcId: 'npc_w1_guild_0' }, bad: { npcId: 7 }, code: 'INVALID_COMMAND' },
```

`packages/simulation/src/__tests__/character-life-command.test.ts:158`

```diff
−     const assigned = oldAction(life(), { type: 'ASSIGN_NPC', npcId: 'npc_starter_1', tileId: 'field-1' });
+     const assigned = oldAction(life(), { type: 'ASSIGN_NPC', npcId: 'npc_w1_guild_0', tileId: 'field-1' });
```

`packages/simulation/src/__tests__/character-life-command.test.ts:176–178`

```diff
−       [life(), { type: 'ASSIGN_NPC', npcId: 'npc_starter_1', tileId: 'plain-2' }, 'LOCKED_POST'],
−       [assigned, { type: 'ASSIGN_NPC', npcId: 'npc_starter_2', tileId: 'field-1' }, 'POST_OCCUPIED'],
−       [assigned, { type: 'ASSIGN_NPC', npcId: 'npc_starter_1', tileId: 'plain-1' }, 'ALREADY_ASSIGNED'],
+       [life(), { type: 'ASSIGN_NPC', npcId: 'npc_w1_guild_0', tileId: 'plain-2' }, 'LOCKED_POST'],
+       [assigned, { type: 'ASSIGN_NPC', npcId: 'npc_w1_guild_1', tileId: 'field-1' }, 'POST_OCCUPIED'],
+       [assigned, { type: 'ASSIGN_NPC', npcId: 'npc_w1_guild_0', tileId: 'plain-1' }, 'ALREADY_ASSIGNED'],
```

`packages/simulation/src/__tests__/character-life-command.test.ts:252`

```diff
−       { type: 'ASSIGN_NPC', expectedRevision: 0, npcId: 'npc_starter_1', tileId: 'field-1' },
+       { type: 'ASSIGN_NPC', expectedRevision: 0, npcId: 'npc_w1_guild_0', tileId: 'field-1' },
```

`packages/simulation/src/__tests__/character-life-command.test.ts:254`

```diff
−       { type: 'UNASSIGN_NPC', expectedRevision: -1, npcId: 'npc_starter_1' },
+       { type: 'UNASSIGN_NPC', expectedRevision: -1, npcId: 'npc_w1_guild_0' },
```

`packages/simulation/src/__tests__/character-life-command.test.ts:293`

```diff
−     { type: 'ASSIGN_NPC', npcId: 'npc_starter_1', tileId: 'field-1' },
+     { type: 'ASSIGN_NPC', npcId: 'npc_w1_guild_0', tileId: 'field-1' },
```

`packages/simulation/src/__tests__/character-life-command.test.ts:329`

```diff
−       ? { type: 'ASSIGN_NPC', expectedRevision: s.city.revision, npcId: 'npc_starter_1', tileId: 'field-1' }
+       ? { type: 'ASSIGN_NPC', expectedRevision: s.city.revision, npcId: 'npc_w1_guild_0', tileId: 'field-1' }
```

### packages/simulation/src/__tests__/character-life-observation.test.ts

Hydrate three owned Hall NPCs before setting hidden fields, comparing exact rendered profiles, assigning slots and mutating projections. Preserve privacy, report and detached-state assertions. Ensure the first NPC has a real trait all the way into the detachment mutation.

Conditional current pin `:110` `... 'ASSIGN_NPC', 'UNASSIGN_NPC', 'EXTEND_WALL' ...` → `... 'ASSIGN_NPC', 'UNASSIGN_NPC', 'MOVE_NPC_HOME', 'EXTEND_WALL' ...` only if owner approves `character-life-observation.ts:106` advertising Move. Existing strict report reconstruction, including intentionally omitted fields in this simulation observation API, stays unchanged.

`packages/simulation/src/__tests__/character-life-observation.test.ts:2 (insert before)`

```diff
+ import { NPC_TEST_KEYS, withNpcs } from '../../../core/src/__tests__/helpers/npcs.js';
```

`packages/simulation/src/__tests__/character-life-observation.test.ts:15`

```diff
−   const s = r.value;
+   const s = withNpcs(r.value, NPC_TEST_KEYS);
+   s.npcs[0].traits = ['frugal'];
```

`packages/simulation/src/__tests__/character-life-observation.test.ts:245`

```diff
−     s = act(s, { type: 'ASSIGN_NPC', npcId: 'npc_starter_1', tileId: 'plain-1' }).next;
+     s = act(s, { type: 'ASSIGN_NPC', npcId: 'npc_w1_guild_0', tileId: 'plain-1' }).next;
```

`packages/simulation/src/__tests__/character-life-observation.test.ts:267`

```diff
−       all = act(all, { type: 'ASSIGN_NPC', npcId: `npc_starter_${i + 1}`, tileId }).next;
+       all = act(all, { type: 'ASSIGN_NPC', npcId: all.npcs[i].character.id, tileId }).next;
```

`packages/simulation/src/__tests__/character-life-observation.test.ts:273`

```diff
−       one = act(one, { type: 'ASSIGN_NPC', npcId: `npc_starter_${i + 1}`, tileId }).next;
+       one = act(one, { type: 'ASSIGN_NPC', npcId: one.npcs[i].character.id, tileId }).next;
```

### packages/simulation/src/__tests__/craft-command.test.ts

The Smithy, Hospital and Drug Store post cases must exercise actual generated Hall ownership. Only those real ASSIGN_NPC cases need a generated NPC; all crafting order, reagent and refund tests remain isolated.

`packages/simulation/src/__tests__/craft-command.test.ts:2 (insert before)`

```diff
+ import { NPC_TEST_KEYS, withNpcs } from '../../../core/src/__tests__/helpers/npcs.js';
```

`packages/simulation/src/__tests__/craft-command.test.ts:174`

```diff
−   const next=act(life(),'ASSIGN_NPC',{npcId:'npc_starter_1',tileId});expect(next.npcs[0].postTileId).toBe(tileId);
+   const next=act(withNpcs(life(),NPC_TEST_KEYS.slice(0,1)),'ASSIGN_NPC',{npcId:'npc_w1_guild_0',tileId});expect(next.npcs[0].postTileId).toBe(tileId);
```

### packages/simulation/src/__tests__/craft-week.test.ts

The effective Smithy skill test continues using real set post and rare hand gear on a generated Hall resident. The asserted technical 59 and equipment delta still cross 60 and remain below 80. The separate 60-week economy pins belong to the save/Gold inventory.

`packages/simulation/src/__tests__/craft-week.test.ts:2 (insert before)`

```diff
+ import { NPC_TEST_KEYS, withNpcs } from '../../../core/src/__tests__/helpers/npcs.js';
```

`packages/simulation/src/__tests__/craft-week.test.ts:166`

```diff
−   const s=session(),items=s.city.society!.items;
+   const s=withNpcs(session(),NPC_TEST_KEYS.slice(0,1)),items=s.city.society!.items;
```

`packages/simulation/src/__tests__/craft-week.test.ts:168`

```diff
−   const gear=add(items,'rare-hand');items.inventory=[];items.equipped.npc_starter_1={hand:gear};
+   const gear=add(items,'rare-hand');items.inventory=[];items.equipped.npc_w1_guild_0={hand:gear};
```

### packages/simulation/src/__tests__/exhausted-materials.test.ts

Keep two owned Hall NPCs for the two posted buildings. Preserve the current all-50 skill values and the exact exhausted-versus-remaining materials and post clearing assertions.

`packages/simulation/src/__tests__/exhausted-materials.test.ts:2 (insert before)`

```diff
+ import { NPC_TEST_KEYS, withNpcs } from '../../../core/src/__tests__/helpers/npcs.js';
```

`packages/simulation/src/__tests__/exhausted-materials.test.ts:15`

```diff
−   const s = made.value, stocks = s.city.world.settlements[s.city.world.activeSettlementId!].inventory;
+   const s = withNpcs(made.value, NPC_TEST_KEYS.slice(0, 2)), stocks = s.city.world.settlements[s.city.world.activeSettlementId!].inventory;
```

### packages/simulation/src/__tests__/item-command.test.ts

Real generated Hall NPC identity is necessary for legal rare-weapon equip, KIND_MISMATCH instead of UNKNOWN_NPC, checking all NPC health is unchanged when consuming a Player potion, FORBIDDEN on NPC potion targeting, and turning a valid owner into a prototype-looking owner as a key-encoding test.

`packages/simulation/src/__tests__/item-command.test.ts:2 (insert before)`

```diff
+ import { NPC_TEST_KEYS, withNpcs } from '../../../core/src/__tests__/helpers/npcs.js';
```

`packages/simulation/src/__tests__/item-command.test.ts:5`

```diff
− function life(){const r=createCharacterLifeSession(0,{...structuredClone(DEFAULT_PLAYER_DRAFT),currentName:'Ana'});if(!r.success)throw Error(r.error.message);return r.value;}
+ function life(){const r=createCharacterLifeSession(0,{...structuredClone(DEFAULT_PLAYER_DRAFT),currentName:'Ana'});if(!r.success)throw Error(r.error.message);return withNpcs(r.value,NPC_TEST_KEYS);}
```

`packages/simulation/src/__tests__/item-command.test.ts:12`

```diff
− it.each([['common-weapon','player'],['rare-weapon','npc_starter_1']])('equips and unequips %s', (defId,characterId)=>{
+ it.each([['common-weapon','player'],['rare-weapon','npc_w1_guild_0']])('equips and unequips %s', (defId,characterId)=>{
```

`packages/simulation/src/__tests__/item-command.test.ts:16`

```diff
− it('rejects KIND_MISMATCH atomically',()=>{const s=life();reject(s,'EQUIP_ITEM',{itemId:add(s,'common-weapon'),characterId:'npc_starter_1'},'KIND_MISMATCH');});
+ it('rejects KIND_MISMATCH atomically',()=>{const s=life();reject(s,'EQUIP_ITEM',{itemId:add(s,'common-weapon'),characterId:'npc_w1_guild_0'},'KIND_MISMATCH');});
```

`packages/simulation/src/__tests__/item-command.test.ts:55`

```diff
−  reject(s,'USE_CONSUMABLE',{itemId,characterId:'npc_starter_1'},'FORBIDDEN');
+  reject(s,'USE_CONSUMABLE',{itemId,characterId:'npc_w1_guild_0'},'FORBIDDEN');
```

### packages/simulation/src/__tests__/item-effects.test.ts

The live garrison and Farm equipment paths need a Hall NPC. Combat and management controls are already explicit and preserve the effects oracle; keep all current output and no-loss/no-mutation assertions unchanged.

`packages/simulation/src/__tests__/item-effects.test.ts:2 (insert before)`

```diff
+ import { NPC_TEST_KEYS, withNpcs } from '../../../core/src/__tests__/helpers/npcs.js';
```

`packages/simulation/src/__tests__/item-effects.test.ts:118`

```diff
− function life() { const r = createCharacterLifeSession(0,{ ...structuredClone(DEFAULT_PLAYER_DRAFT),currentName:'Keeper' }); if (!r.success) throw Error(r.error.message); return r.value; }
+ function life() { const r = createCharacterLifeSession(0,{ ...structuredClone(DEFAULT_PLAYER_DRAFT),currentName:'Keeper' }); if (!r.success) throw Error(r.error.message); return withNpcs(r.value, NPC_TEST_KEYS.slice(0, 1)); }
```

### packages/simulation/src/__tests__/npc-life-week.test.ts

Generate real Hall NPCs, preserving exact life transitions and reports. In this isolated P7-A weekly suite, clear the generated starting history so independent weekly event assertions still test exact counters and recency from zero. Generation stores starting past separately under the B2.1 oracles.

The 100-NPC weekly-step case clones one generated NPC into `perf_${i}` identity rows against the pure NPC life runner. This existing distinct deterministic 60-step test stays. New separate B2.2 save-size coverage uses 100 distinct real generator keys and legal homes.

`packages/simulation/src/__tests__/npc-life-week.test.ts:2 (insert before)`

```diff
+ import { NPC_TEST_KEYS, withNpcs } from '../../../core/src/__tests__/helpers/npcs.js';
```

`packages/simulation/src/__tests__/npc-life-week.test.ts:24`

```diff
−   return made.value;
+   const s = withNpcs(made.value, NPC_TEST_KEYS);
+   for (const npc of s.npcs) npc.life.history = { counters: {}, recent: [] };
+   return s;
```

`packages/simulation/src/__tests__/npc-life-week.test.ts:60`

```diff
−     expect(first.report).toEqual({ ...empty, exhausted: ['npc_starter_1'] });
+     expect(first.report).toEqual({ ...empty, exhausted: ['npc_w1_guild_0'] });
```

`packages/simulation/src/__tests__/npc-life-week.test.ts:70`

```diff
−     expect(result.report.recovered).toEqual(working ? ['npc_starter_1'] : []);
+     expect(result.report.recovered).toEqual(working ? ['npc_w1_guild_0'] : []);
```

`packages/simulation/src/__tests__/npc-life-week.test.ts:88`

```diff
−     expect(result.report.birthdays).toEqual(birthday ? ['npc_starter_1'] : []);
+     expect(result.report.birthdays).toEqual(birthday ? ['npc_w1_guild_0'] : []);
```

`packages/simulation/src/__tests__/npc-life-week.test.ts:107–108`

```diff
−     expect(result.npcs.map(n => n.character.id)).toEqual(['second', 'npc_starter_1']);
−     expect(result.report).toEqual({ exhausted: ['npc_starter_1'], recovered: ['second'], birthdays: ['second', 'npc_starter_1'] });
+     expect(result.npcs.map(n => n.character.id)).toEqual(['second', 'npc_w1_guild_0']);
+     expect(result.report).toEqual({ exhausted: ['npc_w1_guild_0'], recovered: ['second'], birthdays: ['second', 'npc_w1_guild_0'] });
```

`packages/simulation/src/__tests__/npc-life-week.test.ts:132`

```diff
−     s.city.society!.items.equipped.npc_starter_1 = { weapon: { id: 1, defId: 'wardens-oath' } };
+     s.city.society!.items.equipped.npc_w1_guild_0 = { weapon: { id: 1, defId: 'wardens-oath' } };
```

`packages/simulation/src/__tests__/npc-life-week.test.ts:142`

```diff
−     let s = session(); s = action(s, 'ASSIGN_NPC', { npcId: 'npc_starter_1', tileId: 'field-1' }).next;
+     let s = session(); s = action(s, 'ASSIGN_NPC', { npcId: 'npc_w1_guild_0', tileId: 'field-1' }).next;
```

`packages/simulation/src/__tests__/npc-life-week.test.ts:144`

```diff
−     s = action(s, 'ASSIGN_NPC', { npcId: 'npc_starter_1', tileId: 'field-1' }).next;
+     s = action(s, 'ASSIGN_NPC', { npcId: 'npc_w1_guild_0', tileId: 'field-1' }).next;
```

`packages/simulation/src/__tests__/npc-life-week.test.ts:146`

```diff
−     expect(executeCharacterLifeCommand(s, { type: 'UNASSIGN_NPC', expectedRevision: -1, npcId: 'npc_starter_1' }).success).toBe(false);
+     expect(executeCharacterLifeCommand(s, { type: 'UNASSIGN_NPC', expectedRevision: -1, npcId: 'npc_w1_guild_0' }).success).toBe(false);
```

`packages/simulation/src/__tests__/npc-life-week.test.ts:148–149`

```diff
−     s = action(s, 'UNASSIGN_NPC', { npcId: 'npc_starter_1' }).next;
−     s = action(s, 'UNASSIGN_NPC', { npcId: 'npc_starter_1' }).next;
+     s = action(s, 'UNASSIGN_NPC', { npcId: 'npc_w1_guild_0' }).next;
+     s = action(s, 'UNASSIGN_NPC', { npcId: 'npc_w1_guild_0' }).next;
```

`packages/simulation/src/__tests__/npc-life-week.test.ts:151`

```diff
−     s = action(s, 'ASSIGN_NPC', { npcId: 'npc_starter_1', tileId: 'field-1' }).next;
+     s = action(s, 'ASSIGN_NPC', { npcId: 'npc_w1_guild_0', tileId: 'field-1' }).next;
```

`packages/simulation/src/__tests__/npc-life-week.test.ts:158`

```diff
−     for (let i = 0; i < 21; i++) s = action(s, i % 2 ? 'UNASSIGN_NPC' : 'ASSIGN_NPC', { npcId: 'npc_starter_1', ...(i % 2 ? {} : { tileId: 'field-1' }) }).next;
+     for (let i = 0; i < 21; i++) s = action(s, i % 2 ? 'UNASSIGN_NPC' : 'ASSIGN_NPC', { npcId: 'npc_w1_guild_0', ...(i % 2 ? {} : { tileId: 'field-1' }) }).next;
```

`packages/simulation/src/__tests__/npc-life-week.test.ts:177`

```diff
−     expect(r.report).toMatchObject({ npcLife: { exhausted: ['npc_starter_1'], recovered: [], birthdays: [] } });
+     expect(r.report).toMatchObject({ npcLife: { exhausted: ['npc_w1_guild_0'], recovered: [], birthdays: [] } });
```

`packages/simulation/src/__tests__/npc-life-week.test.ts:179`

```diff
−   it('reloads pre-B v10 false/95, rests only after clearing the post, and resumes at 80', () => {
+   it('reloads a v12 NPC at false/95, rests only after clearing the post, and resumes at 80', () => {
```

`packages/simulation/src/__tests__/npc-life-week.test.ts:185`

```diff
−     s = action(loaded.state, 'UNASSIGN_NPC', { npcId: 'npc_starter_1' }).next;
+     s = action(loaded.state, 'UNASSIGN_NPC', { npcId: 'npc_w1_guild_0' }).next;
```

`packages/simulation/src/__tests__/npc-life-week.test.ts:188`

```diff
−       expect(r.report).toMatchObject(working ? { npcLife: { exhausted: [], recovered: ['npc_starter_1'], birthdays: [] } } : {});
+       expect(r.report).toMatchObject(working ? { npcLife: { exhausted: [], recovered: ['npc_w1_guild_0'], birthdays: [] } } : {});
```

`packages/simulation/src/__tests__/npc-life-week.test.ts:191`

```diff
−     s = action(s, 'ASSIGN_NPC', { npcId: 'npc_starter_1', tileId: 'field-1' }).next;
+     s = action(s, 'ASSIGN_NPC', { npcId: 'npc_w1_guild_0', tileId: 'field-1' }).next;
```

`packages/simulation/src/__tests__/npc-life-week.test.ts:198`

```diff
−     expect(r.report).toMatchObject({ npcLife: { exhausted: [], recovered: [], birthdays: ['npc_starter_1', 'npc_starter_2', 'npc_starter_3'] } });
+     expect(r.report).toMatchObject({ npcLife: { exhausted: [], recovered: [], birthdays: ['npc_w1_guild_0', 'npc_w1_guild_1', 'npc_w1_guild_2'] } });
```

`packages/simulation/src/__tests__/npc-life-week.test.ts:214`

```diff
−     const s = session(); s.npcs = []; s.profiles = [];
+     const made = createCharacterLifeSession(42, { ...structuredClone(DEFAULT_PLAYER_DRAFT), currentName: 'Synthetic Keeper' });
+     if (!made.success) throw Error(made.error.message);
+     const s = made.value;
```

### packages/simulation/src/__tests__/society-stock-integrity.test.ts

Supply three Hall NPCs before exact `[0, 0, 0]` and whole-record Arousal projection checks. Keep the exact stock flow and no manager buffs. Any Gold-driven adjustment to stock expectations belongs to save/Gold inventory and must be explained independently.

`packages/simulation/src/__tests__/society-stock-integrity.test.ts:2 (insert before)`

```diff
+ import { NPC_TEST_KEYS, withNpcs } from '../../../core/src/__tests__/helpers/npcs.js';
```

`packages/simulation/src/__tests__/society-stock-integrity.test.ts:114–115`

```diff
−     expect(observeCharacterLife(r.value, null).freeManagerSlots).toHaveLength(3);
−     const next = executeCharacterLifeCommand(r.value, { type: 'END_WEEK', expectedRevision: 0, expectedWeek: 1 });
+     const s = withNpcs(r.value, NPC_TEST_KEYS);
+     expect(observeCharacterLife(s, null).freeManagerSlots).toHaveLength(3);
+     const next = executeCharacterLifeCommand(s, { type: 'END_WEEK', expectedRevision: 0, expectedWeek: 1 });
```

`packages/simulation/src/__tests__/society-stock-integrity.test.ts:121–122`

```diff
−     expect(r.value.npcs.map(npc => npc.life.arousal)).toEqual([0, 0, 0]);
−     expect(next.next.npcs).toEqual(r.value.npcs.map(npc => ({ ...npc, life: { ...npc.life, arousal: Math.floor(npc.life.lust / P7A_TRIAL.arousalDivisor) } })));
+     expect(s.npcs.map(npc => npc.life.arousal)).toEqual([0, 0, 0]);
+     expect(next.next.npcs).toEqual(s.npcs.map(npc => ({ ...npc, life: { ...npc.life, arousal: Math.floor(npc.life.lust / P7A_TRIAL.arousalDivisor) } })));
```

### packages/simulation/src/__tests__/world-npc.test.ts

Keep real-world post dispatch behavior with three generated Hall NPCs. Explicitly give the last NPC the adverse `blunt` trait only in the adverse-trait case so the same premise remains true. Exact post maps, unchanged bytes, codes, and revisions stay.

`packages/simulation/src/__tests__/world-npc.test.ts:2 (insert before)`

```diff
+ import { NPC_TEST_KEYS, withNpcs } from '../../../core/src/__tests__/helpers/npcs.js';
```

`packages/simulation/src/__tests__/world-npc.test.ts:5`

```diff
− const session = () => { const r = createNpcWorldSession(0); if (!r.success) throw Error(r.error.message); return r.value; };
+ const session = () => { const r = createNpcWorldSession(0); if (!r.success) throw Error(r.error.message); return withNpcs(r.value, NPC_TEST_KEYS); };
```

`packages/simulation/src/__tests__/world-npc.test.ts:33–34`

```diff
−     const next = assign(s, 'npc_starter_1', 'field-1');
−     expect(post(next, 'npc_starter_1')).toBe('field-1'); expect(isNpcWorldSessionState(next)).toBe(true);
+     const next = assign(s, 'npc_w1_guild_0', 'field-1');
+     expect(post(next, 'npc_w1_guild_0')).toBe('field-1'); expect(isNpcWorldSessionState(next)).toBe(true);
```

`packages/simulation/src/__tests__/world-npc.test.ts:37`

```diff
−     expect(post(assign(session(), 'npc_starter_3', 'plain-1'), 'npc_starter_3')).toBe('plain-1');
+     const s = session(); s.npcs[2].traits = ['blunt'];
+     expect(post(assign(s, 'npc_w1_guild_2', 'plain-1'), 'npc_w1_guild_2')).toBe('plain-1');
```

`packages/simulation/src/__tests__/world-npc.test.ts:43`

```diff
−     const na = assign(a, 'npc_starter_1', 'field-1'), nb = assign(b, 'npc_starter_1', 'field-1');
+     const na = assign(a, 'npc_w1_guild_0', 'field-1'), nb = assign(b, 'npc_w1_guild_0', 'field-1');
```

`packages/simulation/src/__tests__/world-npc.test.ts:53`

```diff
−     const s = freeze(session()), next = assign(s, 'npc_starter_2', 'field-1');
+     const s = freeze(session()), next = assign(s, 'npc_w1_guild_1', 'field-1');
```

`packages/simulation/src/__tests__/world-npc.test.ts:57`

```diff
−     expect(post(s, 'npc_starter_2')).toBeNull();
+     expect(post(s, 'npc_w1_guild_1')).toBeNull();
```

`packages/simulation/src/__tests__/world-npc.test.ts:60`

```diff
−     rejects(session(), { type: 'ASSIGN_NPC', npcId: 'npc_starter_1', tileId }, 'LOCKED_POST');
+     rejects(session(), { type: 'ASSIGN_NPC', npcId: 'npc_w1_guild_0', tileId }, 'LOCKED_POST');
```

`packages/simulation/src/__tests__/world-npc.test.ts:63`

```diff
−     rejects(assign(session(), 'npc_starter_1', 'field-1'), { type: 'ASSIGN_NPC', npcId: 'npc_starter_2', tileId: 'field-1' }, 'POST_OCCUPIED');
+     rejects(assign(session(), 'npc_w1_guild_0', 'field-1'), { type: 'ASSIGN_NPC', npcId: 'npc_w1_guild_1', tileId: 'field-1' }, 'POST_OCCUPIED');
```

`packages/simulation/src/__tests__/world-npc.test.ts:66–68`

```diff
−     const s = assign(session(), 'npc_starter_1', 'field-1');
−     rejects(s, { type: 'ASSIGN_NPC', npcId: 'npc_starter_1', tileId: 'plain-1' }, 'ALREADY_ASSIGNED');
−     const again = assign(s, 'npc_starter_1', 'field-1');
+     const s = assign(session(), 'npc_w1_guild_0', 'field-1');
+     rejects(s, { type: 'ASSIGN_NPC', npcId: 'npc_w1_guild_0', tileId: 'plain-1' }, 'ALREADY_ASSIGNED');
+     const again = assign(s, 'npc_w1_guild_0', 'field-1');
```

`packages/simulation/src/__tests__/world-npc.test.ts:75`

```diff
−     expect(executeWorldNpcCommand(s, { type: 'ASSIGN_NPC', expectedRevision: s.city.revision - 1, npcId: 'npc_starter_1', tileId: 'field-1' }))
+     expect(executeWorldNpcCommand(s, { type: 'ASSIGN_NPC', expectedRevision: s.city.revision - 1, npcId: 'npc_w1_guild_0', tileId: 'field-1' }))
```

`packages/simulation/src/__tests__/world-npc.test.ts:79–82`

```diff
−     rejects(report, { type: 'ASSIGN_NPC', npcId: 'npc_starter_1', tileId: 'field-1' }, 'FORBIDDEN');
−     rejects(report, { type: 'UNASSIGN_NPC', npcId: 'npc_starter_1' }, 'FORBIDDEN');
−     rejects(session(), { type: 'ASSIGN_NPC', npcId: 'npc_starter_1' }, 'INVALID_COMMAND');
−     rejects(session(), { type: 'ASSIGN_NPC', npcId: 'npc_starter_1', tileId: 'field-1', extra: 1 }, 'INVALID_COMMAND');
+     rejects(report, { type: 'ASSIGN_NPC', npcId: 'npc_w1_guild_0', tileId: 'field-1' }, 'FORBIDDEN');
+     rejects(report, { type: 'UNASSIGN_NPC', npcId: 'npc_w1_guild_0' }, 'FORBIDDEN');
+     rejects(session(), { type: 'ASSIGN_NPC', npcId: 'npc_w1_guild_0' }, 'INVALID_COMMAND');
+     rejects(session(), { type: 'ASSIGN_NPC', npcId: 'npc_w1_guild_0', tileId: 'field-1', extra: 1 }, 'INVALID_COMMAND');
```

`packages/simulation/src/__tests__/world-npc.test.ts:85`

```diff
−     const getter = { type: 'UNASSIGN_NPC', expectedRevision: 0 }; Object.defineProperty(getter, 'npcId', { enumerable: true, get: () => 'npc_starter_1' });
+     const getter = { type: 'UNASSIGN_NPC', expectedRevision: 0 }; Object.defineProperty(getter, 'npcId', { enumerable: true, get: () => 'npc_w1_guild_0' });
```

`packages/simulation/src/__tests__/world-npc.test.ts:88–89`

```diff
−     rejects(bad, { type: 'UNASSIGN_NPC', npcId: 'npc_starter_2' }, 'INVALID_STATE');
−     expect(executeWorldNpcCommand(null, { type: 'UNASSIGN_NPC', expectedRevision: 0, npcId: 'npc_starter_1' })).toMatchObject({ success: false, error: { code: 'INVALID_STATE' } });
+     rejects(bad, { type: 'UNASSIGN_NPC', npcId: 'npc_w1_guild_1' }, 'INVALID_STATE');
+     expect(executeWorldNpcCommand(null, { type: 'UNASSIGN_NPC', expectedRevision: 0, npcId: 'npc_w1_guild_0' })).toMatchObject({ success: false, error: { code: 'INVALID_STATE' } });
```

`packages/simulation/src/__tests__/world-npc.test.ts:94`

```diff
−       s = assign(s, 'npc_starter_1', 'field-1'); s = assign(s, 'npc_starter_2', 'plain-1');
+       s = assign(s, 'npc_w1_guild_0', 'field-1'); s = assign(s, 'npc_w1_guild_1', 'plain-1');
```

`packages/simulation/src/__tests__/world-npc.test.ts:96–97`

```diff
−       s = unassign(s, 'npc_starter_1'); s = assign(s, 'npc_starter_3', 'field-1');
−       s = unassign(s, 'npc_starter_3'); s = unassign(s, 'npc_starter_3');
+       s = unassign(s, 'npc_w1_guild_0'); s = assign(s, 'npc_w1_guild_2', 'field-1');
+       s = unassign(s, 'npc_w1_guild_2'); s = unassign(s, 'npc_w1_guild_2');
```

`packages/simulation/src/__tests__/world-npc.test.ts:107`

```diff
−   const held = () => assign(assign(session(), 'npc_starter_1', 'field-1'), 'npc_starter_2', 'plain-1');
+   const held = () => assign(assign(session(), 'npc_w1_guild_0', 'field-1'), 'npc_w1_guild_1', 'plain-1');
```

`packages/simulation/src/__tests__/world-npc.test.ts:112`

```diff
−     expect(post(assign(s, 'npc_starter_3', 'plain-1'), 'npc_starter_3')).toBe('plain-1');
+     expect(post(assign(s, 'npc_w1_guild_2', 'plain-1'), 'npc_w1_guild_2')).toBe('plain-1');
```

`packages/simulation/src/__tests__/world-npc.test.ts:116`

```diff
−     expect(post(s, 'npc_starter_1')).toBe('field-1');
+     expect(post(s, 'npc_w1_guild_0')).toBe('field-1');
```

`packages/simulation/src/__tests__/world-npc.test.ts:118`

```diff
−     expect(post(s, 'npc_starter_1')).toBe('field-1');
+     expect(post(s, 'npc_w1_guild_0')).toBe('field-1');
```

`packages/simulation/src/__tests__/world-npc.test.ts:121`

```diff
−     let s = held(); s = city(s, { type: 'BUILD', tileId: 'forest-1', typeId: 'logging' }); s = assign(s, 'npc_starter_3', 'forest-1');
+     let s = held(); s = city(s, { type: 'BUILD', tileId: 'forest-1', typeId: 'logging' }); s = assign(s, 'npc_w1_guild_2', 'forest-1');
```

`packages/simulation/src/__tests__/world-npc.test.ts:123`

```diff
−     expect(s.city.tiles[2].building?.level).toBe(2); expect(post(s, 'npc_starter_3')).toBe('forest-1');
+     expect(s.city.tiles[2].building?.level).toBe(2); expect(post(s, 'npc_w1_guild_2')).toBe('forest-1');
```

### packages/persistence/src/__tests__/character-life-save.test.ts

Rehydrate three generated Hall owner/profile pairs so a posted NPC, malformed indexed profile, accessor, class instance and mutation-detachment cases still reach their intended assertions. Set profile 2 attractiveness to the same concrete 50 before constructing invalid JSON 1e999 so the malformed value injection stays guaranteed.

Current ruleset envelope pins are handled in save/Gold inventory.

`packages/persistence/src/__tests__/character-life-save.test.ts:2 (insert before)`

```diff
+ import { NPC_TEST_KEYS, withNpcs } from '../../../core/src/__tests__/helpers/npcs.js';
```

`packages/persistence/src/__tests__/character-life-save.test.ts:7`

```diff
− const session = (seed = 0) => { const r = createCharacterLifeSession(seed, { ...structuredClone(DEFAULT_PLAYER_DRAFT), currentName: 'Ana' }); if (!r.success) throw Error(r.error.message); return r.value; };
+ const session = (seed = 0) => { const r = createCharacterLifeSession(seed, { ...structuredClone(DEFAULT_PLAYER_DRAFT), currentName: 'Ana' }); if (!r.success) throw Error(r.error.message); return withNpcs(r.value, NPC_TEST_KEYS); };
```

`packages/persistence/src/__tests__/character-life-save.test.ts:51`

```diff
−   const text = encode().replace('"attractiveness":50', '"attractiveness":1e999');
+   const s = session(); s.profiles[1].traits.attractiveness = 50;
+   const text = encode(s).replace('"attractiveness":50', '"attractiveness":1e999');
```

### packages/persistence/src/__tests__/game-store-suite.ts

The store suite constructs raw fake rows directly, independent of generated state. Replace the historical-style mock ID with a neutral test row identity. Exact write/read, deletion and failure rollback assertions stay.

`packages/persistence/src/__tests__/game-store-suite.ts:7`

```diff
−     const records = () => [row('session', 'meta'), row('npc_starter_1')];
+     const records = () => [row('session', 'meta'), row('npc_test_owner')];
```

### packages/persistence/src/__tests__/item-owner-import.test.ts

Use a generated real Hall owner plus the Player case so acceptance through validation, byte-identical checkpoint import and records remains real. Invalid unknown-owner cases still distinguish existing owner IDs.

`packages/persistence/src/__tests__/item-owner-import.test.ts:2 (insert before)`

```diff
+ import { NPC_TEST_KEYS, withNpcs } from '../../../core/src/__tests__/helpers/npcs.js';
```

`packages/persistence/src/__tests__/item-owner-import.test.ts:9`

```diff
−   const state = result.value;
+   const state = withNpcs(result.value, NPC_TEST_KEYS.slice(0, 1));
```

`packages/persistence/src/__tests__/item-owner-import.test.ts:29`

```diff
− it.each(['player', 'npc_starter_1'])('accepts real equipment owner %s through validation, import and byte-identical records', owner => {
+ it.each(['player', 'npc_w1_guild_0'])('accepts real equipment owner %s through validation, import and byte-identical records', owner => {
```

### packages/persistence/src/__tests__/item-records.test.ts

Retain real NPC owner content for exact `equipped:<id>:necklace` record addresses, reversed reconstruction, literal colon ID rename, and nondeterministic equip-order round trip. The current fixture folder/ruleset belongs to the save/Gold inventory.

`packages/persistence/src/__tests__/item-records.test.ts:2 (insert before)`

```diff
+ import { NPC_TEST_KEYS, withNpcs } from '../../../core/src/__tests__/helpers/npcs.js';
```

`packages/persistence/src/__tests__/item-records.test.ts:7–8`

```diff
− function life(){const r=createCharacterLifeSession(0,{...structuredClone(DEFAULT_PLAYER_DRAFT),currentName:'Ana'});if(!r.success)throw Error(r.error.message);return r.value;}
− function stocked(){const s=life();Object.assign(s.city.society!.items,{nextItemId:7,inventory:[{id:1,defId:'common-ring'},{id:2,defId:'rare-top'}],consumables:[{id:3,defId:'heal-potion-1'}],storage:[{item:{id:4,defId:'epic-top'},expiresWeek:4}],equipped:{player:{weapon:{id:5,defId:'common-weapon'}},npc_starter_1:{necklace:{id:6,defId:'rare-necklace'}}},materials:{iron:10}});return s;}
+ function life(){const r=createCharacterLifeSession(0,{...structuredClone(DEFAULT_PLAYER_DRAFT),currentName:'Ana'});if(!r.success)throw Error(r.error.message);return withNpcs(r.value,NPC_TEST_KEYS.slice(0,1));}
+ function stocked(){const s=life();Object.assign(s.city.society!.items,{nextItemId:7,inventory:[{id:1,defId:'common-ring'},{id:2,defId:'rare-top'}],consumables:[{id:3,defId:'heal-potion-1'}],storage:[{item:{id:4,defId:'epic-top'},expiresWeek:4}],equipped:{player:{weapon:{id:5,defId:'common-weapon'}},npc_w1_guild_0:{necklace:{id:6,defId:'rare-necklace'}}},materials:{iron:10}});return s;}
```

`packages/persistence/src/__tests__/item-records.test.ts:14`

```diff
−   {id:'item:5',value:{defId:'common-weapon',place:'equipped:player:weapon'}},{id:'item:6',value:{defId:'rare-necklace',place:'equipped:npc_starter_1:necklace'}},
+   {id:'item:5',value:{defId:'common-weapon',place:'equipped:player:weapon'}},{id:'item:6',value:{defId:'rare-necklace',place:'equipped:npc_w1_guild_0:necklace'}},
```

`packages/persistence/src/__tests__/item-records.test.ts:39`

```diff
−  s.city.society!.items.equipped['npc:one']=s.city.society!.items.equipped.npc_starter_1;delete s.city.society!.items.equipped.npc_starter_1;
+  s.city.society!.items.equipped['npc:one']=s.city.society!.items.equipped.npc_w1_guild_0;delete s.city.society!.items.equipped.npc_w1_guild_0;
```

`packages/persistence/src/__tests__/item-records.test.ts:44`

```diff
−  for(const [itemId,characterId] of [[3,'player'],[2,'npc_starter_1'],[1,'player']] as const){
+  for(const [itemId,characterId] of [[3,'player'],[2,'npc_w1_guild_0'],[1,'player']] as const){
```

### packages/persistence/src/__tests__/items-canonical.test.ts

Keep the valid Player+NPC equipment map, byte-identical location order, and command canonicalization independently of empty New Game.

`packages/persistence/src/__tests__/items-canonical.test.ts:2 (insert before)`

```diff
+ import { NPC_TEST_KEYS, withNpcs } from '../../../core/src/__tests__/helpers/npcs.js';
```

`packages/persistence/src/__tests__/items-canonical.test.ts:10`

```diff
−   const session = result.value;
+   const session = withNpcs(result.value, NPC_TEST_KEYS.slice(0, 1));
```

`packages/persistence/src/__tests__/items-canonical.test.ts:16`

```diff
−     equipped: { player: { top: { id: 4, defId: 'common-top' }, weapon: { id: 5, defId: 'common-weapon' } }, npc_starter_1: { weapon: { id: 6, defId: 'rare-weapon' } } },
+     equipped: { player: { top: { id: 4, defId: 'common-top' }, weapon: { id: 5, defId: 'common-weapon' } }, npc_w1_guild_0: { weapon: { id: 6, defId: 'rare-weapon' } } },
```

### packages/persistence/src/__tests__/items-rebuild-order.test.ts

Two generated real owners still populate the equipment map. The third remains necessary when generated IDs are replaced by `2`, `1`, and `__proto__` for the same real command and exact record round-trips. Retain equipment insertion-order/refusal, state validation, and byte assertions.

`packages/persistence/src/__tests__/items-rebuild-order.test.ts:2 (insert before)`

```diff
+ import { NPC_TEST_KEYS, withNpcs } from '../../../core/src/__tests__/helpers/npcs.js';
```

`packages/persistence/src/__tests__/items-rebuild-order.test.ts:10`

```diff
−   const s = result.value;
+   const s = withNpcs(result.value, NPC_TEST_KEYS);
```

`packages/persistence/src/__tests__/items-rebuild-order.test.ts:18–19`

```diff
−       npc_starter_1: { weapon: { id: 6, defId: 'rare-weapon' } },
−       npc_starter_2: { weapon: { id: 7, defId: 'rare-weapon' } },
+       npc_w1_guild_0: { weapon: { id: 6, defId: 'rare-weapon' } },
+       npc_w1_guild_1: { weapon: { id: 7, defId: 'rare-weapon' } },
```

`packages/persistence/src/__tests__/items-rebuild-order.test.ts:38`

```diff
−   ['equipment character order', items => { const e = items.equipped; items.equipped = { npc_starter_2: e.npc_starter_2, player: e.player, npc_starter_1: e.npc_starter_1 }; return items; }],
+   ['equipment character order', items => { const e = items.equipped; items.equipped = { npc_w1_guild_1: e.npc_w1_guild_1, player: e.player, npc_w1_guild_0: e.npc_w1_guild_0 }; return items; }],
```

### packages/persistence/src/__tests__/npc-life-records.test.ts

Generate an owned Hall NPC for real row corruption, precise StoreRecordError references, missing life, malformed life and full-history save/record reconstruction. Keep the legitimate `novice` cap premise explicit rather than depending on generated Sex-exp level. Version directory/parity changes are in save/Gold partition.

The nine current v12 fixture scenarios in the save/Gold proposal model unowned city economy. Assert their empty NPC arrays exactly. The full-history test independently exercises a real decoded NPC with own life and household fields and exact transport/record bytes.

`packages/persistence/src/__tests__/npc-life-records.test.ts:2 (insert before)`

```diff
+ import { NPC_TEST_KEYS, withNpcs } from '../../../core/src/__tests__/helpers/npcs.js';
```

`packages/persistence/src/__tests__/npc-life-records.test.ts:8`

```diff
− const life = () => { const r = createCharacterLifeSession(42, { ...structuredClone(DEFAULT_PLAYER_DRAFT), currentName: 'Synthetic Keeper' }); if (!r.success) throw Error(r.error.message); return r.value; };
+ const life = () => { const r = createCharacterLifeSession(42, { ...structuredClone(DEFAULT_PLAYER_DRAFT), currentName: 'Synthetic Keeper' }); if (!r.success) throw Error(r.error.message); return withNpcs(r.value, NPC_TEST_KEYS.slice(0, 1)); };
```

`packages/persistence/src/__tests__/npc-life-records.test.ts:14`

```diff
−   ['novice exp 101', (v: NpcLife) => { v.sexExp.hand.exp = 101; }],
+   ['novice exp 101', (v: NpcLife) => { v.sexExp.hand = { level: 'novice', exp: 101 }; }],
```

`packages/persistence/src/__tests__/npc-life-records.test.ts:27`

```diff
−   const row = rows.find(r => r.id === 'npc_starter_1')!;
+   const row = rows.find(r => r.id === 'npc_w1_guild_0')!;
```

`packages/persistence/src/__tests__/npc-life-records.test.ts:34`

```diff
−   expect((error as StoreRecordError).ref).toBe('characters:npc_starter_1');
+   expect((error as StoreRecordError).ref).toBe('characters:npc_w1_guild_0');
```

`packages/persistence/src/__tests__/npc-life-records.test.ts:47`

```diff
−   const npc = rows.find(r => r.id === 'npc_starter_1')!.value as { npc: { life?: NpcLife } };
+   const npc = rows.find(r => r.id === 'npc_w1_guild_0')!.value as { npc: { life?: NpcLife } };
```

`packages/persistence/src/__tests__/npc-life-records.test.ts:60 (insert before)`

```diff
+     expect(decoded.state.npcs).toStrictEqual([]);
```

`packages/persistence/src/__tests__/npc-life-records.test.ts:77 (insert before)`

```diff
+   expect(decoded.state.npcs).toHaveLength(1);
+   expect(Object.hasOwn(decoded.state.npcs[0], 'life')).toBe(true);
+   expect(Object.hasOwn(decoded.state.npcs[0], 'household')).toBe(true);
```

### packages/persistence/src/__tests__/session-records.test.ts

Retain exact 4-character-row count with three explicit generated NPCs and add the raw New Game one-player row count independently. The same malformed-row refs persist with real generated IDs. The current fixture folder is coordinated with save/Gold inventory.

`packages/persistence/src/__tests__/session-records.test.ts:2 (insert before)`

```diff
+ import { NPC_TEST_KEYS, withNpcs } from '../../../core/src/__tests__/helpers/npcs.js';
```

`packages/persistence/src/__tests__/session-records.test.ts:26–27`

```diff
− const session = () => { const r = createCharacterLifeSession(0, { ...structuredClone(DEFAULT_PLAYER_DRAFT), currentName: 'Ana' }); if (!r.success) throw Error(r.error.message); return r.value; };
− it('Player and 3 NPCs give 4 character records', () => expect(sessionToRecords('main', session()).filter(r => r.table === 'characters')).toHaveLength(4));
+ const newGame = () => { const r = createCharacterLifeSession(0, { ...structuredClone(DEFAULT_PLAYER_DRAFT), currentName: 'Ana' }); if (!r.success) throw Error(r.error.message); return r.value; };
+ const session = () => withNpcs(newGame(), NPC_TEST_KEYS);
+ it('New Game writes only the Player character record', () => expect(sessionToRecords('main', newGame()).filter(r => r.table === 'characters').map(r => r.id)).toEqual(['player']));
+ it('Player and 3 owned NPCs give 4 character records', () => expect(sessionToRecords('main', session()).filter(r => r.table === 'characters')).toHaveLength(4));
```

`packages/persistence/src/__tests__/session-records.test.ts:29–30`

```diff
−   const rows = sessionToRecords('main', session()); const npc = rows.find(r => r.id === 'npc_starter_1')!; npc.value = null;
−   try { recordsToSession(rows); throw Error('Expected invalid record rejection'); } catch (e) { expect(e).toBeInstanceOf(StoreRecordError); expect((e as StoreRecordError).ref).toBe('characters:npc_starter_1'); }
+   const rows = sessionToRecords('main', session()); const npc = rows.find(r => r.id === 'npc_w1_guild_0')!; npc.value = null;
+   try { recordsToSession(rows); throw Error('Expected invalid record rejection'); } catch (e) { expect(e).toBeInstanceOf(StoreRecordError); expect((e as StoreRecordError).ref).toBe('characters:npc_w1_guild_0'); }
```

`packages/persistence/src/__tests__/session-records.test.ts:57`

```diff
−  const rows=sessionToRecords('main',session()),npc=kind==='npc'||kind==='npc profile',id=npc?'npc_starter_1':'player';
+  const rows=sessionToRecords('main',session()),npc=kind==='npc'||kind==='npc profile',id=npc?'npc_w1_guild_0':'player';
```

`packages/persistence/src/__tests__/session-records.test.ts:63`

```diff
−  expectRecordRef(rows,npc?'characters:npc_starter_1':'characters:player');
+  expectRecordRef(rows,npc?'characters:npc_w1_guild_0':'characters:player');
```

## Historical inline fixture payloads

`packages/persistence/src/__tests__/society-only-save.test.ts`

Archived embedded checkpoint data retain their original starter IDs and historical validation purpose, byte-identical. Any current envelope-specific title or ruleset change is evaluated in the separate historical fixture lane.

- `packages/persistence/src/__tests__/society-only-save.test.ts:755` retains `              "id": "npc_starter_1",`.
- `packages/persistence/src/__tests__/society-only-save.test.ts:808` retains `              "id": "npc_starter_2",`.
- `packages/persistence/src/__tests__/society-only-save.test.ts:860` retains `              "id": "npc_starter_3",`.
- `packages/persistence/src/__tests__/society-only-save.test.ts:1000` retains `            "id": "npc_starter_1",`.
- `packages/persistence/src/__tests__/society-only-save.test.ts:1041` retains `            "id": "npc_starter_2",`.
- `packages/persistence/src/__tests__/society-only-save.test.ts:1082` retains `            "id": "npc_starter_3",`.
- `packages/persistence/src/__tests__/society-only-save.test.ts:2619` retains `              "id": "npc_starter_1",`.
- `packages/persistence/src/__tests__/society-only-save.test.ts:2672` retains `              "id": "npc_starter_2",`.
- `packages/persistence/src/__tests__/society-only-save.test.ts:2724` retains `              "id": "npc_starter_3",`.
- `packages/persistence/src/__tests__/society-only-save.test.ts:2864` retains `            "id": "npc_starter_1",`.
- `packages/persistence/src/__tests__/society-only-save.test.ts:2905` retains `            "id": "npc_starter_2",`.
- `packages/persistence/src/__tests__/society-only-save.test.ts:2946` retains `            "id": "npc_starter_3",`.

## Unchanged cases that mention NPCs

- `packages/simulation/src/__tests__/crisis-commands.test.ts:57` uses a payload-less `ASSIGN_NPC` to drive the pending-card guard. The guard runs before owner lookup.
- `packages/simulation/src/__tests__/lord-health.test.ts:68` sends enumerated command types to a dead-character command guard. The existing ASSIGN and UNASSIGN assertions need no starter row. B2.2 should add the equivalent MOVE guard case in new coverage.
- `packages/simulation/src/__tests__/society-life.test.ts:40–45` invokes a world-NPC wrapper with settlement-only wall and training commands and no post or named-NPC assertion.
- `packages/core/src/trial/__tests__/society-p7b.test.ts:36–68` validates numeric catalog bed capacities and malformed catalog beds using city state and remains independent of any resident.

