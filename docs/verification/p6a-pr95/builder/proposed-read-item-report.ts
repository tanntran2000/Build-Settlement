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
