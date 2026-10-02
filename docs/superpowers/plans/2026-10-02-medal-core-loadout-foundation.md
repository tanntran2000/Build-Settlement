# Medal Core Loadout & Modifier Projection Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Work Order:** `WP-HAVEN-MEDAL-CORE-FOUNDATION-01`  
**Role:** `ANTIGRAVITY_BUILDER_SINGLE_WRITER`  
**Code Base SHA:** `935ffdc112c817150efb41d7f964ad71446cf9b9`  
**Approved Spec Commit:** `56a3ad853f4ce182b1724b6251807adc8298047e`  
**Recommended implementation branch:** `feat/medal-core-loadout-foundation-01`

**Goal:** Build the deterministic Medal Core that validates medal definitions and player medal state, exposes three-slot eligibility, performs atomic equip/replace/unequip transitions, and projects equipped medals into normalized modifier contributions.

**Architecture:** Add an isolated `packages/core/src/medal/` subsystem with focused type, validation, loadout, and projection modules. Medal state remains plain data; transitions return new state rather than mutate caller-owned input; projection is derived data only. Existing City Effects, persistence, UI, resource/workforce/status consumers, and achievement challenge evaluation remain untouched.

**Tech Stack:** TypeScript 5.7, Vitest 2.1, Node 20 CI, npm workspaces, ESM imports using `.js` suffixes.

**Spec:** `docs/superpowers/specs/2026-10-02-medal-core-equip-modifier-foundation-design.md` at commit `56a3ad853f4ce182b1724b6251807adc8298047e`.

## Global Constraints

- Implementation code, APIs, tests, comments, and technical naming are English-first.
- Medal Core stays inside `packages/core` and remains pure deterministic TypeScript.
- Exactly three equip slots exist; internal indices are `0 | 1 | 2`.
- At most one equipped Medal per `MedalCategory`.
- Bronze/Silver/Gold are independent unlocks; collection may contain multiple grades of one category.
- Grade/tier mapping is exact: `bronze <-> 1`, `silver <-> 2`, `gold <-> 3`.
- Medal `modifierBps` is a positive safe integer; do not inherit the City Effect ±500 bps cap.
- One Medal projects exactly one modifier in this WP.
- Invalid domain input/operations throw `RangeError`.
- State-changing functions are all-or-nothing and must not mutate caller-owned input.
- Medal buffs are active while equipped and have no week countdown.
- Do not modify `packages/core/src/status/effects.ts`, City Effect timing/reconciliation, or `CityEffectSource`.
- Do not modify `packages/persistence/**`, persistence schema versions, or migrations.
- Do not modify `packages/core/src/index.ts`; root package public-surface integration is deferred.
- Do not modify `docs/INTERNAL_PROGRESS_TRACKER.md` during G2; reconcile tracker only after Human merge/post-merge verification.
- Do not add runtime dependencies.
- Achievement Challenge Engine/content, Medal UI, Modifier Composition, resource/status/workforce integration, persistence ownership, and final balance are out of scope.
- Test fixture Medal names and percentages are non-canonical test data.
- Human retains merge authority.
- After two unsuccessful fix iterations on the same issue, HOLD and report to Human.

## Preflight and Branch Gate

Before Task 1, the Builder must run:

```bash
git fetch origin
git rev-parse origin/main
git show --no-patch --format=%H 56a3ad853f4ce182b1724b6251807adc8298047e
git diff --name-only 935ffdc112c817150efb41d7f964ad71446cf9b9..56a3ad853f4ce182b1724b6251807adc8298047e
```

Expected:

- `origin/main` is exactly `935ffdc112c817150efb41d7f964ad71446cf9b9`.
- approved spec commit resolves exactly to `56a3ad853f4ce182b1724b6251807adc8298047e`.
- the base-to-spec diff contains only:
  `docs/superpowers/specs/2026-10-02-medal-core-equip-modifier-foundation-design.md`.

If any expectation fails, **HOLD**. Do not rebase, broaden scope, or silently substitute a newer base.

Create the implementation branch from the approved spec commit so the approved spec travels with the code:

```bash
git switch -c feat/medal-core-loadout-foundation-01 56a3ad853f4ce182b1724b6251807adc8298047e
```

## Allowed G2 File Surface

Create only:

- `packages/core/src/medal/types.ts`
- `packages/core/src/medal/validation.ts`
- `packages/core/src/medal/loadout.ts`
- `packages/core/src/medal/projection.ts`
- `packages/core/src/medal/index.ts`
- `packages/core/src/medal/__tests__/validation.test.ts`
- `packages/core/src/medal/__tests__/loadout.test.ts`
- `packages/core/src/medal/__tests__/projection.test.ts`

The approved spec file already exists from the branch base and must not be edited during G2.

Any need to touch another file is a **HOLD** condition pending Human scope review.

## Review Focus

These five failure modes are easy to miss even when the happy path works. Each is pinned by a test in the owning task.

1. **Malformed runtime containers** — null, arrays where objects are required, malformed registries/states must throw `RangeError`, not incidental `TypeError`. Task 1 pins this.
2. **Unsafe numeric modifier input** — `NaN`, infinities, fractions, zero/negative values, and values above `Number.MAX_SAFE_INTEGER` must reject. Task 1 pins this.
3. **Returned-state aliasing** — successful assign/unequip must return fresh arrays so later mutation of the returned state cannot mutate the original state. Task 3 pins this.
4. **Runtime-invalid slot indices** — values such as `-1`, `3`, `1.5`, and `NaN` passed through JavaScript/casts must throw `RangeError`. Task 3 pins this.
5. **Registry-order dependence** — modifier projection order must be slot order `0 -> 1 -> 2`, even if registry definition order changes. Task 4 pins this.

---

### Task 1: Canonical Medal Types and Validation Boundaries

**Files:**
- Create: `packages/core/src/medal/types.ts`
- Create: `packages/core/src/medal/validation.ts`
- Create: `packages/core/src/medal/__tests__/validation.test.ts`

**Interfaces:**
- Consumes: no new subsystem interfaces.
- Produces:
  - `MedalId = string`
  - `MedalGrade = "bronze" | "silver" | "gold"`
  - `MedalTier = 1 | 2 | 3`
  - `MedalCategory = "happiness" | "food" | "security" | "goods" | "corruption" | "workforce"`
  - `ModifierTarget = "food_output" | "happiness" | "security" | "goods" | "corruption" | "workforce"`
  - `MedalModifier`
  - `MedalDefinition`
  - `MedalSlotIndex = 0 | 1 | 2`
  - `PlayerMedalState`
  - `MedalSlotAction = "equip" | "replace" | "locked"`
  - `MedalSlotOption`
  - `ModifierContribution`
  - `validateMedalDefinition(definition: unknown): asserts definition is MedalDefinition`
  - `validateMedalRegistry(registry: unknown): asserts registry is readonly MedalDefinition[]`
  - `validatePlayerMedalState(state: unknown, registry: readonly MedalDefinition[]): asserts state is PlayerMedalState`

- [ ] **Step 1: Write failing validation tests for M01–M08 and M22**

Create named tests that assert:

```ts
expect(() => validateMedalDefinition(bronzeTier1)).not.toThrow();
expect(() => validateMedalDefinition(silverTier2)).not.toThrow();
expect(() => validateMedalDefinition(goldTier3)).not.toThrow();

expect(() => validateMedalDefinition({ ...bronzeTier1, tier: 3 })).toThrow(RangeError);
expect(() => validateMedalRegistry([sameIdA, sameIdB])).toThrow(RangeError);

for (const modifierBps of [0, -1, NaN, Infinity, -Infinity, 1.5, Number.MAX_SAFE_INTEGER + 1]) {
  expect(() => validateMedalDefinition(definitionWith(modifierBps))).toThrow(RangeError);
}

expect(() => validatePlayerMedalState(
  stateWithUnlocked(["happiness-bronze", "happiness-silver", "happiness-gold"]),
  registry
)).not.toThrow();

expect(() => validatePlayerMedalState(stateWithTwoSlots, registry)).toThrow(RangeError);
expect(() => validatePlayerMedalState(stateWithFourSlots, registry)).toThrow(RangeError);
expect(() => validatePlayerMedalState(stateWithDifferentEquippedCategories, registry)).not.toThrow();
expect(() => validatePlayerMedalState(stateWithDuplicateEquippedCategory, registry)).toThrow(RangeError);

const parsed = JSON.parse(JSON.stringify(validState));
expect(() => validatePlayerMedalState(parsed, registry)).not.toThrow();
expect(parsed).toEqual(validState);
```

Also pin the Review Focus cases:

- whitespace-only Medal ID rejects;
- unsupported category/grade/target supplied through casts rejects;
- `null`, array, and malformed object definitions reject with `RangeError`;
- non-array registry rejects with `RangeError`;
- duplicate unlocked IDs, unknown unlocked IDs, unknown equipped IDs, and duplicate equipped Medal IDs reject.

- [ ] **Step 2: Run the validation test to verify RED**

Run:

```bash
npx vitest run packages/core/src/medal/__tests__/validation.test.ts
```

Expected: FAIL because the Medal modules do not exist yet.

- [ ] **Step 3: Implement the exact data contracts in `types.ts`**

Use the approved spec names and literals exactly. `ModifierContribution` is:

```ts
export interface ModifierContribution {
  source: "medal";
  sourceId: MedalId;
  target: ModifierTarget;
  modifierBps: number;
}
```

Do not add challenge fields, durations, multiple modifiers, persistence fields, display strings, or UI metadata.

- [ ] **Step 4: Implement the three validation boundaries in `validation.ts`**

Required behavior:

- all malformed/domain-invalid inputs throw `RangeError`;
- `validateMedalRegistry` validates every definition before duplicate-ID checking;
- `validatePlayerMedalState` validates the registry, then all seven state invariants;
- use `Number.isSafeInteger` for `modifierBps`;
- exact grade/tier mapping only;
- no balance cap beyond positive safe integer.

- [ ] **Step 5: Run validation tests and core typecheck**

Run:

```bash
npx vitest run packages/core/src/medal/__tests__/validation.test.ts
npm run typecheck:core
```

Expected: both exit 0; all Task 1 tests PASS.

- [ ] **Step 6: Commit Task 1**

```bash
git add packages/core/src/medal/types.ts         packages/core/src/medal/validation.ts         packages/core/src/medal/__tests__/validation.test.ts
git commit -m "feat(core): add medal contracts and validation"
```

---

### Task 2: Slot Eligibility Query

**Files:**
- Create: `packages/core/src/medal/loadout.ts`
- Create: `packages/core/src/medal/__tests__/loadout.test.ts`

**Interfaces:**
- Consumes:
  - Task 1 Medal types.
  - `validateMedalRegistry(...)`
  - `validatePlayerMedalState(...)`
- Produces:
  - `getMedalSlotOptions(state: PlayerMedalState, registry: readonly MedalDefinition[], selectedMedalId: MedalId): MedalSlotOption[]`

- [ ] **Step 1: Write failing eligibility tests for M10–M12 and deterministic query behavior**

Pin these exact behaviors:

```ts
expect(getMedalSlotOptions(stateWithoutSecurity, registry, "security-gold")).toEqual([
  { slotIndex: 0, action: "replace" },
  { slotIndex: 1, action: "replace" },
  { slotIndex: 2, action: "equip" },
]);

expect(getMedalSlotOptions(stateWithHappinessBronzeInSlot0, registry, "happiness-gold")).toEqual([
  { slotIndex: 0, action: "replace" },
  { slotIndex: 1, action: "locked" },
  { slotIndex: 2, action: "locked" },
]);
```

Also assert:

- selected unknown Medal ID throws `RangeError`;
- selected locked/unowned Medal throws `RangeError`;
- selected Medal already equipped throws `RangeError`;
- returned options are always ordered `0, 1, 2`;
- two repeated calls with identical input are deeply equal;
- runtime-invalid states are rejected through Task 1 validation.

- [ ] **Step 2: Run the loadout test to verify RED**

Run:

```bash
npx vitest run packages/core/src/medal/__tests__/loadout.test.ts
```

Expected: FAIL because `getMedalSlotOptions` does not exist.

- [ ] **Step 3: Implement `getMedalSlotOptions(...)` in `loadout.ts`**

Implementation constraints:

- validate registry/state first;
- resolve the selected definition by ID;
- reject unknown, unowned, or already-equipped selected Medal;
- if selected category already exists in the loadout, only that exact slot is `replace`;
- otherwise empty slots are `equip` and occupied slots are `replace`;
- iterate slots by index `0 -> 1 -> 2`; do not derive output order from registry iteration.

- [ ] **Step 4: Run Task 2 tests and core typecheck**

```bash
npx vitest run packages/core/src/medal/__tests__/loadout.test.ts
npm run typecheck:core
```

Expected: exit 0.

- [ ] **Step 5: Commit Task 2**

```bash
git add packages/core/src/medal/loadout.ts         packages/core/src/medal/__tests__/loadout.test.ts
git commit -m "feat(core): add medal slot eligibility"
```

---

### Task 3: Atomic Equip, Replace, and Direct Unequip

**Files:**
- Modify: `packages/core/src/medal/loadout.ts`
- Modify: `packages/core/src/medal/__tests__/loadout.test.ts`

**Interfaces:**
- Consumes:
  - `getMedalSlotOptions(...)`
  - Task 1 Medal types/validators.
- Produces:
  - `assignMedalToSlot(state: PlayerMedalState, registry: readonly MedalDefinition[], medalId: MedalId, slotIndex: MedalSlotIndex): PlayerMedalState`
  - `unequipMedalFromSlot(state: PlayerMedalState, slotIndex: MedalSlotIndex): PlayerMedalState`

- [ ] **Step 1: Add failing transition tests for M09 and M13–M17**

Pin:

- unlocked Medal equips into an eligible empty slot;
- same-category Medal atomically replaces the existing same-category slot;
- invalid replacement into a `locked` slot throws `RangeError`;
- invalid replacement leaves the original state deeply unchanged;
- already-equipped Medal cannot be assigned to another slot;
- occupied slot unequips to `null`;
- empty-slot unequip throws `RangeError`.

Atomicity assertions must capture the original state before the operation and verify it remains deeply equal after both success and failure.

- [ ] **Step 2: Add Review Focus tests for slot validation and object isolation**

Pin runtime-invalid slot values using casts:

```ts
for (const invalidSlot of [-1, 3, 1.5, NaN]) {
  expect(() => assignMedalToSlot(state, registry, "security-gold", invalidSlot as MedalSlotIndex))
    .toThrow(RangeError);
  expect(() => unequipMedalFromSlot(state, invalidSlot as MedalSlotIndex))
    .toThrow(RangeError);
}
```

For a successful assign and unequip, assert:

```ts
expect(next).not.toBe(state);
expect(next.unlockedMedalIds).not.toBe(state.unlockedMedalIds);
expect(next.equippedSlots).not.toBe(state.equippedSlots);
```

Then mutate the returned arrays in the test and verify the original state is unchanged.

Also call `assignMedalToSlot` twice with the same original input and arguments, and call `unequipMedalFromSlot` twice with the same original input and slot. Each pair of returned states must be deeply equal, proving the transition portion of M25.

- [ ] **Step 3: Run the loadout test to verify RED**

```bash
npx vitest run packages/core/src/medal/__tests__/loadout.test.ts
```

Expected: FAIL on missing transition functions.

- [ ] **Step 4: Implement `assignMedalToSlot(...)`**

Requirements:

- validate `slotIndex` at runtime as integer 0–2;
- use `getMedalSlotOptions` as the single eligibility source instead of duplicating category rules;
- reject target action `locked`;
- construct fresh `unlockedMedalIds` and fresh three-element `equippedSlots`;
- replace/equip in one candidate construction;
- validate the candidate with `validatePlayerMedalState`;
- return candidate only after validation;
- never mutate input.

- [ ] **Step 5: Implement `unequipMedalFromSlot(...)`**

Because the approved signature intentionally has no registry parameter:

- validate the state container shape needed by this transition: non-null object, `unlockedMedalIds` array, exactly three `equippedSlots`;
- validate runtime `slotIndex` 0–2;
- reject empty target slot;
- clone both arrays;
- set only the selected cloned slot to `null`;
- return the new state.

Do not add a registry parameter or silently redesign the approved public signature. A valid input state stays valid after removing one equipped Medal; full registry-backed validation remains available at state entry/projection/assignment boundaries.

- [ ] **Step 6: Run loadout tests and core typecheck**

```bash
npx vitest run packages/core/src/medal/__tests__/loadout.test.ts
npm run typecheck:core
```

Expected: exit 0.

- [ ] **Step 7: Commit Task 3**

```bash
git add packages/core/src/medal/loadout.ts         packages/core/src/medal/__tests__/loadout.test.ts
git commit -m "feat(core): add atomic medal loadout transitions"
```

---

### Task 4: Modifier Projection and Medal Module Barrel

**Files:**
- Create: `packages/core/src/medal/projection.ts`
- Create: `packages/core/src/medal/index.ts`
- Create: `packages/core/src/medal/__tests__/projection.test.ts`

**Interfaces:**
- Consumes:
  - Task 1 types and validators.
  - valid `PlayerMedalState`.
- Produces:
  - `projectEquippedMedalModifiers(state: PlayerMedalState, registry: readonly MedalDefinition[]): ModifierContribution[]`
  - internal Medal subsystem barrel exports from `packages/core/src/medal/index.ts`.

- [ ] **Step 1: Write failing projection tests for M18–M21 and M25**

Pin:

- only non-null equipped slots produce contributions;
- each equipped Medal produces exactly one contribution;
- output uses:
  - `source: "medal"`
  - `sourceId` = equipped Medal ID
  - `target` and `modifierBps` copied from its definition;
- output order follows equipped slot index `0 -> 1 -> 2`;
- repeating projection with identical input is deeply equal;
- reordering registry definitions does not change contribution order;
- frozen state and frozen registry remain unchanged after projection.

For M20, use `unequipMedalFromSlot` to produce a new state and assert the next projection no longer contains that Medal contribution.

M21 is pinned by the exact API surface plus the test: projection accepts only Medal state/registry, imports no resource/status/workforce consumer module, and mutates neither input. It must not create resource/status/workforce values.

- [ ] **Step 2: Run projection tests to verify RED**

```bash
npx vitest run packages/core/src/medal/__tests__/projection.test.ts
```

Expected: FAIL because projection/barrel modules do not exist.

- [ ] **Step 3: Implement `projectEquippedMedalModifiers(...)`**

Requirements:

- call `validateMedalRegistry` and `validatePlayerMedalState`;
- iterate the three slots in slot order;
- skip `null`;
- lookup the equipped definition by ID;
- return a new `ModifierContribution` object for each equipped Medal;
- do not aggregate same-target modifiers;
- do not apply percentages to any base value;
- do not clamp to City Effect caps;
- do not cache or persist derived output.

- [ ] **Step 4: Implement `packages/core/src/medal/index.ts`**

Export only the Medal subsystem:

```ts
export * from "./types.js";
export * from "./validation.js";
export * from "./loadout.js";
export * from "./projection.js";
```

Do not modify `packages/core/src/index.ts`.

- [ ] **Step 5: Verify projection, all Medal tests, and typecheck**

```bash
npx vitest run packages/core/src/medal/__tests__/projection.test.ts
npx vitest run packages/core/src/medal/__tests__
npm run typecheck:core
```

Expected: exit 0.

- [ ] **Step 6: Commit Task 4**

```bash
git add packages/core/src/medal/projection.ts         packages/core/src/medal/index.ts         packages/core/src/medal/__tests__/projection.test.ts
git commit -m "feat(core): project equipped medal modifiers"
```

---

## Acceptance Mapping M01–M25

| ID | Evidence owner |
|---|---|
| M01 | Task 1 `validation.test.ts`: valid grade/tier table |
| M02 | Task 1: mismatch rejects |
| M03 | Task 1: duplicate registry ID rejects |
| M04 | Task 1: modifier numeric-domain table rejects |
| M05 | Task 1: multiple grades same category unlocked validates |
| M06 | Task 1: 2-slot/4-slot state rejects |
| M07 | Task 1: different equipped categories validate |
| M08 | Task 1: duplicate equipped category rejects |
| M09 | Task 3: equip into eligible empty slot |
| M10 | Task 2/3: unowned selected Medal rejects |
| M11 | Task 2: empty=Equip, occupied=Replace when category absent |
| M12 | Task 2: existing same category => only that slot Replace |
| M13 | Task 3: same-category atomic replacement |
| M14 | Task 3: invalid replacement leaves original unchanged |
| M15 | Task 2/3: already-equipped Medal rejects reassignment |
| M16 | Task 3: occupied slot unequips to null |
| M17 | Task 3: empty-slot unequip rejects |
| M18 | Task 4: only equipped Medals project |
| M19 | Task 4: slot-order projection |
| M20 | Task 4: reprojection after unequip removes contribution |
| M21 | Task 4: isolated projection API + frozen-input non-mutation |
| M22 | Task 1: JSON round-trip parses and revalidates equivalently |
| M23 | Final verification: existing City Effect test suite remains green; no City Effect file changed |
| M24 | Final scope diff: no persistence schema/migration file changed |
| M25 | Tasks 2–4: repeated identical query/transition/projection inputs produce equivalent outputs |

## Final G2/G3 Verification Gate

After Task 4, run fresh evidence in this exact order:

```bash
npm run typecheck
npx vitest run packages/core/src/medal/__tests__
npx vitest run packages/core/src/status/__tests__/effects.test.ts
npm test
git diff --name-only 56a3ad853f4ce182b1724b6251807adc8298047e...HEAD
git diff 56a3ad853f4ce182b1724b6251807adc8298047e...HEAD -- packages/core/src/status/effects.ts packages/persistence docs/INTERNAL_PROGRESS_TRACKER.md packages/core/src/index.ts
git status --short
```

Expected:

- full workspace typecheck exit 0;
- all Medal tests pass;
- existing City Effect suite passes unchanged, preserving fixed three-week behavior;
- full Vitest suite passes with 0 failures;
- changed-file list contains only the eight allowed new Medal files;
- protected-path diff prints no output;
- working tree is clean before PR preparation.

Also inspect whitespace and the new-code diff for obvious secret-like material:

```bash
git diff --check 56a3ad853f4ce182b1724b6251807adc8298047e...HEAD
if git diff 56a3ad853f4ce182b1724b6251807adc8298047e...HEAD -- packages/core/src/medal | grep -Ein '(api[_-]?key|secret|password|private[_-]?key|bearer[[:space:]])'; then
  echo "Potential secret-like material found in Medal diff"
  exit 1
fi
```

Expected: no whitespace errors and no secret-like match.

If any final verification fails, do not claim completion. Apply at most two bounded fix iterations for the same issue; on the second unsuccessful iteration, **HOLD**.

## G3/G4 Handoff Requirements

Before opening the PR, the Builder reports:

- branch name;
- final HEAD SHA;
- commit list since `56a3ad853f4ce182b1724b6251807adc8298047e`;
- exact changed-file list;
- targeted Medal test command/results;
- City Effect regression command/results;
- full `npm test` result;
- full-workspace `npm run typecheck` result;
- pre-push secret-like diff scan result;
- confirmation that protected-path diff is empty.

PR target is `main`. Human remains the only merge authority.

The independent Reviewer must compare the final diff against this exact Work Order, the approved Spec, M01–M25, and the protected-path guardrails. No review finding may be "fixed" by widening scope without Human approval.

## Save/Content Risks

- No persistence schema or migration is introduced, so Medal state is not yet durable gameplay state.
- JSON round-trip is characterization only; it does not decide world-vs-profile ownership.
- Fixture Medal names and `modifierBps` values are test-only and must not be treated as canonical balance/content.
- No Medal challenge catalog is created; achievement design remains a separate future WP.
- No modifier is applied to actual Food/Happiness/Security/Goods/Corruption/Workforce values in this WP.

## Human Approval Gate

This plan is G1 material. **Do not implement it until Human approves the exact plan artifact.**

After approval, execution method is already established for this project: Antigravity acts as the single-writer Builder on `feat/medal-core-loadout-foundation-01`; Reviewer remains independent; Human alone decides merge.
