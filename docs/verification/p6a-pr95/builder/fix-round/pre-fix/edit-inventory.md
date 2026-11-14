# PR C Step 0: approved and applied existing-test edits

Base: 2c04321ba342871e6a858110ea2320a8e4df0d5d. Applied at 8af03070496d8e41ae85fecaea2d29c4cc474811; exact P1–P10 verified by verify-step0.mjs --implemented.

10 edit blocks in 3 existing test/support files. No other edit is proposed. All line numbers refer to the base.

## P1: tests/e2e/character-life-boundary.spec.ts:103 (C1)

C1 replaces the Inventory placeholder and empty-control surface with the real equipment view. Keep the observation setup and all other profile assertions.

Before:

```ts
  await expect(panel.locator('p')).toHaveText(['Inventory and equipment are not implemented yet.', 'Current clothing is described in Description.']);
  await expect(panel.locator('button,input,select,ul,ol,[data-slot]')).toHaveCount(0);
```

After:

```ts
  const equipment = panel.getByRole('region', { name: 'Equipment', exact: true });
  await expect(equipment).toBeVisible();
  await expect(equipment.locator('[data-item-slot]')).toHaveCount(c.id === 'player' ? 8 : 11);
  await expect(equipment.locator('[data-item-slot][data-locked="true"]')).toHaveCount(c.id === 'player' ? 0 : 3);
  await expect(equipment.getByRole('group', { name: 'Inventory filters', exact: true }).getByRole('button')).toHaveText(['All', 'Player', 'NPC', 'This slot', 'Equipment', 'Accessory', 'Outfit']);
```

## P2: tests/e2e/character-life-navigation.spec.ts:489 (C1)

Rename the existing test to describe the now implemented Inventory; retain its Player Work and Relations assertions.

Before:

```ts
test('inventory and player unavailable areas are honest', async ({ page }) => {
```

After:

```ts
test('inventory shows equipment and player unavailable areas stay honest', async ({ page }) => {
```

## P3: tests/e2e/character-life-navigation.spec.ts:497 (C1)

C1 implements Inventory for every selected character. Replace the obsolete empty placeholder with exact slot, lock and filter assertions.

Before:

```ts
    await expect(panel.locator('p')).toHaveText(['Inventory and equipment are not implemented yet.', 'Current clothing is described in Description.']);
    await expect(panel.locator('button,input,select,ul,ol,[data-slot]')).toHaveCount(0);
```

After:

```ts
    const equipment = panel.getByRole('region', { name: 'Equipment', exact: true });
    await expect(equipment).toBeVisible();
    await expect(equipment.locator('[data-item-slot]')).toHaveCount(id === 'player' ? 8 : 11);
    await expect(equipment.locator('[data-item-slot][data-locked="true"]')).toHaveCount(id === 'player' ? 0 : 3);
    await expect(equipment.getByRole('group', { name: 'Inventory filters', exact: true }).getByRole('button')).toHaveText(['All', 'Player', 'NPC', 'This slot', 'Equipment', 'Accessory', 'Outfit']);
```

## P4: tests/e2e/character-life-navigation.spec.ts:844 (C2)

C2 renders items. Include the parsed items field in this existing exact executor-report equality.

Before:

```ts
  const {items: _items,society: _society,luxuryImportedMilli: _luxury,trainingGoldMilli: _training,...expectedBase}=expected.report;
```

After:

```ts
  const {society: _society,luxuryImportedMilli: _luxury,trainingGoldMilli: _training,...expectedBase}=expected.report;
```

## P5: tests/e2e/character-life-navigation.spec.ts:1330 (C1)

The F3 profile audit traverses the implemented Inventory. Preserve all disclosure, selection and tab-memory assertions.

Before:

```ts
        await expect(panel.locator('p')).toHaveText(['Inventory and equipment are not implemented yet.', 'Current clothing is described in Description.']);
        await expect(panel.locator('button,input,select,ul,ol,[data-slot]')).toHaveCount(0);
```

After:

```ts
        const equipment = panel.getByRole('region', { name: 'Equipment', exact: true });
        await expect(equipment).toBeVisible();
        await expect(equipment.locator('[data-item-slot]')).toHaveCount(c.id === 'player' ? 8 : 11);
        await expect(equipment.locator('[data-item-slot][data-locked="true"]')).toHaveCount(c.id === 'player' ? 0 : 3);
        await expect(equipment.getByRole('group', { name: 'Inventory filters', exact: true }).getByRole('button')).toHaveText(['All', 'Player', 'NPC', 'This slot', 'Equipment', 'Accessory', 'Outfit']);
```

## P6: tests/e2e/character-life-navigation.helpers.ts:3 (C2)

The visible report parser resolves item names back to stable catalog ids; no expected report payload is copied.

Before:

```ts
import { createCharacterLifeSession,DEFAULT_PLAYER_DRAFT,isCharacterLifeSessionState,TRIAL_BUILDINGS,WEEKLY_RESOURCE_KEYS,type CharacterLifeSessionState,type TileTrialReport } from '../../packages/core/src/index.ts';
```

After:

```ts
import { createCharacterLifeSession,DEFAULT_PLAYER_DRAFT,ITEM_CATALOG,isCharacterLifeSessionState,TRIAL_BUILDINGS,WEEKLY_RESOURCE_KEYS,type CharacterLifeSessionState,type TileTrialReport } from '../../packages/core/src/index.ts';
```

## P7: tests/e2e/character-life-navigation.helpers.ts:218 (C2)

Add a strict reader of visible item tables and recovery text inside the existing opened letter Details. Preserve row order, null cases, booleans and absent pendingLegendary.

Before:

```ts
// Read the complete report from rendered text, including the calculation disclosure.
```

After:

```ts
// Read visible tables inside the existing Steward/Quartermaster Details disclosures.
// Read visible cell text; never copy expected.items or a JSON parity payload.
async function readItemReport(panel: Locator): Promise<TileTrialReport['items']> {
  const quartermaster = panel.getByRole('region', { name: 'Quartermaster item details', exact: true });
  const steward = panel.getByRole('region', { name: 'Steward item details', exact: true });
  await expect(quartermaster).toBeVisible();
  await expect(steward).toBeVisible();
  async function rows(region: Locator, name: string, columns: string[]): Promise<string[][]> {
    const table = region.getByRole('table', { name, exact: true });
    await expect(table).toBeVisible();
    await expect(table.getByRole('columnheader')).toHaveText(columns);
    const values: string[][] = [];
    for (const row of await table.locator('tbody > tr').all()) {
      const cells = await row.locator('th,td').allTextContents();
      expect(cells).toHaveLength(columns.length);
      values.push(cells.map(value => value.trim()));
    }
    return values;
  }
  function definition(name: string): string {
    const matches = Object.entries(ITEM_CATALOG).filter(([, item]) => item.name === name);
    expect(matches).toHaveLength(1);
    return matches[0][0];
  }
  function goal(label: string): NonNullable<TileTrialReport['items']['legendary']>['goal'] {
    const goals = { 'Calm city': 'calm', 'Authority 100': 'authority', 'Week 52': 'week52', 'Research complete': 'research' } as const;
    expect(Object.hasOwn(goals, label)).toBe(true);
    return goals[label as keyof typeof goals];
  }
  const materials = (await rows(quartermaster, 'Materials this week', ['Plot', 'Material', 'Outcome'])).map(([tileId, name, outcome]) => {
    expect(['Kept', 'Lost: stack full (999)']).toContain(outcome);
    return { tileId, materialId: definition(name), lost: outcome === 'Lost: stack full (999)' };
  });
  const foundRows = await rows(quartermaster, 'Item found', ['Item', 'Outcome']);
  expect(foundRows.length).toBeLessThanOrEqual(1);
  let found: TileTrialReport['items']['found'] = null;
  if (foundRows.length) {
    const [name, outcome] = foundRows[0];
    expect(['Inventory', 'Temporary storage', 'Lost: inventory and temporary storage full']).toContain(outcome);
    found = { defId: definition(name), stored: outcome === 'Temporary storage', lost: outcome === 'Lost: inventory and temporary storage full' };
  }
  const expired = (await rows(quartermaster, 'Expired items', ['Item'])).map(([name]) => definition(name));
  const legendaryRows = await rows(steward, 'Legendary rewards', ['Goal', 'Item']);
  expect(legendaryRows.length).toBeLessThanOrEqual(1);
  const legendary = legendaryRows.length ? { goal: goal(legendaryRows[0][0]), defId: definition(legendaryRows[0][1]) } : null;
  const pendingLegendary = (await rows(steward, 'Rewards waiting', ['Goal', 'Status'])).map(([label, status]) => {
    expect(status).toBe('Make room in inventory or temporary storage.');
    return goal(label);
  });
  const recovery = quartermaster.getByRole('group', { name: 'Recovery this week', exact: true });
  await expect(recovery).toBeVisible();
  await expect(recovery.locator('dt')).toHaveText(['Hospital operated', 'Regeneration']);
  const values = await recovery.locator('dd').allTextContents();
  expect(values).toHaveLength(2);
  expect(['Yes', 'No']).toContain(values[0]);
  expect(values[1]).toMatch(/^\+\d+$/);
  const result: TileTrialReport['items'] = { materials, found, expired, legendary, hospitalOperated: values[0] === 'Yes', regen: Number(values[1].slice(1)) };
  if (pendingLegendary.length) result.pendingLegendary = pendingLegendary;
  return result;
}

// Read the complete report from rendered text, including the calculation disclosure.
```

## P8: tests/e2e/character-life-navigation.helpers.ts:219 (C2)

The rendered report now includes items; return the full TileTrialReport type.

Before:

```ts
export async function expectReport(page: Page, expected: Readonly<TileTrialReport>): Promise<Omit<TileTrialReport, 'items'>> {
```

After:

```ts
export async function expectReport(page: Page, expected: Readonly<TileTrialReport>): Promise<TileTrialReport> {
```

## P9: tests/e2e/character-life-navigation.helpers.ts:281 (C2)

Include the independently parsed visible item report in actual, retaining every existing expected field and equality.

Before:

```ts
  const actual: Omit<TileTrialReport, 'items'> = {
    week: absoluteWeek, before, after,
```

After:

```ts
  const actual: TileTrialReport = {
    week: absoluteWeek, before, after,
    items: await readItemReport(panel),
```

## P10: tests/e2e/character-life-navigation.helpers.ts:379 (C2)

Stop excluding the now rendered items field. The exact toEqual matcher is unchanged; existing separately checked society/luxury/training fields stay as before.

Before:

```ts
  const { items: _items, society, luxuryImportedMilli, trainingGoldMilli, ...baseReport } = expected;
```

After:

```ts
  const { society, luxuryImportedMilli, trainingGoldMilli, ...baseReport } = expected;
```
