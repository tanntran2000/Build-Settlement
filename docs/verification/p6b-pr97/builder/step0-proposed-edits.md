# PR B Step 0 — exact proposed edits (pending owner approval)

Base: 0de2d1ffa91abadf76ced9696f440a09bf19f8af. IDs are scoped to PR B; PR A P1–P59 stay unchanged.
No existing test or product file has been edited. The entire existing-test inventory is **one edit in one file**.

## P1 — packages/core/src/world/__tests__/npc.test.ts:30

Reason: Decision 5 appends the three supported NPC workshop posts. Keep exact equality, order, and all other bytes.

Before:

```ts
    expect([...NPC_MANAGER_BUILDING_TYPES]).toEqual(['farm', 'processor', 'logging', 'mine', 'workshop', 'town-hall', 'town-market', 'quarry', 'sheep-pasture', 'herb-garden', 'weaver', 'watch-house', 'military-barracks']);
```

After:

```ts
    expect([...NPC_MANAGER_BUILDING_TYPES]).toEqual(['farm', 'processor', 'logging', 'mine', 'workshop', 'town-hall', 'town-market', 'quarry', 'sheep-pasture', 'herb-garden', 'weaver', 'watch-house', 'military-barracks', 'smithy', 'hospital', 'drug-store']);
```

Nothing else in this test file changes; the assertion stays exact equality.

## X1 — outside PR B allowlist: packages/core/src/trial/society.ts:66

Reason: The parent validator otherwise rejects every nonempty optional workshops state before isItemsState can validate it. Only this line changes; isItemsState still checks the exact canonical shape and contents.

Before:

```ts
    return hasWeeklyKeys(raw.items,['nextItemId','inventory','consumables','materials','storage','equipped','market','goals']) &&
```

After:

```ts
    return (hasWeeklyKeys(raw.items,['nextItemId','inventory','consumables','materials','storage','equipped','market','goals']) || hasWeeklyKeys(raw.items,['nextItemId','inventory','consumables','materials','storage','equipped','market','goals','workshops'])) &&
```

This is a product validator compatibility edit, not an existing-test edit. Rejecting extra keys and validating workshop contents remain delegated to the existing strict isItemsState path on line 67.

## B1 task Files line addition

packages/simulation/src/tile-trial.ts: Already explicitly permitted by PR B allowlist lines 104–105, but absent from B1 Files line 166. Put WORKSHOP_BUSY in the shared REPLACE path so direct tile, NPC-world and Character Life callers all receive the refusal.

No other file outside the PR B allowlist is requested. Core already re-exports trial/items.ts and trial/types.ts. craft-week.ts can be imported internally and by its direct-file unit test; no public simulation index change is needed. Routing already reads ITEM_COMMAND_TYPES, so character-life-command.ts may need no change.

## Contract resolutions submitted with the Step 0 HOLD

### D1 — Report fields versus no-order byte identity

References: plan:93; PR B brief: no orders => every existing golden, fixture and 60-week report hash unchanged.

Proposed: Add crafted?: {tileId:string;recipeId:string;output:string;place:'inventory'|'consumables'|'materials'|'storage'|'ready'}[] and workshopsIdle?: string[] as optional last fields of ItemWeekReport; output is the recipe output definition id. Omit each field when its array is empty. A never-used workshop produces no new report keys. Do not add empty arrays to old reports or change the visible parser in PR B.

Why: Unconditional empty arrays would change report JSON and require edits to synthetic reports and the visible parser; it would conflict with the byte-identity requirement.

### D2 — Placement operating wording versus exact NO_WORKSHOP definition

References: spec:89; plan:87; PR B brief B1/Decision 8.

Proposed: Follow the specific Decision 8 contract: placement requires a built, enabled building permitted by the recipe. Staffing, Hospital Herbs and actual paid upkeep determine completion at End Week, not whether the player can queue the order. Do not introduce another placement error or refusal.

Why: Spec says operating at placement, while Decision 8 and the current brief define the check as built and enabled.

### D3 — Zero workers versus adding NPC skill bonuses

References: spec:96; spec:161; plan:92; plan:187.

Proposed: Smithy and Hospital with zero workers complete zero orders even with a posted NPC at effective skill 80 or 100. Apply skill bonuses only after the workshop can operate; Drug Store retains worker-free base 1. Hospital must also satisfy the existing fully staffed and supplied operating rule.

Why: The bare workers-plus-bonus formula could otherwise complete two orders at zero workers, contrary to the explicit spec and B2 RED requirement. Existing operatingIds includes funded partially staffed Hospitals, so set membership alone is insufficient.

### D4 — Material output when its stack is full

References: spec:117; plan:81; plan:92; packages/core/src/trial/items.ts:38.

Proposed: Material output goes to its stack if below 999; otherwise it becomes ready {material,count} directly. Existing temporary storage continues to hold item instances only. Wearables and potions use their respective inventory, then existing item storage, then ready; ready delivery follows the same destination rules and never allocates another id.

Why: Spec expressly says a 999 stack waits. P6-A storage has no material representation, while the approved ready union does. No storage schema or P6-A cap is expanded.

## Zero-change sets

Existing e2e/helper edits: 0. Existing fixture/golden edits: 0. Hash-pin edits: 0. Other existing-test edits: 0. New timeout or threshold changes: 0.

Expected golden/fixture path diff: [] (including the stored session JSON inside catalog-golden.json). Do not regenerate them in PR B. If a runtime comparison changes any byte, HOLD with its path diff.

## Verification

Run from the assigned worktree:

`node C:/Users/Admin/.t3/local-drafts/p6b-prB/verify-edit-inventory.mjs --mode preflight`

After owner approval and implementation, at a clean committed final head:

`node C:/Users/Admin/.t3/local-drafts/p6b-prB/verify-edit-inventory.mjs --mode final --approval C:/Users/Admin/.t3/local-drafts/p6b-prB/owner-approval.json`

Final mode requires a separate owner-approval.json recording status approved, base, owner Tân, verbatim quote, and proposalSha256 of step0-proposed-edits.json. No approval is recorded yet. The verifier checks every existing test byte, exact P1/X1 transformations, the product/new-test allowlist, and immutable files versus the exact base. It does not substitute for RED/GREEN or gates.
