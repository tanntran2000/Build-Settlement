# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: npc-sheet.spec.ts >> NPC sheet reflow at 320px >> NPC sheet and NPC life report reflow at 320px
- Location: tests\e2e\npc-sheet.spec.ts:376:3

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false
```

# Page snapshot

```yaml
- main [ref=e3]:
  - generic [ref=e4]:
    - heading "HAVEN" [level=1] [ref=e5]
    - paragraph [ref=e6]: Sovereign Frontier
    - region "Start" [ref=e7]:
      - button "Continue" [disabled] [ref=e8]
      - paragraph [ref=e9]: No local checkpoint
      - button "New Game" [active] [ref=e10]
      - button "Load checkpoint" [ref=e11]
      - button "Options" [ref=e12]
      - button "Quit" [ref=e13]
  - paragraph [ref=e14]: v0.1.0 Alpha
```

# Test source

```ts
  48  |     ...npc,
  49  |     character: { ...npc.character, age: Math.floor((week - npc.life.birthWeek) / 40) },
  50  |   }));
  51  |   return observeCharacterLife({ ...session, npcs }, report);
  52  | }
  53  | 
  54  | // Traverse the real tab order; never manufacture focus or skip hidden-view checks.
  55  | export async function tabTo(page: Page, target: Locator) {
  56  |   await expect(target).toBeVisible();
  57  |   for (let step = 0; step < 160; step++) {
  58  |     if (await target.evaluate(node => node === document.activeElement)) return;
  59  |     await page.keyboard.press('Tab');
  60  |     expect(await page.evaluate(() => !!document.activeElement?.closest('[hidden], [aria-hidden="true"]'))).toBe(false);
  61  |   }
  62  |   throw Error(`Control unreachable after 160 Tabs: ${await target.getAttribute('id') ?? await target.textContent()}`);
  63  | }
  64  | 
  65  | export async function keyActivate(page: Page, target: Locator) {
  66  |   await tabTo(page, target); await page.keyboard.press('Enter');
  67  | }
  68  | 
  69  | export async function keyGo(page: Page, destination: LifeDestination) {
  70  |   if (await page.locator('dialog:modal').count()) await keyActivate(page, page.getByRole('dialog').getByRole('button', { name: 'Close', exact: true }));
  71  |   await keyActivate(page, page.locator(`#life-nav-${destination === 'reports' ? 'report' : destination}`));
  72  |   await expect(page.locator(`[data-life-view="${destination}"]`)).toBeVisible();
  73  | }
  74  | 
  75  | export async function keyText(page: Page, target: Locator, value: string) {
  76  |   await tabTo(page, target); await page.keyboard.press('ControlOrMeta+A'); await page.keyboard.type(value);
  77  | }
  78  | 
  79  | export async function keyPost(page: Page, target: Locator, value: string) {
  80  |   await tabTo(page, target);
  81  |   const values = await target.locator('option').evaluateAll(nodes => nodes.map(n => (n as HTMLOptionElement).value));
  82  |   expect(values).toContain(value);
  83  |   await page.keyboard.press('Home');
  84  |   for (let i = 0; i < values.indexOf(value); i++) await page.keyboard.press('ArrowDown');
  85  |   await page.keyboard.press('Tab');
  86  |   await expect(target).toHaveValue(value);
  87  | }
  88  | 
  89  | export async function watchTurnStatus(page: Page) {
  90  |   await page.locator('aside p[aria-atomic="true"]').evaluate(node => {
  91  |     const texts: string[] = [];
  92  |     const modal: boolean[] = [];
  93  |     const watched = node as HTMLElement & { mutations: string[]; modalAtMutation: boolean[] };
  94  |     watched.mutations = texts; watched.modalAtMutation = modal;
  95  |     new MutationObserver(() => { texts.push(node.textContent ?? ''); modal.push(!!node.closest('dialog:modal')); }).observe(node, { childList: true, characterData: true, subtree: true });
  96  |   });
  97  | }
  98  | 
  99  | export async function turnStatuses(page: Page) {
  100 |   return page.locator('aside p[aria-atomic="true"]').evaluate(node => (node as HTMLElement & { mutations: string[] }).mutations);
  101 | }
  102 | export async function selectPerson(page: Page, id: string) {
  103 |   await go(page, 'characters');
  104 |   await charactersView(page).getByTestId(`character-${id}`).click();
  105 |   await expect(characterWindow(page)).toHaveAttribute('data-character-id', id);
  106 |   return characterWindow(page);
  107 | }
  108 | 
  109 | export async function selectArea(page: Page, name: string) {
  110 |   const tab = characterTabs(page).getByRole('tab', { name, exact: true });
  111 |   await tab.click();
  112 |   await expect(tab).toHaveAttribute('aria-selected', 'true');
  113 |   return characterPanel(page);
  114 | }
  115 | 
  116 | export async function selectNpcSheetTab(page: Page, name: string) {
  117 |   const tab = npcSheetTabs(page).getByRole('tab', { name, exact: true });
  118 |   await tab.click();
  119 |   await expect(tab).toHaveAttribute('aria-selected', 'true');
  120 |   const panel = characterPanel(page).getByRole('tabpanel', { name, exact: true });
  121 |   await expect(panel).toBeVisible();
  122 |   return panel;
  123 | }
  124 | 
  125 | export async function expectOneCharacterWindow(page: Page) {
  126 |   const characters = charactersView(page), window = characterWindow(page);
  127 |   const tabs = characterTabs(page), panel = characterPanel(page);
  128 |   await expect(window).toHaveCount(1);
  129 |   await expect(tabs).toHaveCount(1);
  130 |   await expect(tabs.getByRole('tab')).toHaveText(['Description', 'Inventory', 'Work', 'Relations']);
  131 |   await expect(panel).toHaveCount(1);
  132 |   const hasSheet = await window.getAttribute('data-character-id') !== 'player' &&
  133 |     await tabs.getByRole('tab', { name: 'Description', exact: true, selected: true }).count() === 1;
  134 |   await expect(characters.getByRole('tablist')).toHaveCount(hasSheet ? 2 : 1);
  135 |   await expect(characters.getByRole('tabpanel')).toHaveCount(hasSheet ? 2 : 1);
  136 |   expect(await characters.locator('[role=tabpanel]').count()).toBe(hasSheet ? 5 : 1);
  137 |   if (hasSheet) await expect(npcSheetTabs(page).getByRole('tab')).toHaveText(['Profile', 'Skills', '18+', 'History']);
  138 | }
  139 | 
  140 | export async function go(page: Page, destination: LifeDestination): Promise<void> {
  141 |   if (await page.locator('dialog:modal').count()) await page.getByRole('dialog').getByRole('button', { name: 'Close', exact: true }).click();
  142 |   await page.locator(`#life-nav-${destination === 'reports' ? 'report' : destination}`).click();
  143 |   await expect(page.locator(`[data-life-view="${destination}"]`)).toBeVisible();
  144 | }
  145 | 
  146 | export async function importLife(page: Page, session: CharacterLifeSessionState): Promise<void> {
  147 |   const encoded = serializeCharacterLifeSave(session);
> 148 |   expect(encoded.success).toBe(true);
      |                           ^ Error: expect(received).toBe(expected) // Object.is equality
  149 |   if (!encoded.success) throw new Error(encoded.error.message);
  150 |   const inGame = await page.getByTestId('life-shell').count() > 0;
  151 |   if (inGame) await go(page, 'session');
  152 |   await page.getByLabel('Import checkpoint', { exact: true }).setInputFiles({ name: 'life.json', mimeType: 'application/json', buffer: Buffer.from(encoded.text) });
  153 |   await expect(page.getByTestId('life-shell')).toBeVisible();
  154 |   if (inGame) await expect(page.locator('[aria-label="Planning checkpoints"] [role="status"]')).toHaveText('Checkpoint imported. Planning restored.');
  155 | }
  156 | 
  157 | export async function exportLife(page: Page): Promise<CharacterLifeSessionState> {
  158 |   expect(await page.getByTestId('life-end-week').getAttribute('aria-disabled')).toBe('false');
  159 |   await go(page, 'session');
  160 |   const pending = page.waitForEvent('download');
  161 |   await page.getByRole('button', { name: 'Export checkpoint', exact: true }).click();
  162 |   const download = await pending;
  163 |   expect(download.suggestedFilename()).toMatch(/^haven-world-life-week-\d+\.json$/);
  164 |   const state = JSON.parse(await readFile((await download.path())!, 'utf8')).state;
  165 |   expect(isCharacterLifeSessionState(state)).toBe(true);
  166 |   expect(download.suggestedFilename()).toBe(`haven-world-life-week-${state.city.world.week}.json`);
  167 |   return state;
  168 | }
  169 | 
  170 | // Independent integer formatter: report expectations must not share the production formatter.
  171 | export function reportUnits(value: number): string {
  172 |   expect(Number.isSafeInteger(value)).toBe(true);
  173 |   const milli = BigInt(Math.abs(value));
  174 |   const fraction = String(milli % 1000n).padStart(3, '0').replace(/0+$/, '');
  175 |   return `${value < 0 || Object.is(value, -0) ? '-' : ''}${(milli / 1000n).toLocaleString('en-US')}${fraction ? `.${fraction}` : ''}`;
  176 | }
  177 | 
  178 | export function reportMilli(text: string): number {
  179 |   expect(text).toMatch(/^-?(?:0|[1-9]\d{0,2}(?:,\d{3})*)(?:\.\d{1,3})?$/);
  180 |   const [whole, fraction = ''] = text.replace(/^-/, '').replaceAll(',', '').split('.');
  181 |   const milli = BigInt(whole) * 1000n + BigInt(fraction.padEnd(3, '0'));
  182 |   expect(milli <= BigInt(Number.MAX_SAFE_INTEGER)).toBe(true);
  183 |   return (text.startsWith('-') ? -1 : 1) * Number(milli);
  184 | }
  185 | 
  186 | // Independent UI oracles; never import the production calendar or fulfillment projection.
  187 | export function reportWeek(text: string): number {
  188 |   const match = text.match(/^Week (\d+) · Year (\d+) report$/);
  189 |   expect(match).not.toBeNull();
  190 |   const weekOfYear = Number(match![1]), year = Number(match![2]);
  191 |   expect(Number.isSafeInteger(year) && year >= 1).toBe(true);
  192 |   expect(Number.isInteger(weekOfYear) && weekOfYear >= 1 && weekOfYear <= 40).toBe(true);
  193 |   const absolute = (year - 1) * 40 + weekOfYear;
  194 |   expect(Number.isSafeInteger(absolute)).toBe(true);
  195 |   return absolute;
  196 | }
  197 | 
  198 | export function reportFulfillment(supplied: number, demand: number): string {
  199 |   if (demand === 0) return 'No demand';
  200 |   return `${Number(BigInt(supplied) * 10000n / BigInt(demand)) / 100}%`;
  201 | }
  202 | 
  203 | export const requirementsRegion = (page: Page) => page.getByRole('region', { name: 'City Requirements', exact: true });
  204 | 
  205 | export async function expectRequirements(page: Page, report: Readonly<TileTrialReport> | null) {
  206 |   const strip = requirementsRegion(page);
  207 |   await expect(strip).toBeVisible();
  208 |   if (!report) {
  209 |     await expect(strip.getByText('No resolved week yet', { exact: true })).toBeVisible();
  210 |     expect(await strip.textContent()).not.toContain('%');
  211 |     await expect(strip.locator('[data-fulfillment-track]')).toHaveCount(0);
  212 |     return;
  213 |   }
  214 |   const label = strip.getByText(/^Last resolved week:/);
  215 |   expect(reportWeek((await label.textContent())!.replace('Last resolved week: ', '') + ' report')).toBe(report.week);
  216 |   for (const [key, supplied, demand] of [['food', report.foodConsumedMilli, report.foodDemandMilli], ['goods', report.goods.servedMilli, report.goods.demandMilli]] as const) {
  217 |     const row = strip.getByTestId(`life-requirement-${key}`);
  218 |     await expect(row).toHaveText(`${reportUnits(supplied)} / ${reportUnits(demand)} · ${reportFulfillment(supplied, demand)}`);
  219 |     const track = strip.locator(`[data-fulfillment-track="${key}"]`);
  220 |     if (demand === 0) {
  221 |       expect(await row.textContent()).not.toContain('%');
  222 |       await expect(track).toHaveCount(0);
  223 |     } else {
  224 |       await expect(track).toHaveAttribute('aria-hidden', 'true');
  225 |       await expect(track).toHaveCSS('height', '8px');
  226 |       expect(await track.locator('span').evaluate(node => node.style.width)).toBe(reportFulfillment(supplied, demand));
  227 |     }
  228 |   }
  229 | }
  230 | 
  231 | // Selectively adapted from QOL 8c8505f: fixture data only, no historical verdicts.
  232 | export function reportFixture(kind: 'shortage' | 'zero' | 'precision' | 'service' | 'empty'): CharacterLifeSessionState {
  233 |   const s = makeLifeWithNpcs(), settlement = s.city.world.settlements[s.city.world.activeSettlementId!];
  234 |   if (kind === 'shortage') {
  235 |     settlement.inventory.food = 0; settlement.inventory.wheat = 0;
  236 |     for (const tile of s.city.tiles) if (tile.building) tile.building.workers = 0;
  237 |   } else if (kind === 'zero') {
  238 |     for (const cohort of settlement.cohorts) cohort.count = 0;
  239 |     for (const tile of s.city.tiles) if (tile.building) tile.building.workers = 0;
  240 |     Object.assign(s.city.society!.classes,{free:0,makers:{common:0,elite:0},luminaries:{common:0,elite:0},merchants:{common:0,elite:0},bound:{free:0,makers:0,luminaries:0,merchants:0}});
  241 |     settlement.inventory.gold = 0;
  242 |   } else if (kind === 'precision') {
  243 |     settlement.inventory.gold = 100001; settlement.inventory.wheat = 100001;
  244 |     settlement.inventory.food = 1;
  245 |     settlement.inventory.wood = 1000001;
  246 |     s.city.tiles.find(t => t.id === 'field-1')!.building!.workers = 0;
  247 |     s.city.tiles.find(t => t.id === 'plain-1')!.building!.workers = 1;
  248 |   } else if (kind === 'service') {
```