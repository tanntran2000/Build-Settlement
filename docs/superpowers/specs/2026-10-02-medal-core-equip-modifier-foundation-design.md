# Medal Core, Loadout & Modifier Projection Foundation — Design Specification

**Status:** Written specification for Human review  
**Date:** 2026-10-02  
**Repository:** `tanntran2000/Build-Settlement`  
**Validated base commit:** `935ffdc112c817150efb41d7f964ad71446cf9b9`  
**Process class:** Architectural  
**Implementation language:** English-first for types, APIs, tests, comments, and technical documentation

## 1. Intent and Canonical Decisions

Build a pure deterministic Medal foundation in `packages/core` that lets a player own unlocked medals, equip at most three, enforce one equipped medal per category, replace medals atomically, unequip them directly, and project active Medal buffs into normalized modifier contributions.

Canonical product decisions:

- `bronze -> Tier I`, `silver -> Tier II`, `gold -> Tier III`.
- Bronze, Silver, and Gold in one achievement series are independent unlocks. Higher grades do not require or auto-unlock lower grades.
- All unlocked grades remain in the collection.
- Future Bronze/Silver/Gold challenges should be distinct gameplay challenges, not only larger thresholds. Challenge design/evaluation is deferred.
- The player has exactly 3 Medal slots.
- At most 1 Medal per slot and at most 1 equipped Medal per `MedalCategory`.
- Unlocking never auto-equips.
- Medal buffs are not timed: equipped = active; unequipped = inactive.
- The earlier 2–4 week Medal-duration idea is superseded.
- Existing City Effects are not superseded and keep their current fixed 3-week lifecycle in this work.

## 2. Scope and Non-Goals

This design includes Medal definitions, registry/state validation, 3-slot loadout state, slot eligibility queries, atomic equip/replace, direct unequip, deterministic modifier projection, JSON-serializability characterization, and City Effect regression protection.

This design does **not** implement:

- Achievement Challenge Engine or challenge catalog.
- Medal artwork, Collection UI, Equip popup UI, or Weekly Report UI.
- Resource-bar UI such as `Food [42/100 +9]`.
- Final Medal balance values.
- Modifier composition across Medal/Event/Status/Crisis.
- Application of Medal modifiers to resources, statuses, or workforce.
- Persistence schema integration or migration.
- `ActiveCityEffect` redesign or City Effect timing changes.

If implementation appears to require a non-goal above, the Work Package must HOLD for scope review rather than silently expand.

## 3. Data Contracts

Illustrative English-first contracts:

```ts
export type MedalId = string;
export type MedalGrade = "bronze" | "silver" | "gold";
export type MedalTier = 1 | 2 | 3;

export type MedalCategory =
  | "happiness"
  | "food"
  | "security"
  | "goods"
  | "corruption"
  | "workforce";

export type ModifierTarget =
  | "food_output"
  | "happiness"
  | "security"
  | "goods"
  | "corruption"
  | "workforce";

export interface MedalModifier {
  target: ModifierTarget;
  modifierBps: number;
}

export interface MedalDefinition {
  id: MedalId;
  category: MedalCategory;
  grade: MedalGrade;
  tier: MedalTier;
  modifier: MedalModifier;
}

export type MedalSlotIndex = 0 | 1 | 2;

export interface PlayerMedalState {
  unlockedMedalIds: MedalId[];
  equippedSlots: [MedalId | null, MedalId | null, MedalId | null];
}
```

`category` controls equip exclusivity. `modifier.target` identifies the future gameplay dimension that consumes the buff. They are separate concepts and need not always have identical names.

For this foundation, one Medal has exactly one modifier. Multi-effect Medals are deferred.

### Grade/Tier invariant

```text
bronze <-> 1
silver <-> 2
gold   <-> 3
```

Any mismatch is invalid.

### Modifier magnitude

Medals are reward sources, so `modifierBps` must be a positive finite safe integer. Basis points avoid floating-point percentage storage (`100 bps = 1%`, `1250 bps = 12.5%`). Medal Core imposes no final gameplay balance cap and must not inherit City Effect's ±500 bps cap.

A positive Medal contribution means a beneficial contribution for the target consumer. Medal Core does not directly mutate raw status values. Therefore a future consumer such as corruption must explicitly define how a positive contribution maps to a beneficial outcome before integration.

## 4. State Invariants

A valid `PlayerMedalState` must satisfy all of these:

1. `unlockedMedalIds` contains unique IDs only.
2. Every unlocked ID exists in the supplied Medal registry.
3. `equippedSlots` has exactly three positions.
4. Every non-null equipped ID exists in the registry.
5. Every equipped Medal is unlocked.
6. The same Medal ID cannot occupy multiple slots.
7. No two equipped Medals share the same `MedalCategory`.

The collection may contain Happiness Bronze, Happiness Silver, and Happiness Gold simultaneously. Category uniqueness applies only to the equipped loadout.

## 5. Loadout Query and Atomic Transitions

UI must consume core eligibility results rather than reproduce equip rules.

```ts
export type MedalSlotAction = "equip" | "replace" | "locked";

export interface MedalSlotOption {
  slotIndex: MedalSlotIndex;
  action: MedalSlotAction;
}

export function getMedalSlotOptions(
  state: PlayerMedalState,
  registry: readonly MedalDefinition[],
  selectedMedalId: MedalId
): MedalSlotOption[];
```

Rules:

- selected Medal must exist, be unlocked, and not already be equipped;
- if its category is not equipped, empty slots are `equip` and occupied slots are `replace`;
- if its category is already equipped, only that existing same-category slot is `replace`; every other slot, including empty slots, is `locked`;
- output order is internal slot index `0 -> 1 -> 2`, displayed by UI as Slot 1 -> Slot 2 -> Slot 3.

Equip and replace use one atomic primitive:

```ts
export function assignMedalToSlot(
  state: PlayerMedalState,
  registry: readonly MedalDefinition[],
  medalId: MedalId,
  slotIndex: MedalSlotIndex
): PlayerMedalState;
```

- empty eligible target => Equip;
- occupied eligible target => Replace;
- invalid target/category/ownership => reject;
- selected Medal already equipped anywhere => reject;
- caller-owned input is never mutated;
- replacement has no observable intermediate empty state.

Direct unequip uses:

```ts
export function unequipMedalFromSlot(
  state: PlayerMedalState,
  slotIndex: MedalSlotIndex
): PlayerMedalState;
```

- occupied slot => becomes `null`;
- empty slot => reject;
- caller-owned input remains unchanged.

This supports the approved UX: selecting an unequipped Medal opens Slot 1/2/3 with Equip/Replace/Locked states and changes state only after confirmation; selecting an already-equipped Medal opens detail with direct `Unequip`.

Moving an equipped Medal between slots is deferred and must not happen implicitly.

## 6. Modifier Projection and Integration Boundary

Equipped Medals project derived contributions:

```ts
export interface ModifierContribution {
  source: "medal";
  sourceId: MedalId;
  target: ModifierTarget;
  modifierBps: number;
}

export function projectEquippedMedalModifiers(
  state: PlayerMedalState,
  registry: readonly MedalDefinition[]
): ModifierContribution[];
```

Projection rules:

- validate registry and state first;
- each non-null equipped slot yields exactly one contribution;
- null slots yield none;
- contribution order is deterministic by slot `0 -> 1 -> 2`;
- projection never mutates state, resources, statuses, workforce, or City Effects;
- unequipping removes that contribution immediately on the next projection;
- contributions are derived data and are never persisted.

Medals and City Effects are different modifier sources with different lifecycles. City Effects remain timed; Medals remain active while equipped. Future composition may combine sources, but this WP does not implement that engine.

Architectural direction for future composition is additive basis points on the same target, applied once to the base value rather than compounded source-by-source. Example only:

```text
base = 8
Medal = +1250 bps
Event = -500 bps
net = +750 bps
effective = floor(base * (10000 + net) / 10000)
```

This direction supports the future UI example:

```text
Farm Field base Food output = +8
Medal bonus = +1
net weekly Food output = +9
Food [42/100 +9]
```

The UI and composition math are not part of this WP.

## 7. City Effect Compatibility

At the validated base commit, City Effects use `ActiveCityEffect.remainingWeeks` and `CITY_EFFECT_DURATION_WEEKS = 3` with their own magnitude rules.

Medal Core must not:

- change `CITY_EFFECT_DURATION_WEEKS`;
- add Medal as a timed `CityEffectSource`;
- reuse `remainingWeeks` for Medal state;
- force Medal magnitude through the City Effect ±500 bps cap;
- change City Effect reconciliation semantics.

If Medal implementation appears to require changes to `packages/core/src/status/effects.ts`, the implementation must HOLD for architecture review.

## 8. Validation, Errors, and Persistence Boundary

Expected validation boundaries are equivalent to:

```ts
validateMedalDefinition(...)
validateMedalRegistry(...)
validatePlayerMedalState(...)
```

Definition validation requires a non-empty ID, supported category/grade/tier/target, exact grade-tier mapping, and positive finite safe-integer `modifierBps`. Registry validation rejects duplicate Medal IDs. Multiple definitions may share a category.

Contract violations use `RangeError`, consistent with current Foundation-style domain validation. Invalid operations are all-or-nothing: validate -> construct candidate -> validate candidate -> return next state. On failure, caller-owned input remains unchanged.

Persistence integration is explicitly deferred. The current repo separates `WorldSaveData` and `PlayerProfileData`, and profile data already has an `achievements` field. This design does not decide whether Medal ownership/loadout is world-scoped, profile-scoped, cross-world, or New Game+ meta-progression.

Therefore this WP must not modify persistence schema versions, migrations, or `packages/persistence/src/schema.ts`.

`PlayerMedalState` must still be plain JSON-serializable and support characterization of `state -> stringify -> parse -> validate -> equivalent state`. `ModifierContribution[]` is always recomputed and never persisted.

## 9. Acceptance Criteria

The later implementation plan must include tests proving at least:

| ID | Required evidence |
|---|---|
| M01 | Bronze->I, Silver->II, Gold->III validate |
| M02 | Grade/tier mismatch rejects |
| M03 | Duplicate Medal ID rejects |
| M04 | Zero, negative, non-finite, or non-integer modifier rejects |
| M05 | Multiple grades of one category may all be unlocked |
| M06 | Exactly three equipped slots are required |
| M07 | Different categories may be equipped together |
| M08 | Two equipped Medals of one category reject |
| M09 | Unlocked Medal equips into eligible empty slot |
| M10 | Locked/unowned Medal rejects |
| M11 | No same-category equipped => empty=Equip, occupied=Replace |
| M12 | Same category equipped => only that slot=Replace, all others=Locked |
| M13 | Same-category replacement is atomic |
| M14 | Invalid replacement leaves original state unchanged |
| M15 | Already-equipped Medal cannot be assigned to another slot |
| M16 | Unequip occupied slot => `null` |
| M17 | Unequip empty slot rejects |
| M18 | Only equipped Medals generate contributions |
| M19 | Contribution order follows Slot 1->2->3 |
| M20 | Unequip removes contribution on reprojection |
| M21 | Projection does not mutate resource/status/workforce state |
| M22 | JSON round-trip retains equivalent valid Medal state |
| M23 | Existing fixed-3-week City Effect behavior remains unchanged |
| M24 | Persistence schema/migration files remain untouched |
| M25 | Identical inputs produce identical query/transition/projection outputs |

Test Medal names/values are fixtures only, not canonical content or final balance.

## 10. Guardrails, Deferred Work, and Success Condition

Guardrails for the later WP:

- Medal core remains pure deterministic TypeScript.
- UI consumes core rules and does not mutate business state directly.
- Invalid commands are atomic/all-or-nothing.
- No new runtime dependency is justified by this feature.
- No persistence migration or City Effect redesign is bundled into this feature.
- Human retains merge authority.
- After two unsuccessful fix iterations on the same issue, HOLD under the project anti-loop rule.

Deferred follow-up design cycles:

1. Achievement Challenge Engine.
2. Distinct Bronze/Silver/Gold mission design for every achievent series.
3. Medal Collection and Equip UI.
4. Modifier Composition Engine.
5. Resource/status/workforce integration.
6. Resource bar and Weekly Report presentation.
7. Persistence ownership decision and migration.
8. Final Medal balance and content catalog.

Success means Medal ownership/loadout and modifier projection can be understood, validated, tested, and evolved independently of Achievement evaluation, City Effect timing, persistence schema, and consumer math. A future subsystem can consume `ModifierContribution[]` without understanding Medal equip/replace/unequip internals.
