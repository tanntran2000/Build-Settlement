# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: character-life-navigation.spec.ts >> all Life calendar surfaces cross year boundaries
- Location: tests\e2e\character-life-navigation.spec.ts:265:1

# Error details

```
Error: expect(received).toHaveLength(expected)

Expected length: 1
Received length: 2
Received array:  [["common-top", {"basePriceMilli": 5000, "category": "outfit", "kind": "player", "mainStat": "combat", "name": "Plain Top", "rarity": "common", "regen": 1, "slot": "top"}], ["common-top-npc", {"basePriceMilli": 5000, "category": "outfit", "kind": "npc", "mainStat": "combat", "name": "Plain Top", "rarity": "common", "slot": "top"}]]
```

# Page snapshot

```yaml
- main [ref=e3]:
  - complementary "Life status and navigation" [ref=e4]:
    - navigation "Main" [ref=e5]:
      - generic [ref=e6]:
        - heading "Character Life" [level=1] [ref=e7]
        - paragraph [ref=e8]: Week 1 · Year 3 · Report
        - paragraph [ref=e9]: Health 100 / 100 · Regen +1/week
        - button "Report open — Plan next week in Report" [disabled] [ref=e10]
        - paragraph [ref=e11]: Week 40 · Year 2 report open. Choose Plan next week in Report before changing the plan.
        - status [ref=e12]: Week 40 · Year 2 report ready.
        - button "Information" [ref=e13] [cursor=pointer]
      - generic [ref=e14]:
        - button "Player" [ref=e15] [cursor=pointer]
        - button "Population" [ref=e16] [cursor=pointer]
      - generic [ref=e17]:
        - button "Session" [ref=e18] [cursor=pointer]
        - button "Help" [ref=e19] [cursor=pointer]
        - button "Options" [ref=e20] [cursor=pointer]
        - button "Main menu" [disabled] [ref=e21]
        - paragraph [ref=e22]: Plan next week first.
  - generic [ref=e23]:
    - generic [ref=e24]:
      - heading "Report" [level=2] [ref=e25]
      - navigation "Views" [ref=e26]:
        - button "City" [ref=e27] [cursor=pointer]
        - button "Characters" [ref=e28] [cursor=pointer]
        - button "Report" [ref=e29] [cursor=pointer]:
          - text: Report
          - generic [aria-hidden] [ref=e30]: New
    - region "Report" [ref=e31]:
      - region "Weekly city report" [ref=e32]:
        - generic [ref=e33]:
          - generic [ref=e34]:
            - heading "Week 40 · Year 2 report" [level=2] [ref=e35]
            - paragraph [aria-hidden] [ref=e36]: To the Lord of Haven
          - generic [ref=e37]:
            - generic [ref=e38]: Food 100%
            - generic [ref=e39]: Goods 100%
            - generic [ref=e40]: Happiness +2
        - generic [ref=e41]:
          - region "Your steward" [ref=e42]:
            - paragraph [ref=e43]: Your steward
            - generic [ref=e45]: News
            - heading "The treasury grew" [level=3] [ref=e46]
            - generic [ref=e47]:
              - generic [ref=e48]:
                - term [ref=e49]: Legendary earned
                - definition [ref=e50]: Crown of Embers · Week 52
              - generic [ref=e51]:
                - term [ref=e52]: Gold
                - definition [ref=e53]: 45 → 46.45
              - generic [ref=e54]:
                - term [ref=e55]: Tax
                - definition [ref=e56]: "+3"
              - generic [ref=e57]:
                - term [ref=e58]: Upkeep paid
                - definition [ref=e59]: −2
            - group [ref=e60]:
              - generic "Details" [ref=e61] [cursor=pointer]
              - region "Steward item details" [ref=e62]:
                - heading "Rewards" [level=4] [ref=e63]
                - table [ref=e64]:
                  - caption [ref=e65]: Legendary rewards
                  - rowgroup [ref=e66]:
                    - row [ref=e67]:
                      - columnheader "Goal" [ref=e68]
                      - columnheader "Item" [ref=e69]
                  - rowgroup [ref=e70]:
                    - row [ref=e71]:
                      - cell "Week 52" [ref=e72]
                      - cell "Crown of Embers" [ref=e73]
                - table [ref=e74]:
                  - caption [ref=e75]: Rewards waiting
                  - rowgroup [ref=e76]:
                    - row [ref=e77]:
                      - columnheader "Goal" [ref=e78]
                      - columnheader "Status" [ref=e79]
                  - rowgroup
                - paragraph [ref=e80]: No rewards waiting.
              - generic [ref=e81]:
                - heading "Gold and upkeep" [level=3] [ref=e82]
                - paragraph [ref=e83]: "Tax: 3 Gold. Upkeep covered: 2 Gold; unfunded: 0 Gold (no debt). Farm batch payment: 2 Gold; extra Farm upkeep: 0 Gold."
              - group [ref=e84]:
                - generic "How this is calculated" [active] [ref=e85] [cursor=pointer]
                - paragraph [ref=e86]: Stock change is closing stock minus opening stock for this resolved week. It is not gross production or a forecast.
                - paragraph [ref=e87]: "TRIAL: each class eats and uses Goods separately; the Bound eat last. Missing Food, Goods or housing lowers that class's satisfaction and stops its arrivals. Each class supplies 1 WF per 10 residents; Elites do not work."
                - paragraph [ref=e88]: "Immigration target: 90. Useful worker slots: 10. Renewable Food: 4. Reason: no-capacity."
              - region "Laws" [ref=e89]:
                - heading "Laws" [level=3] [ref=e90]
                - paragraph [ref=e91]: No laws in force.
          - region "Quartermaster" [ref=e92]:
            - paragraph [ref=e93]: Quartermaster
            - generic [ref=e95]: News
            - heading "The stores are full" [level=3] [ref=e96]
            - generic [ref=e97]:
              - generic [ref=e98]:
                - term [ref=e99]: Item found
                - definition [ref=e100]: Plain Top · inventory
              - generic [ref=e101]:
                - term [ref=e102]: Food eaten
                - definition [ref=e103]: 4 of 4
              - generic [ref=e104]:
                - term [ref=e105]: Goods served
                - definition [ref=e106]: 1.45 of 1.45
            - group [ref=e107]:
              - generic "Details" [ref=e108] [cursor=pointer]
              - region "Quartermaster item details" [ref=e109]:
                - heading "Items this week" [level=4] [ref=e110]
                - table [ref=e111]:
                  - caption [ref=e112]: Materials this week
                  - rowgroup [ref=e113]:
                    - row [ref=e114]:
                      - columnheader "Plot" [ref=e115]
                      - columnheader "Material" [ref=e116]
                      - columnheader "Outcome" [ref=e117]
                  - rowgroup
                - paragraph [ref=e118]: No materials found.
                - table [ref=e119]:
                  - caption [ref=e120]: Item found
                  - rowgroup [ref=e121]:
                    - row [ref=e122]:
                      - columnheader "Item" [ref=e123]
                      - columnheader "Outcome" [ref=e124]
                  - rowgroup [ref=e125]:
                    - row [ref=e126]:
                      - cell "Plain Top" [ref=e127]
                      - cell "Inventory" [ref=e128]
                - table [ref=e129]:
                  - caption [ref=e130]: Expired items
                  - rowgroup [ref=e131]:
                    - row [ref=e132]:
                      - columnheader "Item" [ref=e133]
                  - rowgroup
                - paragraph [ref=e134]: No items expired.
                - group "Recovery this week" [ref=e135]:
                  - generic [ref=e136]:
                    - term [ref=e137]: Hospital operated
                    - definition [ref=e138]: "No"
                  - generic [ref=e139]:
                    - term [ref=e140]: Regeneration
                    - definition [ref=e141]: "+1"
              - generic [ref=e142]:
                - heading "Needs and services" [level=3] [ref=e143]
                - paragraph [ref=e144]: "Food consumed: 4 / 4 · 100%."
                - paragraph [ref=e145]: "Food unmet: 0."
                - paragraph [ref=e146]: "Goods service: 1.45 / 1.45 · 100%. Materials used once: 0 Wood, 0 Iron. Revenue: 1.45 Gold."
                - paragraph [ref=e147]: "Goods stock: opening 10 · produced 0 · distributed 1.45 · closing 8.55. Demand 1.45; unmet 0; capacity 2; limited by none."
                - paragraph [ref=e148]: "Goods unmet: 0."
              - region "Weekly stock ledger scroll area" [ref=e149]:
                - table [ref=e150]:
                  - caption [ref=e151]: Weekly stock ledger
                  - rowgroup [ref=e152]:
                    - row [ref=e153]:
                      - columnheader "Stock" [ref=e154]
                      - columnheader "Before" [ref=e155]
                      - columnheader "Stock change" [ref=e156]
                      - columnheader "After" [ref=e157]
                  - rowgroup [ref=e158]:
                    - row [ref=e159]:
                      - rowheader "gold" [ref=e160]
                      - cell "45" [ref=e161]
                      - cell "1.45" [ref=e162]
                      - cell "46.45" [ref=e163]
                    - row [ref=e164]:
                      - rowheader "wheat" [ref=e165]
                      - cell "0" [ref=e166]
                      - cell "0" [ref=e167]
                      - cell "0" [ref=e168]
                    - row [ref=e169]:
                      - rowheader "food" [ref=e170]
                      - cell "20" [ref=e171]
                      - cell "0" [ref=e172]
                      - cell "20" [ref=e173]
                    - row [ref=e174]:
                      - rowheader "wood" [ref=e175]
                      - cell "8" [ref=e176]
                      - cell "0" [ref=e177]
                      - cell "8" [ref=e178]
                    - row [ref=e179]:
                      - rowheader "iron" [ref=e180]
                      - cell "4" [ref=e181]
                      - cell "0" [ref=e182]
                      - cell "4" [ref=e183]
              - group [ref=e184]:
                - generic "Building activity" [ref=e185] [cursor=pointer]
                - list [ref=e186]:
                  - listitem [ref=e187]: "field-1: Farm 2 batches; batch Gold credited against this Farm upkeep."
                  - listitem [ref=e188]: "plain-1: Food Processor 2 batches."
              - region "Outside report" [ref=e189]:
                - heading "Outside" [level=3] [ref=e190]
                - generic [ref=e191]:
                  - generic [ref=e192]:
                    - term [ref=e193]: wood produced
                    - definition [ref=e194]: "0"
                  - generic [ref=e195]:
                    - term [ref=e196]: iron produced
                    - definition [ref=e197]: "0"
                  - generic [ref=e198]:
                    - term [ref=e199]: stone produced
                    - definition [ref=e200]: "0"
                  - generic [ref=e201]:
                    - term [ref=e202]: wool produced
                    - definition [ref=e203]: "0"
                  - generic [ref=e204]:
                    - term [ref=e205]: herbs produced
                    - definition [ref=e206]: "0"
                  - generic [ref=e207]:
                    - term [ref=e208]: cloth produced
                    - definition [ref=e209]: "0"
                  - generic [ref=e210]:
                    - term [ref=e211]: stone stock before / after
                    - definition [ref=e212]: 0 / 0
                  - generic [ref=e213]:
                    - term [ref=e214]: wool stock before / after
                    - definition [ref=e215]: 0 / 0
                  - generic [ref=e216]:
                    - term [ref=e217]: cloth stock before / after
                    - definition [ref=e218]: 0 / 0
                  - generic [ref=e219]:
                    - term [ref=e220]: herbs stock before / after
                    - definition [ref=e221]: 0 / 0
          - region "Census clerk" [ref=e222]:
            - paragraph [ref=e223]: Census clerk
            - generic [ref=e225]: News
            - heading "The census is unchanged" [level=3] [ref=e226]
            - generic [ref=e227]:
              - generic [ref=e228]:
                - term [ref=e229]: Free residents
                - definition [ref=e230]: 80 → 82
              - generic [ref=e231]:
                - term [ref=e232]: Makers
                - definition [ref=e233]: 80 → 82
              - generic [ref=e234]:
                - term [ref=e235]: Luminaries
                - definition [ref=e236]: 80 → 82
              - generic [ref=e237]:
                - term [ref=e238]: Merchants
                - definition [ref=e239]: 80 → 82
            - group [ref=e240]:
              - generic "Details" [ref=e241] [cursor=pointer]
              - generic [ref=e242]:
                - heading "Population and happiness" [level=3] [ref=e243]
                - paragraph [ref=e244]: "Population: 100 → 100 · 0 arrivals · Available next week."
                - paragraph [ref=e245]: "Happiness: 80 → 82."
              - region "Society this week" [ref=e246]:
                - region "Classes this week scroll area" [ref=e247]:
                  - table [ref=e248]:
                    - caption [ref=e249]: Classes this week
                    - rowgroup [ref=e250]:
                      - row [ref=e251]:
                        - columnheader "Class" [ref=e252]
                        - columnheader "Food" [ref=e253]
                        - columnheader "Goods" [ref=e254]
                        - columnheader "Luxury" [ref=e255]
                        - columnheader "Satisfaction" [ref=e256]
                        - columnheader "Arrivals" [ref=e257]
                        - columnheader "Trained" [ref=e258]
                        - columnheader "Enslaved" [ref=e259]
                    - rowgroup [ref=e260]:
                      - row [ref=e261]:
                        - rowheader "Free residents" [ref=e262]
                        - cell "100%" [ref=e263]
                        - cell "100%" [ref=e264]
                        - cell "—" [ref=e265]
                        - cell "80 → 82" [ref=e266]
                        - cell "0" [ref=e267]
                        - cell "0" [ref=e268]
                        - cell "0" [ref=e269]
                      - row [ref=e270]:
                        - rowheader "Makers" [ref=e271]
                        - cell "100%" [ref=e272]
                        - cell "100%" [ref=e273]
                        - cell "—" [ref=e274]
                        - cell "80 → 82" [ref=e275]
                        - cell "0" [ref=e276]
                        - cell "0" [ref=e277]
                        - cell "0" [ref=e278]
                      - row [ref=e279]:
                        - rowheader "Luminaries" [ref=e280]
                        - cell "100%" [ref=e281]
                        - cell "100%" [ref=e282]
                        - cell "—" [ref=e283]
                        - cell "80 → 82" [ref=e284]
                        - cell "0" [ref=e285]
                        - cell "0" [ref=e286]
                        - cell "0" [ref=e287]
                      - row [ref=e288]:
                        - rowheader "Merchants" [ref=e289]
                        - cell "100%" [ref=e290]
                        - cell "100%" [ref=e291]
                        - cell "—" [ref=e292]
                        - cell "80 → 82" [ref=e293]
                        - cell "0" [ref=e294]
                        - cell "0" [ref=e295]
                        - cell "0" [ref=e296]
                      - row [ref=e297]:
                        - rowheader "The Bound" [ref=e298]
                        - cell "100%" [ref=e299]
                        - cell "100%" [ref=e300]
                        - cell "—" [ref=e301]
                        - cell "80 → 80" [ref=e302]
                        - cell "0" [ref=e303]
                        - cell "0" [ref=e304]
                        - cell "0" [ref=e305]
                - list [ref=e306]:
                  - listitem [ref=e307]: Some Free residents had no work, so debt pressure rose.
                  - listitem [ref=e308]: Some Luminaries had no work, so debt pressure rose.
                  - listitem [ref=e309]: Some Merchants had no work, so debt pressure rose.
                - paragraph [ref=e310]: "Bound Desperation: 0 → 0"
                - paragraph [ref=e311]: "Luxury imported: 0. Training cost: 0 Gold."
          - region "Captain of the watch" [ref=e312]:
            - paragraph [ref=e313]: Captain of the watch
            - generic [ref=e315]: News
            - heading "The streets are quiet" [level=3] [ref=e316]
            - generic [ref=e317]:
              - generic [ref=e318]:
                - term [ref=e319]: Security
                - definition [ref=e320]: 30 → 25
              - generic [ref=e321]:
                - term [ref=e322]: Crime
                - definition [ref=e323]: 10 → 5
              - generic [ref=e324]:
                - term [ref=e325]: Authority
                - definition [ref=e326]: 50 → 47
              - term [ref=e328]: "Garrison: 0 soldiers, Security +0."
            - group [ref=e329]:
              - generic "Details" [ref=e330] [cursor=pointer]
          - region "Word from the streets" [ref=e331]:
            - paragraph [ref=e332]: Word from the streets
            - generic [ref=e334]: News
            - heading "The streets are calm" [level=3] [ref=e335]
            - generic [ref=e336]:
              - generic [ref=e337]:
                - term [ref=e338]: Tension
                - definition [ref=e339]: 0 → 0
              - generic [ref=e340]:
                - term [ref=e341]: Desperation
                - definition [ref=e342]: 0 → 0
            - group [ref=e343]:
              - generic "Details" [ref=e344] [cursor=pointer]
        - paragraph [aria-hidden] [ref=e345]: Your steward
        - button "Plan next week" [ref=e346] [cursor=pointer]
```

# Test source

```ts
  139 |   expect(Number.isSafeInteger(year) && year >= 1).toBe(true);
  140 |   expect(Number.isInteger(weekOfYear) && weekOfYear >= 1 && weekOfYear <= 40).toBe(true);
  141 |   const absolute = (year - 1) * 40 + weekOfYear;
  142 |   expect(Number.isSafeInteger(absolute)).toBe(true);
  143 |   return absolute;
  144 | }
  145 | 
  146 | export function reportFulfillment(supplied: number, demand: number): string {
  147 |   if (demand === 0) return 'No demand';
  148 |   return `${Number(BigInt(supplied) * 10000n / BigInt(demand)) / 100}%`;
  149 | }
  150 | 
  151 | export const requirementsRegion = (page: Page) => page.getByRole('region', { name: 'City Requirements', exact: true });
  152 | 
  153 | export async function expectRequirements(page: Page, report: Readonly<TileTrialReport> | null) {
  154 |   const strip = requirementsRegion(page);
  155 |   await expect(strip).toBeVisible();
  156 |   if (!report) {
  157 |     await expect(strip.getByText('No resolved week yet', { exact: true })).toBeVisible();
  158 |     expect(await strip.textContent()).not.toContain('%');
  159 |     await expect(strip.locator('[data-fulfillment-track]')).toHaveCount(0);
  160 |     return;
  161 |   }
  162 |   const label = strip.getByText(/^Last resolved week:/);
  163 |   expect(reportWeek((await label.textContent())!.replace('Last resolved week: ', '') + ' report')).toBe(report.week);
  164 |   for (const [key, supplied, demand] of [['food', report.foodConsumedMilli, report.foodDemandMilli], ['goods', report.goods.servedMilli, report.goods.demandMilli]] as const) {
  165 |     const row = strip.getByTestId(`life-requirement-${key}`);
  166 |     await expect(row).toHaveText(`${reportUnits(supplied)} / ${reportUnits(demand)} · ${reportFulfillment(supplied, demand)}`);
  167 |     const track = strip.locator(`[data-fulfillment-track="${key}"]`);
  168 |     if (demand === 0) {
  169 |       expect(await row.textContent()).not.toContain('%');
  170 |       await expect(track).toHaveCount(0);
  171 |     } else {
  172 |       await expect(track).toHaveAttribute('aria-hidden', 'true');
  173 |       await expect(track).toHaveCSS('height', '8px');
  174 |       expect(await track.locator('span').evaluate(node => node.style.width)).toBe(reportFulfillment(supplied, demand));
  175 |     }
  176 |   }
  177 | }
  178 | 
  179 | // Selectively adapted from QOL 8c8505f: fixture data only, no historical verdicts.
  180 | export function reportFixture(kind: 'shortage' | 'zero' | 'precision' | 'service' | 'empty'): CharacterLifeSessionState {
  181 |   const s = makeLife(), settlement = s.city.world.settlements[s.city.world.activeSettlementId!];
  182 |   if (kind === 'shortage') {
  183 |     settlement.inventory.food = 0; settlement.inventory.wheat = 0;
  184 |     for (const tile of s.city.tiles) if (tile.building) tile.building.workers = 0;
  185 |   } else if (kind === 'zero') {
  186 |     for (const cohort of settlement.cohorts) cohort.count = 0;
  187 |     for (const tile of s.city.tiles) if (tile.building) tile.building.workers = 0;
  188 |     Object.assign(s.city.society!.classes,{free:0,makers:{common:0,elite:0},luminaries:{common:0,elite:0},merchants:{common:0,elite:0},bound:{free:0,makers:0,luminaries:0,merchants:0}});
  189 |     settlement.inventory.gold = 0;
  190 |   } else if (kind === 'precision') {
  191 |     settlement.inventory.gold = 100001; settlement.inventory.wheat = 100001;
  192 |     settlement.inventory.food = 1;
  193 |     settlement.inventory.wood = 1000001;
  194 |     s.city.tiles.find(t => t.id === 'field-1')!.building!.workers = 0;
  195 |     s.city.tiles.find(t => t.id === 'plain-1')!.building!.workers = 1;
  196 |   } else if (kind === 'service') {
  197 |     s.city.tiles.find(t=>t.id==='plain-1')!.building!.workers=1;
  198 |     for (const [id, operation, workers] of [['forest-1', 'logging', 2], ['ore-1', 'mine', 1], ['plain-2', 'goods', 1]] as const) {
  199 |       const typeId = Object.entries(TRIAL_BUILDINGS).find(([, d]) => d.operation === operation)![0];
  200 |       s.city.tiles.find(t => t.id === id)!.building = { typeId, level: 1, workers, enabled: true };
  201 |     }
  202 |   } else {
  203 |     for (const tile of s.city.tiles) if (tile.building) Object.assign(tile.building, { enabled: false, workers: 0 });
  204 |   }
  205 |   expect(isCharacterLifeSessionState(s)).toBe(true);
  206 |   return s;
  207 | }
  208 | 
  209 | export const reportRegion = (page: Page) => page.locator('[data-life-view="reports"][data-life-window="report"] [aria-label="Weekly city report"]');
  210 | 
  211 | export async function openReportDetails(page: Page, ...ids: string[]): Promise<void> {
  212 |   for (const id of ids) {
  213 |     const details = reportRegion(page).locator(`[data-letter="${id}"] > details`);
  214 |     if (await details.getAttribute('open') === null) await details.locator(':scope > summary').click();
  215 |   }
  216 | }
  217 | 
  218 | // Read visible tables inside the existing Steward/Quartermaster Details disclosures.
  219 | // Read visible cell text; never copy expected.items or a JSON parity payload.
  220 | async function readItemReport(panel: Locator): Promise<TileTrialReport['items']> {
  221 |   const quartermaster = panel.getByRole('region', { name: 'Quartermaster item details', exact: true });
  222 |   const steward = panel.getByRole('region', { name: 'Steward item details', exact: true });
  223 |   await expect(quartermaster).toBeVisible();
  224 |   await expect(steward).toBeVisible();
  225 |   async function rows(region: Locator, name: string, columns: string[]): Promise<string[][]> {
  226 |     const table = region.getByRole('table', { name, exact: true });
  227 |     await expect(table).toBeVisible();
  228 |     await expect(table.getByRole('columnheader')).toHaveText(columns);
  229 |     const values: string[][] = [];
  230 |     for (const row of await table.locator('tbody > tr').all()) {
  231 |       const cells = await row.locator('th,td').allTextContents();
  232 |       expect(cells).toHaveLength(columns.length);
  233 |       values.push(cells.map(value => value.trim()));
  234 |     }
  235 |     return values;
  236 |   }
  237 |   function definition(name: string): string {
  238 |     const matches = Object.entries(ITEM_CATALOG).filter(([, item]) => item.name === name);
> 239 |     expect(matches).toHaveLength(1);
      |                     ^ Error: expect(received).toHaveLength(expected)
  240 |     return matches[0][0];
  241 |   }
  242 |   function goal(label: string): NonNullable<TileTrialReport['items']['legendary']>['goal'] {
  243 |     const goals = { 'Calm city': 'calm', 'Authority 90+ for 4 weeks': 'authority', 'Week 52': 'week52', 'Research complete': 'research' } as const;
  244 |     expect(Object.hasOwn(goals, label)).toBe(true);
  245 |     return goals[label as keyof typeof goals];
  246 |   }
  247 |   const materials = (await rows(quartermaster, 'Materials this week', ['Plot', 'Material', 'Outcome'])).map(([tileId, name, outcome]) => {
  248 |     expect(['Kept', 'Lost: stack full (999)']).toContain(outcome);
  249 |     return { tileId, materialId: definition(name), lost: outcome === 'Lost: stack full (999)' };
  250 |   });
  251 |   const foundRows = await rows(quartermaster, 'Item found', ['Item', 'Outcome']);
  252 |   expect(foundRows.length).toBeLessThanOrEqual(1);
  253 |   let found: TileTrialReport['items']['found'] = null;
  254 |   if (foundRows.length) {
  255 |     const [name, outcome] = foundRows[0];
  256 |     expect(['Inventory', 'Temporary storage', 'Lost: inventory and temporary storage full']).toContain(outcome);
  257 |     found = { defId: definition(name), stored: outcome === 'Temporary storage', lost: outcome === 'Lost: inventory and temporary storage full' };
  258 |   }
  259 |   const expired = (await rows(quartermaster, 'Expired items', ['Item'])).map(([name]) => definition(name));
  260 |   const legendaryRows = await rows(steward, 'Legendary rewards', ['Goal', 'Item']);
  261 |   expect(legendaryRows.length).toBeLessThanOrEqual(1);
  262 |   const legendary = legendaryRows.length ? { goal: goal(legendaryRows[0][0]), defId: definition(legendaryRows[0][1]) } : null;
  263 |   const pendingLegendary = (await rows(steward, 'Rewards waiting', ['Goal', 'Status'])).map(([label, status]) => {
  264 |     expect(status).toBe('Make room in inventory or temporary storage.');
  265 |     return goal(label);
  266 |   });
  267 |   const recovery = quartermaster.getByRole('group', { name: 'Recovery this week', exact: true });
  268 |   await expect(recovery).toBeVisible();
  269 |   await expect(recovery.locator('dt')).toHaveText(['Hospital operated', 'Regeneration']);
  270 |   const values = await recovery.locator('dd').allTextContents();
  271 |   expect(values).toHaveLength(2);
  272 |   expect(['Yes', 'No']).toContain(values[0]);
  273 |   expect(values[1]).toMatch(/^\+\d+$/);
  274 |   const result: TileTrialReport['items'] = { materials, found, expired, legendary, hospitalOperated: values[0] === 'Yes', regen: Number(values[1].slice(1)) };
  275 |   if (pendingLegendary.length) result.pendingLegendary = pendingLegendary;
  276 |   return result;
  277 | }
  278 | 
  279 | // Read the complete report from rendered text, including the calculation disclosure.
  280 | export async function expectReport(page: Page, expected: Readonly<TileTrialReport>): Promise<TileTrialReport> {
  281 |   const panel = reportRegion(page), u = reportUnits;
  282 |   // Open base letters for visible text/table assertions; read other parity attributes while closed.
  283 |   const closedLetters = [];
  284 |   for (const details of await panel.locator('[data-letter="steward"] > details, [data-letter="quartermaster"] > details, [data-letter="census"] > details').all()) {
  285 |     if (await details.getAttribute('open') === null) {
  286 |       closedLetters.push(details);
  287 |       await details.locator(':scope > summary').click();
  288 |     }
  289 |   }
  290 |   const heading = panel.getByRole('heading', { name: /^Week .* report$/ });
  291 |   await expect(heading).toBeVisible();
  292 |   const absoluteWeek = reportWeek((await heading.textContent())!);
  293 |   expect(absoluteWeek).toBe(expected.week);
  294 |   for (const name of ['Needs and services', 'Gold and upkeep', 'Population and happiness']) await expect(panel.getByRole('heading', { name, exact: true })).toBeVisible();
  295 |   await expect(panel.getByText(`Food consumed: ${u(expected.foodConsumedMilli)} / ${u(expected.foodDemandMilli)} · ${reportFulfillment(expected.foodConsumedMilli, expected.foodDemandMilli)}.`, { exact: true })).toBeVisible();
  296 |   await expect(panel.getByText(`Food unmet: ${u(expected.foodDemandMilli - expected.foodConsumedMilli)}.`, { exact: true })).toBeVisible();
  297 |   await expect(panel.getByText(`Goods unmet: ${u(expected.goods.demandMilli - expected.goods.servedMilli)}.`, { exact: true })).toBeVisible();
  298 |   const goods = panel.getByTestId('trial-goods');
  299 |   await expect(goods).toHaveText(`Goods service: ${u(expected.goods.servedMilli)} / ${u(expected.goods.demandMilli)} · ${expected.goods.demandMilli === 0 ? 'No demand' : `${expected.goods.fulfillmentBps / 100}%`}. Materials used once: ${u(expected.goods.woodUsed)} Wood, ${u(expected.goods.ironUsed)} Iron. Revenue: ${u(expected.goods.revenueMilli)} Gold.`);
  300 |   const tax = panel.getByText(/^Tax:/);
  301 |   await expect(tax).toHaveText(`Tax: ${u(expected.taxMilli)} Gold. Upkeep covered: ${u(expected.upkeepPaidMilli)} Gold; unfunded: ${u(expected.unpaidUpkeepMilli)} Gold (no debt). Farm batch payment: ${u(expected.farmBatchGoldMilli)} Gold; extra Farm upkeep: ${u(expected.farmExtraUpkeepMilli)} Gold.`);
  302 |   await expect(tax).toBeVisible();
  303 |   const happiness = panel.getByText(/^Happiness:/);
  304 |   await expect(happiness).toHaveText(`Happiness: ${expected.happinessBefore} → ${expected.happinessAfter}.`);
  305 |   const table = panel.getByRole('table', { name: 'Weekly stock ledger', exact: true });
  306 |   await expect(table.getByRole('columnheader')).toHaveText(['Stock', 'Before', 'Stock change', 'After']);
  307 |   for (const th of await table.getByRole('columnheader').all()) await expect(th).toHaveAttribute('scope', 'col');
  308 |   const before = {} as TileTrialReport['before'], after = {} as TileTrialReport['after'];
  309 |   const milli = reportMilli;
  310 |   for (const key of WEEKLY_RESOURCE_KEYS) {
  311 |     const row = table.getByRole('row').filter({ has: page.getByRole('rowheader', { name: key, exact: true }) });
  312 |     await expect(row.getByRole('rowheader')).toHaveAttribute('scope', 'row');
  313 |     await expect(row.locator('th,td')).toHaveText([key, u(expected.before[key]), u(expected.after[key] - expected.before[key]), u(expected.after[key])]);
  314 |     const cells = await row.getByRole('cell').allTextContents();
  315 |     before[key] = milli(cells[0]); after[key] = milli(cells[2]);
  316 |     expect(milli(cells[1])).toBe(after[key] - before[key]);
  317 |   }
  318 |   const activity = panel.locator('details:has(> summary:text-is("Building activity"))');
  319 |   const calculation = panel.locator('details:has(> summary:text-is("How this is calculated"))');
  320 |   const activityOpen = await activity.getAttribute('open') !== null, calculationOpen = await calculation.getAttribute('open') !== null;
  321 |   if (!activityOpen) await activity.locator('summary').click();
  322 |   await expect(activity.locator('li')).toHaveText([...expected.activities]);
  323 |   if (!expected.activities.length) await expect(activity.getByText('No building activity recorded.', { exact: true })).toBeVisible();
  324 |   if (!calculationOpen) await calculation.locator('summary').click();
  325 |   await expect(calculation.getByText('Stock change is closing stock minus opening stock for this resolved week. It is not gross production or a forecast.', { exact: true })).toBeVisible();
  326 |   await expect(calculation.getByText(/^TRIAL: each class eats/)).toBeVisible();
  327 |   const g = (await goods.textContent())!.match(/Goods service: ([\d,]+(?:\.\d+)?) \/ ([\d,]+(?:\.\d+)?) · (No demand|[\d.]+%). Materials used once: ([\d,]+(?:\.\d+)?) Wood, ([\d,]+(?:\.\d+)?) Iron. Revenue: ([\d,]+(?:\.\d+)?) Gold\./)!;
  328 |   const t = (await tax.textContent())!.match(/[\d,]+(?:\.\d+)?(?= Gold)/g)!, h = (await happiness.textContent())!.match(/\d+(?:\.\d+)?/g)!;
  329 |   const food = (await panel.getByText(/^Food consumed:/).textContent())!.match(/[\d,]+(?:\.\d+)?/g)!;
  330 |   if (expected.goods.demandMilli === 0) {
  331 |     expect(g[3]).toBe('No demand');
  332 |     expect(milli(g[1])).toBe(0); expect(milli(g[2])).toBe(0);
  333 |     expect(await goods.textContent()).not.toContain('%');
  334 |   }
  335 |   if (expected.foodDemandMilli === 0) {
  336 |     const foodRow = panel.getByText(/^Food consumed:/);
  337 |     await expect(foodRow).toContainText('No demand');
  338 |     expect(await foodRow.textContent()).not.toContain('%');
  339 |     expect(food.slice(0, 2).map(milli)).toEqual([0, 0]);
```