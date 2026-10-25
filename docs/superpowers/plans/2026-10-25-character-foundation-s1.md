# Character Foundation S1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an isolated `?mode=world-life` where the Player creates an adult character, the three existing NPC starters gain full profiles, and every character renders English short, long and detailed descriptions, with its own save format.

**Architecture:** A new pure-TypeScript module `packages/core/src/character/` adds profile types, catalogue constants, validators, a description renderer and session creation. The life session **composes** the existing NPC world session (`city`, `outside`, `npcs` unchanged) and adds `player` and `profiles`; existing city and post commands run on that base unchanged, so no simulation code changes. A new persistence format and UI slot keep the mode isolated from every existing mode and save.

**Tech Stack:** TypeScript 5, Svelte 5, Vitest 4, Playwright. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-10-25-character-life-design.md` (v0.2 + Review addendum + Addendum B, 536 lines, SHA256 `69d47af7f6c5ca27328a15086eccdc59e637959a77d1c61fe5c5e855765ab5b2`).

**Status:** PLAN ONLY. Implementation starts only after the parent releases it. Execution method (Claude Builder / Claude Tester / Codex Reviewer) is managed by the parent.

**Baseline:** `origin/main` = `e9f47f3cf0991731e71d6ab1fcae714ebad11981`, verified with `git fetch` on 2026-10-25. Before Task 1, re-run `git fetch origin && git rev-parse origin/main`; if it differs, stop and report drift.
**Branch:** `feat/character-foundation-s1` from `origin/main`.

## Global Constraints

- All game-facing text is English.
- `packages/core` stays pure TypeScript: no DOM, no UI imports (LAW-02; `npm run check:architecture`).
- The four axes and all existing stats are 0–100, finite (contractual).
- S1 adult-only scope: every named character in this mode has age 18–90 (proposed conservative scope; this is not the user's D2 answer).
- Adult-associated fields (`traits.intimacyKnowledge`, `private`) may exist only when age ≥ 18.
- No new dependency in any `package.json`.
- Existing modes (`weekly`, `tiles`, `population`, `world`, `world-npc`), their save formats and local slots behave exactly as at baseline.
- No `Math.random`; New Game seed comes from `crypto.getRandomValues`, as in `TileManagement.svelte`.
- Save size cap: `TILE_SAVE_MAX_BYTES` (1 MiB).
- Starter profile values (axes, appearance, places) are PROVISIONAL trial content; the UI says so.

## Scope

**In S1:**
- Shared adult character profile.
- Player creation.
- Profiles for the 3 existing starters.
- Short line, long paragraph and detailed profile rows.
- Catalogue storage for Identity (birthplace, origin and current location kept separate), Character Traits (4 axes), Personal Stats (existing), Appearance (with hair texture and an independently chosen build), Directed Relationships (existing NPC→Player 8 axes), and optional measurements and private adult metadata.
- New mode and save format.

**Not in S1 (deferred, not done):**
- Weekly life loop, small and major events, Skip.
- Interactions: the 5-per-week budget stays a fixed contract with no UI.
- Directed relation table and tiers (S2).
- Goals, Experience History storage (S2), memories writing.
- D1/D3 behaviour.
- `resolving` phase.
- Visual prompt projection (S5).
- Pricing, bonus, skill growth, medals, items, images.

**Catalogue groups in S1 storage:**
- Experience History is represented only by the existing `memories` array, still forced empty.
- Player Interaction has no stored state.
- Both are added with their slices, together with a save-schema version bump.

## File map (exact allowlist)

**Create:**
- `packages/core/src/character/types.ts` — profile, player and session types.
- `packages/core/src/character/catalog.ts` — limits, word lists, bands, labels, places, outfits.
- `packages/core/src/character/starter-profiles.ts` — 3 starter profiles, player presets, default draft.
- `packages/core/src/character/validate.ts` — `isCharacterProfile`, `isPlayerCharacter`, `isCharacterLifeSessionState`.
- `packages/core/src/character/describe.ts` — bands, short line, long paragraph, profile rows.
- `packages/core/src/character/session.ts` — draft validation, player creation, life session creation.
- `packages/core/src/character/__tests__/validate.test.ts`, `describe.test.ts`, `session.test.ts`.
- `packages/persistence/src/character-life-save.ts`.
- `packages/persistence/src/__tests__/character-life-save.test.ts`.
- `packages/ui/src/character-life-session.ts`.
- `packages/ui/src/__tests__/character-life-session.test.ts`.
- `packages/ui/src/CharacterLifeApp.svelte` — start screen, creation, game.
- `packages/ui/src/CharacterCreation.svelte`.
- `packages/ui/src/CharacterProfile.svelte`.
- `tests/e2e/character-life.spec.ts`.

**Modify:**
- `packages/core/src/world/npc.ts:31-53` — extract the per-character check into an exported `isNamedCharacterRecord`. Pure refactor; behaviour unchanged.
- `packages/core/src/index.ts` — export the character modules.
- `packages/persistence/src/index.ts` — export `character-life-save.js`.
- `packages/ui/src/main.ts` — route `world-life`.
- `packages/ui/src/TileManagement.svelte` — `lifeMode` and `initialLife` props, save/load branches, Player section.
- `packages/ui/src/WorldNpcPanel.svelte` — optional `profiles` prop rendering `CharacterProfile`.

**Docs (first commit):** this plan and the spec, copied unchanged into the branch.

No other file may change.

## Review Focus

1. **Imported decimals at band edges** (axis 60, 60.0001, 85; height 155): exactly one band each, never a crash. Owner: Task 2.
2. **Whitespace and over-long names** ("  ", " Ana", 65 characters, empty birth name): rejected with a field message; trimmed-equal rule as in `npc.ts:21`. Owner: Task 1 (validator) and Task 3 (draft messages).
3. **Double click on Create character, or Create pressed after Cancel:** exactly one session; Cancel discards the draft. Owner: Task 5.
4. **Life save in NPC-world mode, NPC-world save in life mode, import during Report:** rejected, nothing changes, other slots untouched. Owner: Tasks 4 and 6.
5. **A character under 18 or adult fields on a minor in an imported file:** rejected (S1 adult-only), never mapped to adult. Owner: Task 1.

---

### Task 1: Core profile types, catalogue and validators

**Files:**
- Create: `packages/core/src/character/types.ts`, `catalog.ts`, `validate.ts`, `__tests__/validate.test.ts`
- Modify: `packages/core/src/world/npc.ts:31-53`, `packages/core/src/index.ts`
- Docs: add this plan and the spec unchanged

**Interfaces:**
- Consumes: `NamedCharacter` (`domain/character.ts`), `hasWeeklyKeys`, `readDenseArray`, `isNpcWorldSessionState`, `NpcWorldSessionState`.
- Produces:

```ts
// types.ts
export type Pronouns = 'she' | 'he' | 'they';
export type Disclosure = 'known' | 'unknown';
export interface CharacterIdentity {
  birthName: string | null; label: string | null; pronouns: Pronouns;
  birthplaceId: string; origin: { regionId: string; upbringing: string }; currentLocationId: string;
  biography: string | null;
}
export interface CharacterTraitAxes { attractiveness: number; learningAptitude: number; warmth: number; intimacyKnowledge?: number }
export interface CharacterAppearance {
  presentation: 'feminine' | 'masculine' | 'androgynous'; skinTone: string; eyeColor: string;
  hair: { color: string; length: string; texture: string; style: string };
  face: { shape: string; features: string[] }; build: string; heightCm: number; weightKg: number;
  measurements?: { chestCm: number; waistCm: number; hipsCm: number; disclosure: Disclosure };
  outfit: string; // outfit id or 'role_default'
}
export interface PrivateAdultMetadata { intimateHistory: { value: 'none' | 'some'; disclosure: Disclosure } }
export interface CharacterProfile { id: string; identity: CharacterIdentity; traits: CharacterTraitAxes; appearance: CharacterAppearance; private?: PrivateAdultMetadata }
export interface PlayerCharacter { character: NamedCharacter; profile: CharacterProfile }
export interface CharacterLifeSessionState extends NpcWorldSessionState { player: PlayerCharacter; profiles: CharacterProfile[] }
// npc.ts
export function isNamedCharacterRecord(raw: unknown): raw is NamedCharacter;
// validate.ts
export function isCharacterProfile(raw: unknown, character: NamedCharacter): raw is CharacterProfile;
export function isPlayerCharacter(raw: unknown): raw is PlayerCharacter;
export function isCharacterLifeSessionState(raw: unknown): raw is CharacterLifeSessionState;
// catalog.ts
export const PLAYER_CHARACTER_ID = 'player';
export const CHARACTER_LIMITS: { nameMax: 64; labelMax: 40; biographyMax: 1000; ageMin: 18; ageMax: 90;
  heightCm: [140, 210]; weightKg: [35, 180]; chestCm: [60, 160]; waistCm: [45, 150]; hipsCm: [60, 170]; faceFeaturesMax: 2 };
export interface Word { id: string; word: string }
// Word lists, ids exactly as spec §6.2 + Addendum B:
// SKIN_TONES, EYE_COLORS, HAIR_COLORS, HAIR_LENGTHS (cropped, short, shoulder_length→"shoulder-length", long),
// HAIR_TEXTURES (straight→"", wavy, curly, coily), HAIR_STYLES (word = suffix: loose→"", tied_back→" tied back",
// braided→" in a braid", bun→" in a bun"), FACE_SHAPES (heart_shaped→"heart-shaped"),
// FACE_FEATURES (word = long phrase from spec §6.2), BUILDS ({ id, short, long } from spec §12.2),
// UPBRINGINGS (word = phrase from spec §12.2).
// REGIONS: northreach "Northreach", saltmere "Saltmere", ashfield "Ashfield", greywater "Greywater".
// PLACES (id, name, regionId): kestrel_ford "Kestrel Ford"/northreach, tidewall "Tidewall"/saltmere,
//   cinder_hollow "Cinder Hollow"/ashfield, millbrook "Millbrook"/greywater, haven "Haven"/null (current location only).
// PROFESSION_LABELS: occupation → word (security → "security officer"); PLAYER_PROFESSIONS excludes unassigned, governor.
// OUTFITS: role_default plus { id, phrase } list; ROLE_OUTFITS by building typeId and PROFESSION_OUTFITS from spec §6.5.
```

Rules for `isCharacterProfile`:
- Keys are exactly `id, identity, traits, appearance`, plus an optional `private`.
- `id === character.id`.
- Text fields are trimmed, non-empty and within their limits, or `null`.
- Every id comes from its list. `birthplaceId` is a place with a non-null region. `currentLocationId` is a place id.
- Height, weight and measurements are safe integers within their limits. Features: at most 2, unique.
- Axes are finite 0–100.
- If `character.age < 18`: no `intimacyKnowledge` and no `private`.

Rules for `isPlayerCharacter`:
- Keys are exactly `character, profile`; `isNamedCharacterRecord(character)` holds.
- `character.id === 'player'`; occupation is in `PLAYER_PROFESSIONS`; age is 18–90.
- Measurements and intimate-history disclosure, when present, are `known`.

Rules for `isCharacterLifeSessionState`:
- Keys are exactly the 5 session keys; `isNpcWorldSessionState` holds for `{ city, outside, npcs }`.
- `isPlayerCharacter(player)` holds.
- `profiles` is a dense array with `profiles[i]` valid for `npcs[i].character`, in the same order.
- Every NPC age is 18–90. No NPC id equals `'player'`.

- [ ] **Step 1: Docs commit.** Copy the spec and this plan unchanged into the branch; verify the spec SHA256 above.
- [ ] **Step 2: Failing tests** in `validate.test.ts`, with fixtures built by `createNpcWorldSession(0)` plus hand-written profiles:
  - `accepts a valid profile for each starter`;
  - `rejects profile id mismatch`;
  - `rejects axis -0.1, 100.1, NaN, Infinity`;
  - `accepts axis 0, 37.5, 100`;
  - `rejects name "  ", " Ana", 65-char label, 1001-char biography`;
  - `rejects unknown skinTone, three features, duplicate features`;
  - `rejects heightCm 139, 211, 170.5`;
  - `rejects birthplace "haven"`;
  - `rejects intimacyKnowledge or private when character.age is 17`;
  - `rejects player occupation "governor" and age 17`;
  - `rejects player measurements with disclosure "unknown"`;
  - `rejects session with profiles reordered, missing, extra, or extra top-level key`;
  - `rejects session with an NPC aged 17`;
  - `isWorldNpcList unchanged on existing npc.test fixtures`.
- [ ] **Step 3: Run** `npx vitest run packages/core/src/character packages/core/src/world`. Expected: new tests FAIL (modules missing); world tests PASS.
- [ ] **Step 4: Implement.**
  - Extract `isNamedCharacterRecord` from the loop body in `npc.ts`; the loop calls it, then keeps its id-uniqueness and post checks.
  - Add `types.ts`, `catalog.ts` and `validate.ts`.
  - Export the three new modules from `index.ts`.
- [ ] **Step 5: Run** `npx vitest run packages/core && npm run typecheck:core && npm run check:architecture`. Expected: all PASS; `npc.test.ts` unchanged and passing.
- [ ] **Step 6: Commit** `feat(core): character profile types, catalogue and validators`.

### Task 2: English description renderer

**Files:**
- Create: `packages/core/src/character/describe.ts`, `__tests__/describe.test.ts`
- Modify: `packages/core/src/index.ts`

**Interfaces:**
- Consumes: Task 1 types and catalogue.
- Produces:

```ts
export interface CharacterView { character: NamedCharacter; profile: CharacterProfile; role: 'player' | 'npc'; postBuildingName: string | null }
export type Axis = 'attractiveness' | 'learningAptitude' | 'warmth';
export function axisBand(axis: Axis, value: number): { short: string; long: string } | null; // null = neutral band
export function heightBand(cm: number): { short: string; long: string };
export function describeShort(view: CharacterView): string;
export function describeLong(view: CharacterView): string;
export function profileRows(view: CharacterView): { label: string; value: string }[];
```

Rules:
- Bands, templates and words follow spec §5, §6.3 and §12.2, with Addendum B hair `{length} {texture} {colour} hair{styleSuffix}`.
- Sentence 5 for `role: 'npc'`: "Trained as a/an {profession}, {subject} currently manages the {postBuildingName}." or "…, {subject} currently holds no post."
- Sentence 5 for `role: 'player'`: "{Subject} trained as a/an {profession} and now leads Haven." (proposed copy).
- `a`/`an` is chosen by the first letter (vowel → `an`).
- Pronouns: she/her/her, he/him/his, they/them/their. With `they`, the verbs read "They are …" and "They wear …"; sentence 2 uses "is"/"are" by pronoun.
- `profileRows` labels, in order: Name, Birth name (only if non-null and different), Label (only if non-null), Age, Profession, Current post, Birthplace, Origin, Current location, Height, Weight, Build, Skin, Hair, Eyes, Face, Measurements, Attractiveness, Learning Aptitude, Warmth.
  - Value formats: `"168 cm"`, `"58 kg"`, `"86 / 68 / 92 cm"`, `"Unknown"` when absent or undisclosed, and axes as `"66 (attractive)"` or `"50"` in the neutral band.
  - Private rows are **not** in `profileRows`; the UI renders them from `profile.private` and `traits.intimacyKnowledge` inside a collapsed section.

- [ ] **Step 1: Failing tests:**
  - `reproduces spec §12.4 Example A short and long exactly` (Clara data, texture straight, post "Food Processor").
  - `reproduces spec §12.4 Example B exactly` (Ruth, no post).
  - `every axis value maps to exactly one band`: loop 0..100 in steps of 0.25 plus 15, 40, 60, 60.0001, 85, 85.0001, 100; assert no throw and `axisBand('attractiveness', 60) === null`, `axisBand('attractiveness', 60.0001)?.short === 'attractive'`.
  - `heightBand(154).short === 'short'`, `heightBand(155).long === 'of average height'`, `heightBand(185).short === 'very tall'`.
  - `they pronouns read "They are" and "Their"`.
  - `player sentence 5 reads "trained as an advisor and now leads Haven."`.
  - `wavy texture renders "long wavy red hair in a braid"`.
  - `profileRows shows Measurements Unknown when disclosure unknown`.
  - `profileRows never contains intimacy or intimate history`.
- [ ] **Step 2: Run** `npx vitest run packages/core/src/character/__tests__/describe.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement** `describe.ts`. All band comparisons use the stored value with the spec's interval rules; no rounding.
- [ ] **Step 4: Run** the same command. Expected: PASS.
- [ ] **Step 5: Commit** `feat(core): English character description renderer`.

### Task 3: Starter profiles, player creation and life session

**Files:**
- Create: `packages/core/src/character/starter-profiles.ts`, `session.ts`, `__tests__/session.test.ts`
- Modify: `packages/core/src/index.ts`

**Interfaces:**
- Consumes: `createNpcWorldSession`, `createNamedCharacter`, Task 1 validators.
- Produces:

```ts
export interface PlayerDraft {
  currentName: string; birthName: string; label: string; pronouns: Pronouns; gender: 'female' | 'male' | 'other';
  age: string; profession: string; birthplaceId: string; regionId: string; upbringing: string; biography: string;
  traits: { attractiveness: string; learningAptitude: string; warmth: string; intimacyKnowledge: string | null };
  appearance: Omit<CharacterAppearance, 'heightCm' | 'weightKg' | 'measurements'> & {
    heightCm: string; weightKg: string; measurements: { chestCm: string; waistCm: string; hipsCm: string } | null };
  intimateHistory: 'none' | 'some' | null;
}
export const DEFAULT_PLAYER_DRAFT: PlayerDraft;           // empty name, age "25", they/other, androgynous, preset "practical"
export const PLAYER_APPEARANCE_PRESETS: readonly { id: 'practical' | 'scholarly' | 'rugged'; label: string; appearance: PlayerDraft['appearance'] }[];
export const STARTER_PROFILES: readonly CharacterProfile[]; // ids npc_starter_1..3, in npc order
export type DraftErrors = Partial<Record<string, string>>;
export function validatePlayerDraft(draft: PlayerDraft): DraftErrors; // {} when valid
export function createPlayerCharacter(draft: PlayerDraft): { success: true; value: PlayerCharacter } | { success: false; error: { code: 'INVALID_PLAYER'; message: string } };
export function createCharacterLifeSession(seed: unknown, draft: PlayerDraft): { success: true; value: CharacterLifeSessionState } | { success: false; error: { code: string; message: string } };
```

Values:
- Starter profiles use spec §12.4 for templates 1 and 2: `npc_starter_1` = Clara data with texture straight, birthplace `kestrel_ford`; `npc_starter_2` = Ruth data with texture straight, birthplace `tidewall`.
- `npc_starter_3`: region ashfield, birthplace `cinder_hollow`, upbringing city, feminine, 162 cm, 55 kg, build slim, skin fair, hair red/long/wavy/braided, eyes green, face round with high_cheekbones, outfit role_default, attractiveness 72, learning 48, warmth 45.
- All starters: `currentLocationId: 'haven'`, no measurements, no `private`, no `intimacyKnowledge`, `birthName`/`label`/`biography` null.
- Player record:
  - Character fields: `createNamedCharacter` with id `'player'`, name, gender, age and occupation from the draft; socialClass `'common'`; legalStatus `'citizen'`; default skills, needs, emotions, relationship and health.
  - Profile: `currentLocationId: 'haven'`; empty optional text becomes `null`.
  - A comment marks the unused `relationshipToPlayer` as: `// shortcut: Player keeps the shared NamedCharacter shape; relationshipToPlayer is unused until S2 directed relations replace it.`

Draft error messages (exact copy):
- `currentName`: "Enter a name of 1–64 characters without leading or trailing spaces."
- `age`: "Age must be a whole number from 18 to 90."
- `heightCm`: "Height must be a whole number from 140 to 210 cm."
- `weightKg`: "Weight must be a whole number from 35 to 180 kg."
- Measurements: "{Chest|Waist|Hips} must be a whole number from {min} to {max} cm."
- Axes: "{Axis} must be a number from 0 to 100."
- `label`: "Label can be at most 40 characters."
- `biography`: "Biography can be at most 1000 characters."
- `birthName`: same rule as name when non-empty.

- [ ] **Step 1: Failing tests:**
  - `DEFAULT_PLAYER_DRAFT is invalid only on currentName`.
  - `valid draft creates player with id "player", currentLocationId "haven", known disclosures`.
  - `draft age "17", "18.5", "abc", "91" gives the age message`; `draft height "139" gives the height message`.
  - `blank optional texts become null`.
  - `intimacyKnowledge null omits the field; "40" stores 40`.
  - `createCharacterLifeSession(0, valid) equals createNpcWorldSession(0) plus player and STARTER_PROFILES, passes isCharacterLifeSessionState`.
  - `same seed and draft give deep-equal sessions`.
  - `invalid draft returns INVALID_PLAYER and no session`.
  - `starter profiles validate against their characters`.
  - `describeShort for npc_starter_1 equals spec Example A short line except the drawn name`.
- [ ] **Step 2: Run** `npx vitest run packages/core/src/character/__tests__/session.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement** `starter-profiles.ts` and `session.ts`. Numeric draft strings parse with `Number()`; integers must pass `Number.isSafeInteger`; axes must be finite.
- [ ] **Step 4: Run** `npx vitest run packages/core && npm run typecheck:core`. Expected: PASS.
- [ ] **Step 5: Commit** `feat(core): starter profiles and player creation for character life`.

### Task 4: Save format and local slot

**Files:**
- Create: `packages/persistence/src/character-life-save.ts`, `__tests__/character-life-save.test.ts`, `packages/ui/src/character-life-session.ts`, `packages/ui/src/__tests__/character-life-session.test.ts`
- Modify: `packages/persistence/src/index.ts`

**Interfaces:**
- Consumes: `captureSaveData`, `WorldSaveFailure`, `TILE_SAVE_MAX_BYTES`, `isCharacterLifeSessionState`, `prepareNpcWorldSessionLoad`.
- Produces:

```ts
export const CHARACTER_LIFE_SAVE_FORMAT = 'haven.character-life-session.save';
export function serializeCharacterLifeSave(session: unknown): { success: true; text: string } | WorldSaveFailure;
export function deserializeCharacterLifeSave(text: unknown): { success: true; state: CharacterLifeSessionState } | WorldSaveFailure;
// ui
export const CHARACTER_LIFE_CHECKPOINT_KEY = 'haven.character-life-session.checkpoint.v1';
export function prepareCharacterLifeLoad(live: CharacterLifeSessionState, loaded: unknown, expectedRevision: number): { success: true; next: CharacterLifeSessionState } | { success: false; message: string };
export function saveLocalCharacterLife(session: unknown): { success: true; replaced: boolean } | { success: false; message: string };
export function readLocalCharacterLife(): { success: true; state: CharacterLifeSessionState } | { success: false; message: string };
```

- The envelope is `{ format, schemaVersion: 1, cityRulesetId: WORLD_SESSION_CITY_RULESET, state }` and mirrors `world-npc-session-save.ts:10-35`.
- Messages:
  - Wrong format or version: `INCOMPATIBLE_SAVE` "Not a Character Life checkpoint of a supported version. No migration was performed."
  - Invalid state: `INVALID_SAVE_STATE` "Checkpoint must contain a valid complete Character Life session in Planning."
- `prepareCharacterLifeLoad`:
  1. Capture once.
  2. Validate the whole capture with `isCharacterLifeSessionState`.
  3. Call `prepareNpcWorldSessionLoad` on the base.
  4. Attach `structuredClone` of the captured `player` and `profiles`.
  5. Re-validate the result.

- [ ] **Step 1: Failing tests (persistence):**
  - `round-trips a valid session`.
  - `rejects NPC-world, world and tile save texts with INCOMPATIBLE_SAVE`.
  - `rejects schemaVersion 2`.
  - `rejects report-phase session on export`.
  - `rejects state with player age 17, axis 101, NaN via JSON 1e999`.
  - `rejects text over 1 MiB`.
  - `serializeNpcWorldSessionSave rejects a life session (extra keys)`.
- [ ] **Step 2: Failing tests (ui helper; same stub pattern as `world-npc-session.test.ts:7-15`):**
  - `uses its own slot key`.
  - `save writes only its key; other keys keep "protected-bytes"`.
  - `read with empty slot returns the "No local checkpoint" message`.
  - `prepare rebases revision and carries player/profiles; live unchanged`.
  - `prepare rejects stale revision and an NPC-world session`.
- [ ] **Step 3: Run** `npx vitest run packages/persistence packages/ui`. Expected: new tests FAIL.
- [ ] **Step 4: Implement** both files and the export.
- [ ] **Step 5: Run** `npx vitest run && npm run typecheck`. Expected: PASS, including all existing persistence/ui tests unchanged.
- [ ] **Step 6: Commit** `feat(persistence): isolated character life save format and slot`.

### Task 5: Start screen and Character Creation

**Files:**
- Create: `packages/ui/src/CharacterLifeApp.svelte`, `CharacterCreation.svelte`, `tests/e2e/character-life.spec.ts`
- Modify: `packages/ui/src/main.ts`

**Interfaces:**
- Consumes: `DEFAULT_PLAYER_DRAFT`, `PLAYER_APPEARANCE_PRESETS`, `validatePlayerDraft`, `createCharacterLifeSession`, `describeShort`, `describeLong`, `readLocalCharacterLife`, `deserializeCharacterLifeSave`.
- Produces:
  - `CharacterCreation` props: `oncreate: (draft: PlayerDraft) => void`, `oncancel: () => void`.
  - `CharacterLifeApp`: no props; renders `TileManagement` with `world npcMode lifeMode initialLife={session} ruleset={POPULATION_TILE_RULESET}`.

UI contract (exact English):
- **Start screen:** heading "Character Life" (h1); buttons "New Game" and "Continue locally"; file input labelled "Import checkpoint"; text "Character profiles are TRIAL content. Weekly life events and Player interactions are not available yet."
- **Creation:** region "Character Creation" with tabs (`role="tab"`) Identity, Origin, Appearance, Traits, Review; buttons "Back", "Next", "Cancel"; "Create character" only on Review.
  - Field errors appear under each field and in an alert summary when Create is pressed.
  - "Create character" is disabled while errors exist and after the first activation.
- **Inputs:** numeric inputs are text inputs with `inputmode="numeric"` (stored as strings in the draft); the presets select is labelled "Appearance preset".
- **Private section:** a `<details>` with summary "Private (adult)", collapsed by default. It holds the checkbox "Record Intimacy Knowledge" with a number input, and the select "Intimate history" with options "Not recorded", "None", "Some".
- **Review tab:** live short line and long paragraph from a preview view (`role: 'player'`, `postBuildingName: null`).
- **Cancel:** returns to the start screen and discards the draft; the next New Game starts from `DEFAULT_PLAYER_DRAFT`.
- **Continue locally / Import from the start screen:** a valid life save opens the game with that session; a failure shows the message in an alert and stays on the start screen.

- [ ] **Step 1: Failing e2e tests** in `character-life.spec.ts`:
  - `start screen shows Character Life with New Game, Continue locally, Import`.
  - `Create character is disabled until a name is entered; age 17 shows the age message`.
  - `Next/Back keep entered values across tabs`.
  - `Cancel returns to start and a new draft is empty`.
  - `double click on Create character opens exactly one game` (assert one "Player" region and no alert).
  - `preset changes appearance fields; Review shows the short line`.
  - `Continue locally with empty slot shows "No local checkpoint in this browser yet. Choose Save locally first." and stays on start`.
- [ ] **Step 2: Run** `npm run test:smoke -- character-life`. Expected: FAIL (route missing).
- [ ] **Step 3: Implement** the route in `main.ts` (`mode === 'world-life'` mounts `CharacterLifeApp`; other branches unchanged), `CharacterLifeApp.svelte` and `CharacterCreation.svelte`.
- [ ] **Step 4: Run** `npm run test:smoke -- character-life && npm run typecheck:ui && npm run lint`. Expected: PASS.
- [ ] **Step 5: Commit** `feat(ui): character life start screen and character creation`.

### Task 6: Game integration, profiles and isolation

**Files:**
- Create: `packages/ui/src/CharacterProfile.svelte`
- Modify: `packages/ui/src/TileManagement.svelte`, `packages/ui/src/WorldNpcPanel.svelte`, `tests/e2e/character-life.spec.ts`

**Interfaces:**
- Consumes: Task 2 renderer, Task 4 helpers, existing `executeWorldNpcCityCommand` and `executeWorldNpcCommand` on the base `{ city, outside, npcs }`.
- Produces:
  - `CharacterProfile` props: `view: CharacterView`, `traitIds: string[]`, `relationship: Relationship8D | null`.
    - Tabs: Overview (short line + long paragraph), Profile (`profileRows` + collapsed "Private (adult)" section, adults only, showing "Intimacy Knowledge: {n | Not recorded}" and "Intimate history: {None | Some | Unknown | Not recorded}"), Stats (5 skills, health, needs, emotions), Relationship (NPC only: 8 axes toward the Player), History ("No memories yet.").
  - `TileManagement` new props: `lifeMode = false`, `initialLife: CharacterLifeSessionState | null = null`.
  - `WorldNpcPanel` new prop: `profiles: CharacterProfile[] | null = null`.

Integration rules:
- With `lifeMode`, TileManagement starts from `initialLife` instead of creating a session, and holds `player` and `profiles` alongside `state`, `outside` and `npcs`.
- City and post commands keep using the base session; `player` and `profiles` are never touched by them.
- Export, Save locally, Continue locally and Import use the Task 4 functions when `lifeMode`, checked **before** the existing `npcMode` branches. The download name is `haven-world-life-week-{n}.json`.
- Header h1 is "Character Life" when `lifeMode`.
- A region "Player" renders `CharacterProfile` with `role: 'player'`.
- Each NPC card renders `CharacterProfile` with `postBuildingName` = the post tile's `TRIAL_BUILDINGS` name, or `null`.

- [ ] **Step 1: Failing e2e tests:**
  - `after creation the Player region shows the entered name and short line; 3 NPC cards show profile tabs`.
  - `assigning starter 1 to field-1 changes its long text to "currently manages the Farm."`.
  - `Private section is collapsed by default`.
  - `Save locally, reload, Continue locally restores player name, profiles and posts`.
  - `Export then Import in a new game restores the session; file name matches /^haven-world-life-week-\d+\.json$/`.
  - `importing an NPC-world export into world-life is rejected with the Character Life incompatible message and nothing changes`.
  - `a world-life export imported in ?mode=world-npc is rejected; world-npc page shows no Player region`.
  - `life Save locally leaves haven.world-npc-session.checkpoint.v1 and haven.world-session.checkpoint.v1 unchanged`.
  - `Import during Report shows "Choose Plan next week before importing."`.
- [ ] **Step 2: Run** `npm run test:smoke -- character-life`. Expected: new tests FAIL.
- [ ] **Step 3: Implement** `CharacterProfile.svelte` and the `TileManagement` and `WorldNpcPanel` changes.
- [ ] **Step 4: Run the full gate:** `npm run lint && npm run typecheck && npm test && npm run check:architecture && npm run test:architecture && npm run build && npm run test:smoke`. Expected: all PASS, and every pre-existing unit and e2e test passes unchanged.
- [ ] **Step 5: Commit** `feat(ui): character life profiles in game with isolated saves`.

---

## Acceptance (S1)

1. `?mode=world-life`: start screen → create an adult Player → game with a Player profile and 3 NPC profiles, all in English.
2. Spec §12.4 examples are reproduced exactly by the renderer (Task 2).
3. Birthplace, origin and current location are stored and shown separately; hair texture and build are independent fields.
4. The four axes are 0–100. Private adult metadata is optional and collapsed, and exists only for adults; S1 has adults only.
5. Life saves round-trip. Foreign, old and corrupt saves are rejected without change; other slots stay untouched.
6. Existing modes, saves and tests are unchanged. CI `quality-gate` passes.

## Self-review

- **Spec coverage:** §4 → Tasks 1 and 3. §5 → Tasks 1 and 2. §6 → Tasks 1–3. §7 → Tasks 1, 5 and 6. §12 → Task 2. §14 creation and profile → Tasks 5 and 6. §15 → Task 4. Addendum B catalogue → Tasks 1–3. Deferred items are listed under Scope. §8, §9, §10, §11, §13 and B3 are out of S1 by design.
- **Type consistency:** `CharacterView`, `PlayerDraft`, `CharacterLifeSessionState` and `PLAYER_CHARACTER_ID` are used with the same names in Tasks 1–6.
- **Review Focus:** each line maps to a named test in its owner task.
- **Known spec issues carried, not resolved:** the content of S2–S5; D1–D3; event conflict sets; the open interaction balance question; the inconsistent `G*` tag on `age`.

## Execution handoff

Estimated 6 tasks. Plan complete and saved to `docs/superpowers/plans/2026-10-25-character-foundation-s1.md`. Execution method is already set by the parent (Claude Builder / Claude Tester / Codex Reviewer). Please review the plan and confirm it captures what you want before coding starts.
