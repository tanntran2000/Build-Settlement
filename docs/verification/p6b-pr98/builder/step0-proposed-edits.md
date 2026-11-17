# PR C Step 0 — exact proposed edits

Base: `43fcb9b856c66606230d6d7ba49140ae94cfaa00`. Status: **PROPOSED — HOLD**. No edit below has been applied.

Three existing e2e-helper edits (one file) and three product lines outside the original allowlist (two files). P3 is one contiguous insertion anchored by its exact two-line before block. Line numbers are at the base commit. All other bytes in these three files stay unchanged.

## Existing test/helper edits

### P1 — tests/e2e/character-life-navigation.helpers.ts:3 (C2)

The visible report oracle derives recipe ids from unique rendered output names and the static recipe catalog, independently of production UI helpers.

**Before**

```ts
import { createCharacterLifeSession,DEFAULT_PLAYER_DRAFT,ITEM_CATALOG,isCharacterLifeSessionState,TRIAL_BUILDINGS,WEEKLY_RESOURCE_KEYS,type CharacterLifeSessionState,type TileTrialReport } from '../../packages/core/src/index.ts';
```

**After**

```ts
import { createCharacterLifeSession,DEFAULT_PLAYER_DRAFT,ITEM_CATALOG,RECIPES,isCharacterLifeSessionState,TRIAL_BUILDINGS,WEEKLY_RESOURCE_KEYS,type CharacterLifeSessionState,type TileTrialReport } from '../../packages/core/src/index.ts';
```

### P2 — tests/e2e/character-life-navigation.helpers.ts:85 (C1)

Buy/Brew adds a separate legitimate tab widget in the mounted City view. Preserve exactly one mounted Character tabpanel by scoping this character-window assertion to Characters. Existing visible-count, keyboard traversal and hidden-view checks remain.

**Before**

```ts
  expect(await page.locator('[role=tabpanel]').count()).toBe(1);
```

**After**

```ts
  expect(await characters.locator('[role=tabpanel]').count()).toBe(1);
```

### P3 — tests/e2e/character-life-navigation.helpers.ts:275 (C2)

Parse optional crafted and idle rows from visible Quartermaster tables, with exact headers, nonempty rows, unique item/recipe lookup and explicit English destination/status validation. Keep all old parsing intact and omit absent optional keys.

**Before**

```ts
  if (pendingLegendary.length) result.pendingLegendary = pendingLegendary;
  return result;
```

**After**

```ts
  if (pendingLegendary.length) result.pendingLegendary = pendingLegendary;
  const outputTable = quartermaster.getByRole('table', { name: 'Workshop output', exact: true });
  expect(await outputTable.count()).toBeLessThanOrEqual(1);
  if (await outputTable.count()) {
    const outputRows = await rows(quartermaster, 'Workshop output', ['Plot', 'Work', 'Output', 'Destination']);
    expect(outputRows.length).toBeGreaterThan(0);
    const places = { Inventory: 'inventory', 'Potion inventory': 'consumables', 'Material stack': 'materials', 'Temporary storage': 'storage', 'Waiting for room': 'ready' } as const;
    result.crafted = outputRows.map(([tileId, work, name, destination]) => {
      const output = definition(name);
      const matches = Object.entries(RECIPES).filter(([, recipe]) => recipe.output === output);
      expect(matches).toHaveLength(1);
      const [recipeId, recipe] = matches[0];
      expect(work).toBe(recipe.kind === 'refine' ? 'Refined' : ITEM_CATALOG[output].category === 'consumable' ? 'Brewed' : 'Crafted');
      expect(Object.hasOwn(places, destination)).toBe(true);
      return { tileId, recipeId, output, place: places[destination as keyof typeof places] };
    });
  }
  const idleTable = quartermaster.getByRole('table', { name: 'Idle workshops', exact: true });
  expect(await idleTable.count()).toBeLessThanOrEqual(1);
  if (await idleTable.count()) {
    const idleRows = await rows(quartermaster, 'Idle workshops', ['Plot', 'Status']);
    expect(idleRows.length).toBeGreaterThan(0);
    result.workshopsIdle = idleRows.map(([tileId, status]) => {
      expect(status).toBe('No orders completed. Check workers, supplies and upkeep.');
      return tileId;
    });
  }
  return result;
```

## Outside-allowlist product edits

### X1 — packages/ui/src/CharacterLifeCity.svelte:45 (C1)

Pass the existing read-only NPC list through the sole InsideCity mount so the capacity display includes the posted NPC effective technical/medical skill and worn items. No state mutation or dispatcher change.

**Before**

```ts
  <InsideCity {state} {selectedId} {locked} {managementError} {onselect} {oncommand} />
```

**After**

```ts
  <InsideCity {state} {npcs} {selectedId} {locked} {managementError} {onselect} {oncommand} />
```

### X2 — packages/ui/src/TileManagement.svelte:80 (C1)

Recognize the six craft/busy error codes already implemented by PR B instead of misclassifying them as UNKNOWN_COMMAND_FAILURE. Keep every old code and its order.

**Before**

```ts
      const known = ['INVALID_COMMAND', 'STALE_COMMAND', 'FORBIDDEN', 'UNSUPPORTED_RULESET', 'INVALID_STATE', 'INVALID_WORKFORCE', 'INVALID_PLAN', 'EXECUTION_ERROR', 'WEEK_MISMATCH', 'INVALID_TILE', 'INVALID_BUILDING', 'INVALID_PLACEMENT', 'OCCUPIED', 'EMPTY_TILE', 'MAX_LEVEL', 'INSUFFICIENT_RESOURCES', 'LOCKED_PLOT', 'NOT_AVAILABLE', 'WRONG_TIER', 'WALL_COMPLETE', 'PREREQUISITE_MISSING', 'UNSUPPORTED_ACTION', 'CARD_PENDING', 'CITY_FALLEN', 'UNKNOWN_CARD', 'UNKNOWN_OPTION', 'OPTION_UNAVAILABLE', 'SLOT_MISMATCH', 'KIND_MISMATCH', 'NOT_ENOUGH_GOLD', 'INVENTORY_FULL', 'NO_SHOP', 'ITEM_UNKNOWN', 'NOT_SELLABLE'];
```

**After**

```ts
      const known = ['INVALID_COMMAND', 'STALE_COMMAND', 'FORBIDDEN', 'UNSUPPORTED_RULESET', 'INVALID_STATE', 'INVALID_WORKFORCE', 'INVALID_PLAN', 'EXECUTION_ERROR', 'WEEK_MISMATCH', 'INVALID_TILE', 'INVALID_BUILDING', 'INVALID_PLACEMENT', 'OCCUPIED', 'EMPTY_TILE', 'MAX_LEVEL', 'INSUFFICIENT_RESOURCES', 'LOCKED_PLOT', 'NOT_AVAILABLE', 'WRONG_TIER', 'WALL_COMPLETE', 'PREREQUISITE_MISSING', 'UNSUPPORTED_ACTION', 'CARD_PENDING', 'CITY_FALLEN', 'UNKNOWN_CARD', 'UNKNOWN_OPTION', 'OPTION_UNAVAILABLE', 'SLOT_MISMATCH', 'KIND_MISMATCH', 'NOT_ENOUGH_GOLD', 'INVENTORY_FULL', 'NO_SHOP', 'ITEM_UNKNOWN', 'NOT_SELLABLE', 'RECIPE_UNKNOWN', 'NO_WORKSHOP', 'MISSING_INPUT', 'QUEUE_FULL', 'ORDER_UNKNOWN', 'WORKSHOP_BUSY'];
```

### X3 — packages/ui/src/TileManagement.svelte:88 (C1)

Route place/cancel failures through the existing managementError/itemError channel so the panel can show command errors. Leave revision checks, dispatch and every old route intact.

**Before**

```ts
      else if (['BUY_ITEM','SELL_ITEM','SELL_MATERIAL','BUY_POTION','USE_CONSUMABLE','CLAIM_STORED_ITEM','DESTROY_ITEM','EQUIP_ITEM','UNEQUIP_ITEM'].includes(type)) managementError = {action:type,message:itemError(result.error.code)};
```

**After**

```ts
      else if (['BUY_ITEM','SELL_ITEM','SELL_MATERIAL','BUY_POTION','USE_CONSUMABLE','CLAIM_STORED_ITEM','DESTROY_ITEM','EQUIP_ITEM','UNEQUIP_ITEM','PLACE_CRAFT_ORDER','CANCEL_CRAFT_ORDER'].includes(type)) managementError = {action:type,message:itemError(result.error.code)};
```

## Unchanged paths and tests

No golden, fixture, catalog, recipe, hash pin, assertion value, timeout or accessibility threshold changes. The final verifier checks every existing test file plus this helper, all three exact extra product lines, the path allowlist and all 86 immutable paths.

## Owner decision

Approve or reject P1–P3 and X1–X3 as written. An approval must identify this proposal file by SHA256. If implementation later needs another existing-test edit or extra path, stop and issue a new HOLD.
