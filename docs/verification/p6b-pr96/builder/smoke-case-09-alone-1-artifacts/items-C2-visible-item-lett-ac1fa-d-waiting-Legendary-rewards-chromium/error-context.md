# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: items.spec.ts >> C2 visible item letters include stack loss, storage-full loss, expiry, delivered and waiting Legendary rewards
- Location: tests\e2e\items.spec.ts:124:1

# Error details

```
Error: expect(received).toHaveLength(expected)

Expected length: 1
Received length: 2
Received array:  [["common-hand", {"basePriceMilli": 5000, "category": "accessory", "kind": "player", "mainStat": "technical", "name": "Plain Hand", "rarity": "common", "regen": 1, "slot": "hand"}], ["common-hand-npc", {"basePriceMilli": 5000, "category": "accessory", "kind": "npc", "mainStat": "technical", "name": "Plain Hand", "rarity": "common", "slot": "hand"}]]
```

# Page snapshot

```yaml
- main [ref=e3]:
  - complementary "Life status and navigation" [ref=e4]:
    - navigation "Main" [ref=e5]:
      - generic [ref=e6]:
        - heading "Character Life" [level=1] [ref=e7]
        - paragraph [ref=e8]: Week 2 · Year 1 · Report
        - paragraph [ref=e9]: Health 100 / 100 · Regen +1/week
        - button "Report open — Plan next week in Report" [disabled] [ref=e10]
        - paragraph [ref=e11]: Week 1 · Year 1 report open. Choose Plan next week in Report before changing the plan.
        - status [ref=e12]: Week 1 · Year 1 report ready.
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
            - heading "Week 1 · Year 1 report" [level=2] [ref=e35]
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
                - definition [ref=e50]: Crown of Embers · Calm city
              - generic [ref=e51]:
                - term [ref=e52]: Reward waiting
                - definition [ref=e53]: Authority 90+ for 4 weeks · Make room in inventory or temporary storage.
              - generic [ref=e54]:
                - term [ref=e55]: Gold
                - definition [ref=e56]: 997 → 998.55
              - generic [ref=e57]:
                - term [ref=e58]: Upkeep paid
                - definition [ref=e59]: −2.5
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
                      - cell "Calm city" [ref=e72]
                      - cell "Crown of Embers" [ref=e73]
                - table [ref=e74]:
                  - caption [ref=e75]: Rewards waiting
                  - rowgroup [ref=e76]:
                    - row [ref=e77]:
                      - columnheader "Goal" [ref=e78]
                      - columnheader "Status" [ref=e79]
                  - rowgroup [ref=e80]:
                    - row [ref=e81]:
                      - cell "Authority 90+ for 4 weeks" [ref=e82]
                      - cell "Make room in inventory or temporary storage." [ref=e83]
              - generic [ref=e84]:
                - heading "Gold and upkeep" [level=3] [ref=e85]
                - paragraph [ref=e86]: "Tax: 3.6 Gold. Upkeep covered: 2.5 Gold; unfunded: 0 Gold (no debt). Farm batch payment: 2 Gold; extra Farm upkeep: 0 Gold."
              - group [ref=e87]:
                - generic "How this is calculated" [active] [ref=e88] [cursor=pointer]
                - paragraph [ref=e89]: Stock change is closing stock minus opening stock for this resolved week. It is not gross production or a forecast.
                - paragraph [ref=e90]: "TRIAL: each class eats and uses Goods separately; the Bound eat last. Missing Food, Goods or housing lowers that class's satisfaction and stops its arrivals. Each class supplies 1 WF per 10 residents; Elites do not work."
                - paragraph [ref=e91]: "Immigration target: 90. Useful worker slots: 12. Renewable Food: 4. Reason: no-capacity."
              - region "Laws" [ref=e92]:
                - heading "Laws" [level=3] [ref=e93]
                - paragraph [ref=e94]: No laws in force.
          - region "Quartermaster" [ref=e95]:
            - paragraph [ref=e96]: Quartermaster
            - generic [ref=e98]: Watch
            - heading "Some stores spoiled" [level=3] [ref=e99]
            - generic [ref=e100]:
              - generic [ref=e101]:
                - term [ref=e102]: Material lost
                - definition [ref=e103]: Iron · ore-1 · stack full (999)
              - generic [ref=e104]:
                - term [ref=e105]: Item lost
                - definition [ref=e106]: Plain Hand · inventory and temporary storage full
              - generic [ref=e107]:
                - term [ref=e108]: Expired item
                - definition [ref=e109]: Fine Ring
              - generic [ref=e110]:
                - term [ref=e111]: Spoiled
                - definition [ref=e112]: Food −960 · Wood −959 · Iron −960
            - group [ref=e113]:
              - generic "Details" [ref=e114] [cursor=pointer]
              - region "Quartermaster item details" [ref=e115]:
                - heading "Items this week" [level=4] [ref=e116]
                - table [ref=e117]:
                  - caption [ref=e118]: Materials this week
                  - rowgroup [ref=e119]:
                    - row [ref=e120]:
                      - columnheader "Plot" [ref=e121]
                      - columnheader "Material" [ref=e122]
                      - columnheader "Outcome" [ref=e123]
                  - rowgroup [ref=e124]:
                    - row [ref=e125]:
                      - cell "ore-1" [ref=e126]
                      - cell "Iron" [ref=e127]
                      - 'cell "Lost: stack full (999)" [ref=e128]'
                - table [ref=e129]:
                  - caption [ref=e130]: Item found
                  - rowgroup [ref=e131]:
                    - row [ref=e132]:
                      - columnheader "Item" [ref=e133]
                      - columnheader "Outcome" [ref=e134]
                  - rowgroup [ref=e135]:
                    - row [ref=e136]:
                      - cell "Plain Hand" [ref=e137]
                      - 'cell "Lost: inventory and temporary storage full" [ref=e138]'
                - table [ref=e139]:
                  - caption [ref=e140]: Expired items
                  - rowgroup [ref=e141]:
                    - row [ref=e142]:
                      - columnheader "Item" [ref=e143]
                  - rowgroup [ref=e144]:
                    - row [ref=e145]:
                      - cell "Fine Ring" [ref=e146]
                - group "Recovery this week" [ref=e147]:
                  - generic [ref=e148]:
                    - term [ref=e149]: Hospital operated
                    - definition [ref=e150]: "No"
                  - generic [ref=e151]:
                    - term [ref=e152]: Regeneration
                    - definition [ref=e153]: "+1"
              - generic [ref=e154]:
                - heading "Needs and services" [level=3] [ref=e155]
                - paragraph [ref=e156]: "Food consumed: 4 / 4 · 100%."
                - paragraph [ref=e157]: "Food unmet: 0."
                - paragraph [ref=e158]: "Goods service: 1.45 / 1.45 · 100%. Materials used once: 0 Wood, 0 Iron. Revenue: 1.45 Gold."
                - paragraph [ref=e159]: "Goods stock: opening 10 · produced 0 · distributed 1.45 · closing 8.55. Demand 1.45; unmet 0; capacity 2; limited by none."
                - paragraph [ref=e160]: "Goods unmet: 0."
              - region "Weekly stock ledger scroll area" [ref=e161]:
                - table [ref=e162]:
                  - caption [ref=e163]: Weekly stock ledger
                  - rowgroup [ref=e164]:
                    - row [ref=e165]:
                      - columnheader "Stock" [ref=e166]
                      - columnheader "Before" [ref=e167]
                      - columnheader "Stock change" [ref=e168]
                      - columnheader "After" [ref=e169]
                  - rowgroup [ref=e170]:
                    - row [ref=e171]:
                      - rowheader "gold" [ref=e172]
                      - cell "997" [ref=e173]
                      - cell "1.55" [ref=e174]
                      - cell "998.55" [ref=e175]
                    - row [ref=e176]:
                      - rowheader "wheat" [ref=e177]
                      - cell "0" [ref=e178]
                      - cell "0" [ref=e179]
                      - cell "0" [ref=e180]
                    - row [ref=e181]:
                      - rowheader "food" [ref=e182]
                      - cell "1,000" [ref=e183]
                      - cell "-960" [ref=e184]
                      - cell "40" [ref=e185]
                    - row [ref=e186]:
                      - rowheader "wood" [ref=e187]
                      - cell "999" [ref=e188]
                      - cell "-959" [ref=e189]
                      - cell "40" [ref=e190]
                    - row [ref=e191]:
                      - rowheader "iron" [ref=e192]
                      - cell "1,000" [ref=e193]
                      - cell "-960" [ref=e194]
                      - cell "40" [ref=e195]
              - group [ref=e196]:
                - generic "Building activity" [ref=e197] [cursor=pointer]
                - list [ref=e198]:
                  - listitem [ref=e199]: "field-1: Farm 2 batches; batch Gold credited against this Farm upkeep."
                  - listitem [ref=e200]: "ore-1: extracted Iron."
                  - listitem [ref=e201]: "plain-1: Food Processor 2 batches."
              - region "Outside report" [ref=e202]:
                - heading "Outside" [level=3] [ref=e203]
                - paragraph [ref=e204]: "960 Food spoiled: storage full."
                - paragraph [ref=e205]: "959 Wood spoiled: storage full."
                - paragraph [ref=e206]: "960 Iron spoiled: storage full."
                - generic [ref=e207]:
                  - generic [ref=e208]:
                    - term [ref=e209]: wood produced
                    - definition [ref=e210]: "0"
                  - generic [ref=e211]:
                    - term [ref=e212]: iron produced
                    - definition [ref=e213]: "0"
                  - generic [ref=e214]:
                    - term [ref=e215]: stone produced
                    - definition [ref=e216]: "0"
                  - generic [ref=e217]:
                    - term [ref=e218]: wool produced
                    - definition [ref=e219]: "0"
                  - generic [ref=e220]:
                    - term [ref=e221]: herbs produced
                    - definition [ref=e222]: "0"
                  - generic [ref=e223]:
                    - term [ref=e224]: cloth produced
                    - definition [ref=e225]: "0"
                  - generic [ref=e226]:
                    - term [ref=e227]: stone stock before / after
                    - definition [ref=e228]: 0 / 0
                  - generic [ref=e229]:
                    - term [ref=e230]: wool stock before / after
                    - definition [ref=e231]: 0 / 0
                  - generic [ref=e232]:
                    - term [ref=e233]: cloth stock before / after
                    - definition [ref=e234]: 0 / 0
                  - generic [ref=e235]:
                    - term [ref=e236]: herbs stock before / after
                    - definition [ref=e237]: 0 / 0
          - region "Census clerk" [ref=e238]:
            - paragraph [ref=e239]: Census clerk
            - generic [ref=e241]: News
            - heading "The census is unchanged" [level=3] [ref=e242]
            - generic [ref=e243]:
              - generic [ref=e244]:
                - term [ref=e245]: Free residents
                - definition [ref=e246]: 80 → 82
              - generic [ref=e247]:
                - term [ref=e248]: Makers
                - definition [ref=e249]: 80 → 82
              - generic [ref=e250]:
                - term [ref=e251]: Luminaries
                - definition [ref=e252]: 80 → 82
              - generic [ref=e253]:
                - term [ref=e254]: Merchants
                - definition [ref=e255]: 80 → 82
            - group [ref=e256]:
              - generic "Details" [ref=e257] [cursor=pointer]
              - generic [ref=e258]:
                - heading "Population and happiness" [level=3] [ref=e259]
                - paragraph [ref=e260]: "Population: 100 → 100 · 0 arrivals · Available next week."
                - paragraph [ref=e261]: "Happiness: 80 → 82."
              - region "Society this week" [ref=e262]:
                - region "Classes this week scroll area" [ref=e263]:
                  - table [ref=e264]:
                    - caption [ref=e265]: Classes this week
                    - rowgroup [ref=e266]:
                      - row [ref=e267]:
                        - columnheader "Class" [ref=e268]
                        - columnheader "Food" [ref=e269]
                        - columnheader "Goods" [ref=e270]
                        - columnheader "Luxury" [ref=e271]
                        - columnheader "Satisfaction" [ref=e272]
                        - columnheader "Arrivals" [ref=e273]
                        - columnheader "Trained" [ref=e274]
                        - columnheader "Enslaved" [ref=e275]
                    - rowgroup [ref=e276]:
                      - row [ref=e277]:
                        - rowheader "Free residents" [ref=e278]
                        - cell "100%" [ref=e279]
                        - cell "100%" [ref=e280]
                        - cell "—" [ref=e281]
                        - cell "80 → 82" [ref=e282]
                        - cell "0" [ref=e283]
                        - cell "0" [ref=e284]
                        - cell "0" [ref=e285]
                      - row [ref=e286]:
                        - rowheader "Makers" [ref=e287]
                        - cell "100%" [ref=e288]
                        - cell "100%" [ref=e289]
                        - cell "—" [ref=e290]
                        - cell "80 → 82" [ref=e291]
                        - cell "0" [ref=e292]
                        - cell "0" [ref=e293]
                        - cell "0" [ref=e294]
                      - row [ref=e295]:
                        - rowheader "Luminaries" [ref=e296]
                        - cell "100%" [ref=e297]
                        - cell "100%" [ref=e298]
                        - cell "—" [ref=e299]
                        - cell "80 → 82" [ref=e300]
                        - cell "0" [ref=e301]
                        - cell "0" [ref=e302]
                        - cell "0" [ref=e303]
                      - row [ref=e304]:
                        - rowheader "Merchants" [ref=e305]
                        - cell "100%" [ref=e306]
                        - cell "100%" [ref=e307]
                        - cell "—" [ref=e308]
                        - cell "80 → 82" [ref=e309]
                        - cell "0" [ref=e310]
                        - cell "0" [ref=e311]
                        - cell "0" [ref=e312]
                      - row [ref=e313]:
                        - rowheader "The Bound" [ref=e314]
                        - cell "100%" [ref=e315]
                        - cell "100%" [ref=e316]
                        - cell "—" [ref=e317]
                        - cell "80 → 80" [ref=e318]
                        - cell "0" [ref=e319]
                        - cell "0" [ref=e320]
                        - cell "0" [ref=e321]
                - list [ref=e322]:
                  - listitem [ref=e323]: Some Free residents had no work, so debt pressure rose.
                  - listitem [ref=e324]: Some Luminaries had no work, so debt pressure rose.
                  - listitem [ref=e325]: Some Merchants had no work, so debt pressure rose.
                - paragraph [ref=e326]: "Bound Desperation: 0 → 0"
                - paragraph [ref=e327]: "Luxury imported: 0. Training cost: 0 Gold."
          - region "Captain of the watch" [ref=e328]:
            - paragraph [ref=e329]: Captain of the watch
            - generic [ref=e331]: News
            - heading "The streets are quiet" [level=3] [ref=e332]
            - generic [ref=e333]:
              - generic [ref=e334]:
                - term [ref=e335]: Security
                - definition [ref=e336]: 30 → 25
              - generic [ref=e337]:
                - term [ref=e338]: Crime
                - definition [ref=e339]: 10 → 5
              - generic [ref=e340]:
                - term [ref=e341]: Authority
                - definition [ref=e342]: 100 → 97
              - term [ref=e344]: "Authority 100: taxes +20%."
            - group [ref=e345]:
              - generic "Details" [ref=e346] [cursor=pointer]
          - region "Word from the streets" [ref=e347]:
            - paragraph [ref=e348]: Word from the streets
            - generic [ref=e350]: News
            - heading "The streets are calm" [level=3] [ref=e351]
            - generic [ref=e352]:
              - generic [ref=e353]:
                - term [ref=e354]: Tension
                - definition [ref=e355]: 0 → 0
              - generic [ref=e356]:
                - term [ref=e357]: Desperation
                - definition [ref=e358]: 0 → 0
            - group [ref=e359]:
              - generic "Details" [ref=e360] [cursor=pointer]
        - paragraph [aria-hidden] [ref=e361]: Your steward
        - button "Plan next week" [ref=e362] [cursor=pointer]
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