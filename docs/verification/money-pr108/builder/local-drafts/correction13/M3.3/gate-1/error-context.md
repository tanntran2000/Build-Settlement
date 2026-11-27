# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: character-life-navigation.spec.ts >> fulfillment states match strip and report
- Location: tests\e2e\character-life-navigation.spec.ts:225:1

# Error details

```
Test timeout of 60000ms exceeded.
```

```
Error: expect(locator).toHaveText(expected) failed

Locator:  locator('[data-life-view="reports"][data-life-window="report"] [aria-label="Weekly city report"]').getByText(/^Tax:/)
Expected: "Tax: 24 Gold. Upkeep covered: 0 Gold; unfunded: 0 Gold (no debt). Farm batch payment: 0 Gold; extra Farm upkeep: 0 Gold."
Received: ""

Call log:
  - Expect "toHaveText" locator('[data-life-view="reports"][data-life-window="report"] [aria-label="Weekly city report"]').getByText(/^Tax:/) with timeout 5000ms
  - waiting for locator('[data-life-view="reports"][data-life-window="report"] [aria-label="Weekly city report"]').getByText(/^Tax:/)
  - Protocol error (Runtime.callFunctionOn): Internal server error, session closed.

```

# Page snapshot

```yaml
- main [ref=e3]:
  - complementary "Life status and navigation" [ref=e4]:
    - navigation "Main" [ref=e5]:
      - generic [ref=e6]:
        - heading "Character Life" [level=1] [ref=e7]
        - paragraph [ref=e8]: Week 2 · Year 1 · Planning
        - paragraph [ref=e9]: Health 100 / 100 · Regen +1/week
        - generic [ref=e10]:
          - generic [ref=e11]: Gold 138
          - generic [ref=e12]: Money 0
        - button "End Week" [ref=e13] [cursor=pointer]
        - status [ref=e14]: Planning Week 2 · Year 1. Previous report retained.
        - button "Information" [ref=e15] [cursor=pointer]
      - generic [ref=e16]:
        - button "Player" [ref=e17] [cursor=pointer]
        - button "Population" [ref=e18] [cursor=pointer]
      - generic [ref=e19]:
        - button "Session" [ref=e20] [cursor=pointer]
        - button "Help" [ref=e21] [cursor=pointer]
        - button "Options" [ref=e22] [cursor=pointer]
        - button "Main menu" [ref=e23] [cursor=pointer]
  - generic [ref=e24]:
    - generic [ref=e25]:
      - heading "Report" [level=2] [ref=e26]
      - navigation "Views" [ref=e27]:
        - button "City" [ref=e28] [cursor=pointer]
        - button "Characters" [ref=e29] [cursor=pointer]
        - button "Report" [ref=e30] [cursor=pointer]
    - region "Report" [ref=e31]:
      - paragraph [ref=e32]: "Last week: Goods unmet 1.45"
      - region "Weekly city report" [ref=e33]:
        - generic [ref=e34]:
          - generic [ref=e35]:
            - heading "Week 1 · Year 1 report" [level=2] [ref=e36]
            - paragraph [aria-hidden] [ref=e37]: To the Lord of Haven
          - generic [ref=e38]:
            - generic [ref=e39]: Food 100%
            - generic [ref=e40]: Goods 0%
            - generic [ref=e41]: Happiness −5
        - paragraph [ref=e42]: Previous report · Planning is active.
        - paragraph [ref=e43]: Planning Week 2 · Year 1.
        - generic [ref=e44]:
          - region "Your steward" [ref=e45]:
            - paragraph [ref=e46]: Your steward
            - generic [ref=e48]: News
            - heading "The treasury grew" [level=3] [ref=e49]
            - generic [ref=e50]:
              - generic [ref=e51]:
                - term [ref=e52]: Gold
                - definition [ref=e53]: 120 → 138
              - generic [ref=e54]:
                - term [ref=e55]: Tax
                - definition [ref=e56]: "+24"
              - generic [ref=e57]:
                - term [ref=e58]: Upkeep paid
                - definition [ref=e59]: "0"
              - generic [ref=e60]:
                - term [ref=e61]: Household upkeep
                - definition [ref=e62]: 3 Gold paid
            - group [ref=e63]:
              - generic "Details" [ref=e64] [cursor=pointer]
              - region "Steward item details" [ref=e65]:
                - heading "Rewards" [level=4] [ref=e66]
                - table [ref=e67]:
                  - caption [ref=e68]: Legendary rewards
                  - rowgroup [ref=e69]:
                    - row [ref=e70]:
                      - columnheader "Goal" [ref=e71]
                      - columnheader "Item" [ref=e72]
                  - rowgroup
                - paragraph [ref=e73]: No Legendary reward delivered this week.
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
                - generic "Purse report" [ref=e83]:
                  - generic [ref=e84]:
                    - term [ref=e85]: Levy
                    - definition [ref=e86]: 0 Money · 0% · 0 of 0 Gold paid
                  - generic [ref=e87]:
                    - term [ref=e88]: Donation
                    - definition [ref=e89]: 0 Money · 0 Gold
                  - generic [ref=e90]:
                    - term [ref=e91]: Money after
                    - definition [ref=e92]: 0 Money
                - paragraph [ref=e93]: "Tax: 24 Gold. Upkeep covered: 0 Gold; unfunded: 0 Gold (no debt). Farm batch payment: 0 Gold; extra Farm upkeep: 0 Gold."
              - group [ref=e94]:
                - generic "How this is calculated" [ref=e95] [cursor=pointer]
              - region "Laws" [ref=e96]:
                - heading "Laws" [level=3] [ref=e97]
                - paragraph [ref=e98]: No laws in force.
          - region "Quartermaster" [ref=e99]:
            - paragraph [ref=e100]: Quartermaster
            - generic [ref=e102]: Watch
            - heading "Goods ran short" [level=3] [ref=e103]
            - generic [ref=e104]:
              - generic [ref=e105]:
                - term [ref=e106]: Item found
                - definition [ref=e107]: Masterwork necklace · inventory
              - generic [ref=e108]:
                - term [ref=e109]: Food eaten
                - definition [ref=e110]: 4 of 4
              - generic [ref=e111]:
                - term [ref=e112]: Goods served
                - definition [ref=e113]: 0 of 1.45
            - group [ref=e114]:
              - generic "Details" [ref=e115] [cursor=pointer]
              - region "Quartermaster item details" [ref=e116]:
                - heading "Items this week" [level=4] [ref=e117]
                - table [ref=e118]:
                  - caption [ref=e119]: Materials this week
                  - rowgroup [ref=e120]:
                    - row [ref=e121]:
                      - columnheader "Plot" [ref=e122]
                      - columnheader "Material" [ref=e123]
                      - columnheader "Outcome" [ref=e124]
                  - rowgroup
                - paragraph [ref=e125]: No materials found.
                - table [ref=e126]:
                  - caption [ref=e127]: Item found
                  - rowgroup [ref=e128]:
                    - row [ref=e129]:
                      - columnheader "Item" [ref=e130]
                      - columnheader "Outcome" [ref=e131]
                  - rowgroup [ref=e132]:
                    - row [ref=e133]:
                      - cell "Masterwork necklace" [ref=e134]
                      - cell "Inventory" [ref=e135]
                - table [ref=e136]:
                  - caption [ref=e137]: Expired items
                  - rowgroup [ref=e138]:
                    - row [ref=e139]:
                      - columnheader "Item" [ref=e140]
                  - rowgroup
                - paragraph [ref=e141]: No items expired.
                - group "Recovery this week" [ref=e142]:
                  - generic [ref=e143]:
                    - term [ref=e144]: Hospital operated
                    - definition [ref=e145]: "No"
                  - generic [ref=e146]:
                    - term [ref=e147]: Regeneration
                    - definition [ref=e148]: "+1"
              - generic [ref=e149]:
                - heading "Needs and services" [level=3] [ref=e150]
                - paragraph [ref=e151]: "Food consumed: 4 / 4 · 100%."
                - paragraph [ref=e152]: "Food unmet: 0."
                - paragraph [ref=e153]: "Goods service: 0 / 1.45 · 0%. Materials used once: 0 Wood, 0 Iron. Revenue: 0 Gold."
                - paragraph [ref=e154]: "Goods stock: opening 30 · produced 0 · distributed 0 · closing 30. Demand 1.45; unmet 1.45; capacity 0; limited by capacity."
                - paragraph [ref=e155]: "Goods unmet: 1.45."
              - region "Weekly stock ledger scroll area" [ref=e156]:
                - table [ref=e157]:
                  - caption [ref=e158]: Weekly stock ledger
                  - rowgroup [ref=e159]:
                    - row [ref=e160]:
                      - columnheader "Stock" [ref=e161]
                      - columnheader "Before" [ref=e162]
                      - columnheader "Stock change" [ref=e163]
                      - columnheader "After" [ref=e164]
                  - rowgroup [ref=e165]:
                    - row [ref=e166]:
                      - rowheader "gold" [ref=e167]
                      - cell "120" [ref=e168]
                      - cell "18" [ref=e169]
                      - cell "138" [ref=e170]
                    - row [ref=e171]:
                      - rowheader "wheat" [ref=e172]
                      - cell "0" [ref=e173]
                      - cell "0" [ref=e174]
                      - cell "0" [ref=e175]
                    - row [ref=e176]:
                      - rowheader "food" [ref=e177]
                      - cell "40" [ref=e178]
                      - cell "-4" [ref=e179]
                      - cell "36" [ref=e180]
                    - row [ref=e181]:
                      - rowheader "wood" [ref=e182]
                      - cell "8" [ref=e183]
                      - cell "0" [ref=e184]
                      - cell "8" [ref=e185]
                    - row [ref=e186]:
                      - rowheader "iron" [ref=e187]
                      - cell "4" [ref=e188]
                      - cell "0" [ref=e189]
                      - cell "4" [ref=e190]
              - group [ref=e191]:
                - generic "Building activity" [ref=e192] [cursor=pointer]
              - region "Outside report" [ref=e193]:
                - heading "Outside" [level=3] [ref=e194]
                - generic [ref=e195]:
                  - generic [ref=e196]:
                    - term [ref=e197]: wood produced
                    - definition [ref=e198]: "0"
                  - generic [ref=e199]:
                    - term [ref=e200]: iron produced
                    - definition [ref=e201]: "0"
                  - generic [ref=e202]:
                    - term [ref=e203]: stone produced
                    - definition [ref=e204]: "0"
                  - generic [ref=e205]:
                    - term [ref=e206]: wool produced
                    - definition [ref=e207]: "0"
                  - generic [ref=e208]:
                    - term [ref=e209]: herbs produced
                    - definition [ref=e210]: "0"
                  - generic [ref=e211]:
                    - term [ref=e212]: cloth produced
                    - definition [ref=e213]: "0"
                  - generic [ref=e214]:
                    - term [ref=e215]: stone stock before / after
                    - definition [ref=e216]: 0 / 0
                  - generic [ref=e217]:
                    - term [ref=e218]: wool stock before / after
                    - definition [ref=e219]: 0 / 0
                  - generic [ref=e220]:
                    - term [ref=e221]: cloth stock before / after
                    - definition [ref=e222]: 0 / 0
                  - generic [ref=e223]:
                    - term [ref=e224]: herbs stock before / after
                    - definition [ref=e225]: 0 / 0
          - region "Census clerk" [ref=e226]:
            - paragraph [ref=e227]: Census clerk
            - generic [ref=e229]: News
            - heading "The census is unchanged" [level=3] [ref=e230]
            - generic [ref=e231]:
              - generic [ref=e232]:
                - term [ref=e233]: Free residents
                - definition [ref=e234]: 80 → 75
              - generic [ref=e235]:
                - term [ref=e236]: Makers
                - definition [ref=e237]: 80 → 75
              - generic [ref=e238]:
                - term [ref=e239]: Luminaries
                - definition [ref=e240]: 80 → 75
              - generic [ref=e241]:
                - term [ref=e242]: Merchants
                - definition [ref=e243]: 80 → 75
            - group [ref=e244]:
              - generic "Details" [active] [ref=e245] [cursor=pointer]
              - generic [ref=e246]:
                - heading "Population and happiness" [level=3] [ref=e247]
                - paragraph [ref=e248]: "Population: 100 → 100 · 0 arrivals · Available next week."
                - paragraph [ref=e249]: "Happiness: 80 → 75."
              - region "Society this week" [ref=e250]:
                - region "Classes this week scroll area" [ref=e251]:
                  - table [ref=e252]:
                    - caption [ref=e253]: Classes this week
                    - rowgroup [ref=e254]:
                      - row [ref=e255]:
                        - columnheader "Class" [ref=e256]
                        - columnheader "Food" [ref=e257]
                        - columnheader "Goods" [ref=e258]
                        - columnheader "Luxury" [ref=e259]
                        - columnheader "Satisfaction" [ref=e260]
                        - columnheader "Arrivals" [ref=e261]
                        - columnheader "Trained" [ref=e262]
                        - columnheader "Enslaved" [ref=e263]
                    - rowgroup [ref=e264]:
                      - row [ref=e265]:
                        - rowheader "Free residents" [ref=e266]
                        - cell "100%" [ref=e267]
                        - cell "0%" [ref=e268]
                        - cell "—" [ref=e269]
                        - cell "80 → 75" [ref=e270]
                        - cell "0" [ref=e271]
                        - cell "0" [ref=e272]
                        - cell "0" [ref=e273]
                      - row [ref=e274]:
                        - rowheader "Makers" [ref=e275]
                        - cell "100%" [ref=e276]
                        - cell "0%" [ref=e277]
                        - cell "—" [ref=e278]
                        - cell "80 → 75" [ref=e279]
                        - cell "0" [ref=e280]
                        - cell "0" [ref=e281]
                        - cell "0" [ref=e282]
                      - row [ref=e283]:
                        - rowheader "Luminaries" [ref=e284]
                        - cell "100%" [ref=e285]
                        - cell "0%" [ref=e286]
                        - cell "—" [ref=e287]
                        - cell "80 → 75" [ref=e288]
                        - cell "0" [ref=e289]
                        - cell "0" [ref=e290]
                        - cell "0" [ref=e291]
                      - row [ref=e292]:
                        - rowheader "Merchants" [ref=e293]
                        - cell "100%" [ref=e294]
                        - cell "0%" [ref=e295]
                        - cell "—" [ref=e296]
                        - cell "80 → 75" [ref=e297]
                        - cell "0" [ref=e298]
                        - cell "0" [ref=e299]
                        - cell "0" [ref=e300]
                      - row [ref=e301]:
                        - rowheader "The Bound" [ref=e302]
                        - cell "100%" [ref=e303]
                        - cell "100%" [ref=e304]
                        - cell "—" [ref=e305]
                        - cell "80 → 80" [ref=e306]
                        - cell "0" [ref=e307]
                        - cell "0" [ref=e308]
                        - cell "0" [ref=e309]
                - list [ref=e310]:
                  - listitem [ref=e311]: Some Free residents had no work, so debt pressure rose.
                  - listitem [ref=e312]: Free residents went short of Goods.
                  - listitem [ref=e313]: Free residents housing is overcrowded (−5 satisfaction).
                  - listitem [ref=e314]: "No Free residents arrived: Free residents' housing is full."
                  - listitem [ref=e315]: Some Makers had no work, so debt pressure rose.
                  - listitem [ref=e316]: Makers went short of Goods.
                  - listitem [ref=e317]: Makers housing is overcrowded (−5 satisfaction).
                  - listitem [ref=e318]: "No Makers arrived: Makers' housing is full."
                  - listitem [ref=e319]: Some Luminaries had no work, so debt pressure rose.
                  - listitem [ref=e320]: Luminaries went short of Goods.
                  - listitem [ref=e321]: Luminaries housing is overcrowded (−5 satisfaction).
                  - listitem [ref=e322]: "No Luminaries arrived: Luminaries' housing is full."
                  - listitem [ref=e323]: Some Merchants had no work, so debt pressure rose.
                  - listitem [ref=e324]: Merchants went short of Goods.
                  - listitem [ref=e325]: Merchants housing is overcrowded (−5 satisfaction).
                  - listitem [ref=e326]: "No Merchants arrived: Merchants' housing is full."
                - paragraph [ref=e327]: "Bound Desperation: 0 → 0"
                - paragraph [ref=e328]: "Luxury imported: 0. Training cost: 0 Gold."
          - region "Captain of the watch" [ref=e329]:
            - paragraph [ref=e330]: Captain of the watch
            - generic [ref=e332]: News
            - heading "The streets are quiet" [level=3] [ref=e333]
            - generic [ref=e334]:
              - generic [ref=e335]:
                - term [ref=e336]: Security
                - definition [ref=e337]: 30 → 25
              - generic [ref=e338]:
                - term [ref=e339]: Crime
                - definition [ref=e340]: 10 → 5
              - generic [ref=e341]:
                - term [ref=e342]: Authority
                - definition [ref=e343]: 50 → 47
              - term [ref=e345]: "Garrison: 0 soldiers, Security +0."
            - group [ref=e346]:
              - generic "Details" [ref=e347] [cursor=pointer]
          - region "Word from the streets" [ref=e348]:
            - paragraph [ref=e349]: Word from the streets
            - generic [ref=e351]: News
            - heading "The streets are calm" [level=3] [ref=e352]
            - generic [ref=e353]:
              - generic [ref=e354]:
                - term [ref=e355]: Tension
                - definition [ref=e356]: 0 → 0
              - generic [ref=e357]:
                - term [ref=e358]: Desperation
                - definition [ref=e359]: 0 → 0
            - group [ref=e360]:
              - generic "Details" [ref=e361] [cursor=pointer]
        - region "Household activity" [ref=e362]:
          - heading "Household activity" [level=3] [ref=e363]
          - list [ref=e364]:
            - listitem [ref=e365]:
              - text: Recruited ·
              - strong [ref=e366]: Luriel Saffronpath
            - listitem [ref=e367]:
              - text: Recruited ·
              - strong [ref=e368]: Bressa Willowfen
            - listitem [ref=e369]:
              - text: Recruited ·
              - strong [ref=e370]: Elsara Emberloom
            - listitem [ref=e371]:
              - text: Wages paid ·
              - strong [ref=e372]: 3 Gold
        - paragraph [aria-hidden] [ref=e373]: Your steward
        - button "Plan next week" [disabled] [ref=e374]
```

# Test source

```ts
  282 |     const values: string[][] = [];
  283 |     for (const row of await table.locator('tbody > tr').all()) {
  284 |       const cells = await row.locator('th,td').allTextContents();
  285 |       expect(cells).toHaveLength(columns.length);
  286 |       values.push(cells.map(value => value.trim()));
  287 |     }
  288 |     return values;
  289 |   }
  290 |   function definition(name: string): string {
  291 |     const matches = Object.entries(ITEM_CATALOG).filter(([, item]) => item.name === name);
  292 |     expect(matches).toHaveLength(1);
  293 |     return matches[0][0];
  294 |   }
  295 |   function goal(label: string): NonNullable<TileTrialReport['items']['legendary']>['goal'] {
  296 |     const goals = { 'Calm city': 'calm', 'Authority 90+ for 4 weeks': 'authority', 'Week 52': 'week52', 'Research complete': 'research' } as const;
  297 |     expect(Object.hasOwn(goals, label)).toBe(true);
  298 |     return goals[label as keyof typeof goals];
  299 |   }
  300 |   const materials = (await rows(quartermaster, 'Materials this week', ['Plot', 'Material', 'Outcome'])).map(([tileId, name, outcome]) => {
  301 |     expect(['Kept', 'Lost: stack full (999)']).toContain(outcome);
  302 |     return { tileId, materialId: definition(name), lost: outcome === 'Lost: stack full (999)' };
  303 |   });
  304 |   const foundRows = await rows(quartermaster, 'Item found', ['Item', 'Outcome']);
  305 |   expect(foundRows.length).toBeLessThanOrEqual(1);
  306 |   let found: TileTrialReport['items']['found'] = null;
  307 |   if (foundRows.length) {
  308 |     const [name, outcome] = foundRows[0];
  309 |     expect(['Inventory', 'Temporary storage', 'Lost: inventory and temporary storage full']).toContain(outcome);
  310 |     found = { defId: definition(name), stored: outcome === 'Temporary storage', lost: outcome === 'Lost: inventory and temporary storage full' };
  311 |   }
  312 |   const expired = (await rows(quartermaster, 'Expired items', ['Item'])).map(([name]) => definition(name));
  313 |   const legendaryRows = await rows(steward, 'Legendary rewards', ['Goal', 'Item']);
  314 |   expect(legendaryRows.length).toBeLessThanOrEqual(1);
  315 |   const legendary = legendaryRows.length ? { goal: goal(legendaryRows[0][0]), defId: definition(legendaryRows[0][1]) } : null;
  316 |   const pendingLegendary = (await rows(steward, 'Rewards waiting', ['Goal', 'Status'])).map(([label, status]) => {
  317 |     expect(status).toBe('Make room in inventory or temporary storage.');
  318 |     return goal(label);
  319 |   });
  320 |   const recovery = quartermaster.getByRole('group', { name: 'Recovery this week', exact: true });
  321 |   await expect(recovery).toBeVisible();
  322 |   await expect(recovery.locator('dt')).toHaveText(['Hospital operated', 'Regeneration']);
  323 |   const values = await recovery.locator('dd').allTextContents();
  324 |   expect(values).toHaveLength(2);
  325 |   expect(['Yes', 'No']).toContain(values[0]);
  326 |   expect(values[1]).toMatch(/^\+\d+$/);
  327 |   const result: TileTrialReport['items'] = { materials, found, expired, legendary, hospitalOperated: values[0] === 'Yes', regen: Number(values[1].slice(1)) };
  328 |   if (pendingLegendary.length) result.pendingLegendary = pendingLegendary;
  329 |   const outputTable = quartermaster.getByRole('table', { name: 'Workshop output', exact: true });
  330 |   expect(await outputTable.count()).toBeLessThanOrEqual(1);
  331 |   if (await outputTable.count()) {
  332 |     const outputRows = await rows(quartermaster, 'Workshop output', ['Plot', 'Work', 'Output', 'Destination']);
  333 |     expect(outputRows.length).toBeGreaterThan(0);
  334 |     const places = { Inventory: 'inventory', 'Potion inventory': 'consumables', 'Material stack': 'materials', 'Temporary storage': 'storage', 'Waiting for room': 'ready' } as const;
  335 |     result.crafted = outputRows.map(([tileId, work, name, destination]) => {
  336 |       const output = definition(name);
  337 |       const matches = Object.entries(RECIPES).filter(([, recipe]) => recipe.output === output);
  338 |       expect(matches).toHaveLength(1);
  339 |       const [recipeId, recipe] = matches[0];
  340 |       expect(work).toBe(recipe.kind === 'refine' ? 'Refined' : ITEM_CATALOG[output].category === 'consumable' ? 'Brewed' : 'Crafted');
  341 |       expect(Object.hasOwn(places, destination)).toBe(true);
  342 |       return { tileId, recipeId, output, place: places[destination as keyof typeof places] };
  343 |     });
  344 |   }
  345 |   const idleTable = quartermaster.getByRole('table', { name: 'Idle workshops', exact: true });
  346 |   expect(await idleTable.count()).toBeLessThanOrEqual(1);
  347 |   if (await idleTable.count()) {
  348 |     const idleRows = await rows(quartermaster, 'Idle workshops', ['Plot', 'Status']);
  349 |     expect(idleRows.length).toBeGreaterThan(0);
  350 |     result.workshopsIdle = idleRows.map(([tileId, status]) => {
  351 |       expect(status).toBe('No orders completed. Check workers, supplies and upkeep.');
  352 |       return tileId;
  353 |     });
  354 |   }
  355 |   return result;
  356 | }
  357 | 
  358 | // Read every rendered report field, including the NPC life rows.
  359 | export async function expectReport(
  360 |   page: Page, expected: Readonly<TileTrialReport>, difficulty: DifficultyId = 'normal',
  361 | ): Promise<TileTrialReport> {
  362 |   const panel = reportRegion(page), u = reportUnits;
  363 |   // Open base letters for visible text/table assertions; read other parity attributes while closed.
  364 |   const closedLetters = [];
  365 |   for (const details of await panel.locator('[data-letter="steward"] > details, [data-letter="quartermaster"] > details, [data-letter="census"] > details').all()) {
  366 |     if (await details.getAttribute('open') === null) {
  367 |       closedLetters.push(details);
  368 |       await details.locator(':scope > summary').click();
  369 |     }
  370 |   }
  371 |   const heading = panel.getByRole('heading', { name: /^Week .* report$/ });
  372 |   await expect(heading).toBeVisible();
  373 |   const absoluteWeek = reportWeek((await heading.textContent())!);
  374 |   expect(absoluteWeek).toBe(expected.week);
  375 |   for (const name of ['Needs and services', 'Gold and upkeep', 'Population and happiness']) await expect(panel.getByRole('heading', { name, exact: true })).toBeVisible();
  376 |   await expect(panel.getByText(`Food consumed: ${u(expected.foodConsumedMilli)} / ${u(expected.foodDemandMilli)} · ${reportFulfillment(expected.foodConsumedMilli, expected.foodDemandMilli)}.`, { exact: true })).toBeVisible();
  377 |   await expect(panel.getByText(`Food unmet: ${u(expected.foodDemandMilli - expected.foodConsumedMilli)}.`, { exact: true })).toBeVisible();
  378 |   await expect(panel.getByText(`Goods unmet: ${u(expected.goods.demandMilli - expected.goods.servedMilli)}.`, { exact: true })).toBeVisible();
  379 |   const goods = panel.getByTestId('trial-goods');
  380 |   await expect(goods).toHaveText(`Goods service: ${u(expected.goods.servedMilli)} / ${u(expected.goods.demandMilli)} · ${expected.goods.demandMilli === 0 ? 'No demand' : `${expected.goods.fulfillmentBps / 100}%`}. Materials used once: ${u(expected.goods.woodUsed)} Wood, ${u(expected.goods.ironUsed)} Iron. Revenue: ${u(expected.goods.revenueMilli)} Gold.`);
  381 |   const tax = panel.getByText(/^Tax:/);
> 382 |   await expect(tax).toHaveText(`Tax: ${u(expected.taxMilli)} Gold. Upkeep covered: ${u(expected.upkeepPaidMilli)} Gold; unfunded: ${u(expected.unpaidUpkeepMilli)} Gold (no debt). Farm batch payment: ${u(expected.farmBatchGoldMilli)} Gold; extra Farm upkeep: ${u(expected.farmExtraUpkeepMilli)} Gold.`);
      |                     ^ Error: expect(locator).toHaveText(expected) failed
  383 |   await expect(tax).toBeVisible();
  384 |   const happiness = panel.getByText(/^Happiness:/);
  385 |   await expect(happiness).toHaveText(`Happiness: ${expected.happinessBefore} → ${expected.happinessAfter}.`);
  386 |   const table = panel.getByRole('table', { name: 'Weekly stock ledger', exact: true });
  387 |   await expect(table.getByRole('columnheader')).toHaveText(['Stock', 'Before', 'Stock change', 'After']);
  388 |   for (const th of await table.getByRole('columnheader').all()) await expect(th).toHaveAttribute('scope', 'col');
  389 |   const before = {} as TileTrialReport['before'], after = {} as TileTrialReport['after'];
  390 |   const milli = reportMilli;
  391 |   for (const key of WEEKLY_RESOURCE_KEYS) {
  392 |     const row = table.getByRole('row').filter({ has: page.getByRole('rowheader', { name: key, exact: true }) });
  393 |     await expect(row.getByRole('rowheader')).toHaveAttribute('scope', 'row');
  394 |     await expect(row.locator('th,td')).toHaveText([key, u(expected.before[key]), u(expected.after[key] - expected.before[key]), u(expected.after[key])]);
  395 |     const cells = await row.getByRole('cell').allTextContents();
  396 |     before[key] = milli(cells[0]); after[key] = milli(cells[2]);
  397 |     expect(milli(cells[1])).toBe(after[key] - before[key]);
  398 |   }
  399 |   const activity = panel.locator('details:has(> summary:text-is("Building activity"))');
  400 |   const calculation = panel.locator('details:has(> summary:text-is("How this is calculated"))');
  401 |   const activityOpen = await activity.getAttribute('open') !== null, calculationOpen = await calculation.getAttribute('open') !== null;
  402 |   if (!activityOpen) await activity.locator('summary').click();
  403 |   await expect(activity.locator('li')).toHaveText([...expected.activities]);
  404 |   if (!expected.activities.length) await expect(activity.getByText('No building activity recorded.', { exact: true })).toBeVisible();
  405 |   if (!calculationOpen) await calculation.locator('summary').click();
  406 |   await expect(calculation.getByText('Stock change is closing stock minus opening stock for this resolved week. It is not gross production or a forecast.', { exact: true })).toBeVisible();
  407 |   await expect(calculation.getByText(/^TRIAL: each class eats/)).toBeVisible();
  408 |   const g = (await goods.textContent())!.match(/Goods service: ([\d,]+(?:\.\d+)?) \/ ([\d,]+(?:\.\d+)?) · (No demand|[\d.]+%). Materials used once: ([\d,]+(?:\.\d+)?) Wood, ([\d,]+(?:\.\d+)?) Iron. Revenue: ([\d,]+(?:\.\d+)?) Gold\./)!;
  409 |   const t = (await tax.textContent())!.match(/[\d,]+(?:\.\d+)?(?= Gold)/g)!, h = (await happiness.textContent())!.match(/\d+(?:\.\d+)?/g)!;
  410 |   const food = (await panel.getByText(/^Food consumed:/).textContent())!.match(/[\d,]+(?:\.\d+)?/g)!;
  411 |   if (expected.goods.demandMilli === 0) {
  412 |     expect(g[3]).toBe('No demand');
  413 |     expect(milli(g[1])).toBe(0); expect(milli(g[2])).toBe(0);
  414 |     expect(await goods.textContent()).not.toContain('%');
  415 |   }
  416 |   if (expected.foodDemandMilli === 0) {
  417 |     const foodRow = panel.getByText(/^Food consumed:/);
  418 |     await expect(foodRow).toContainText('No demand');
  419 |     expect(await foodRow.textContent()).not.toContain('%');
  420 |     expect(food.slice(0, 2).map(milli)).toEqual([0, 0]);
  421 |   }
  422 |   // Zero-demand BPS comes only from the executor, not an invented UI percentage.
  423 |   const actual: TileTrialReport = {
  424 |     week: absoluteWeek, before, after,
  425 |     items: await readItemReport(panel),
  426 |     taxMilli: milli(t[0]), upkeepPaidMilli: milli(t[1]), unpaidUpkeepMilli: milli(t[2]), farmBatchGoldMilli: milli(t[3]), farmExtraUpkeepMilli: milli(t[4]),
  427 |     foodConsumedMilli: milli(food[0]), foodDemandMilli: milli(food[1]), happinessBefore: Number(h[0]), happinessAfter: Number(h[1]),
  428 |     goods: { servedMilli: milli(g[1]), demandMilli: milli(g[2]), fulfillmentBps: expected.goods.demandMilli === 0 ? expected.goods.fulfillmentBps : milli(g[3].slice(0, -1)) / 10, woodUsed: milli(g[4]), ironUsed: milli(g[5]), revenueMilli: milli(g[6]) },
  429 |     activities: await activity.locator('li').allTextContents(),
  430 |   };
  431 |   if (expected.goodsStock) {
  432 |     const flow = panel.getByTestId('goods-stock-flow'), f = expected.goodsStock;
  433 |     await expect(flow).toHaveText(`Goods stock: opening ${u(f.openingMilli)} · produced ${u(f.producedMilli)} · distributed ${u(f.distributedMilli)} · closing ${u(f.closingMilli)}. Demand ${u(f.demandMilli)}; unmet ${u(f.unmetMilli)}; capacity ${u(f.capacityMilli)}; limited by ${f.limitedBy}.`);
  434 |     const text = (await flow.textContent())!, amounts = text.match(/[\d,]+(?:\.\d+)?/g)!.map(milli);
  435 |     actual.goodsStock = { openingMilli: amounts[0], producedMilli: amounts[1], distributedMilli: amounts[2], closingMilli: amounts[3], demandMilli: amounts[4], unmetMilli: amounts[5], capacityMilli: amounts[6], limitedBy: text.match(/limited by (none|stock|capacity)/)![1] as typeof f.limitedBy };
  436 |   } else await expect(panel.getByTestId('goods-stock-flow')).toHaveCount(0);
  437 |   if (expected.immigration) {
  438 |     const i = expected.immigration;
  439 |     const population = panel.getByTestId('trial-immigration');
  440 |     await expect(population).toHaveText(`Population: ${i.populationBefore} → ${i.populationAfter} · ${i.arrivals} arrivals · Available next week.`);
  441 |     const detail = calculation.getByText(/^Immigration target:/);
  442 |     await expect(detail).toHaveText(`Immigration target: ${i.target}. Useful worker slots: ${i.usefulWorkerSlots}. Renewable Food: ${u(i.renewableFoodMilli)}. Reason: ${i.reason}.`);
  443 |     const p = (await population.textContent())!.match(/\d+/g)!, d = (await detail.textContent())!.match(/Immigration target: (\d+). Useful worker slots: (\d+). Renewable Food: ([\d,]+(?:\.\d+)?). Reason: ([\w-]+)\./)!;
  444 |     actual.immigration = { populationBefore: Number(p[0]), populationAfter: Number(p[1]), arrivals: Number(p[2]), target: Number(d[1]), usefulWorkerSlots: Number(d[2]), renewableFoodMilli: milli(d[3]), reason: d[4] as typeof i.reason };
  445 |   } else await expect(panel.getByTestId('trial-immigration')).toHaveCount(0);
  446 |   if (!activityOpen) await activity.locator('summary').click();
  447 |   if (!calculationOpen) await calculation.locator('summary').click();
  448 |   if(expected.outside){
  449 |     const region=panel.getByRole('region',{name:'Outside report',exact:true});
  450 |     const outside:NonNullable<TileTrialReport['outside']>={producedMilli:{wood:0,iron:0,stone:0,wool:0,herbs:0,cloth:0},stocksBefore:{stone:0,wool:0,cloth:0,herbs:0},stocksAfter:{stone:0,wool:0,cloth:0,herbs:0},hospitalsIdle:[],cleared:[],researchCompleted:[],exhausted:[],spoiledMilli:{}};
  451 |     for(const good of Object.keys(outside.producedMilli) as (keyof typeof outside.producedMilli)[])outside.producedMilli[good]=reportMilli((await region.locator(`[data-outside-produced="${good}"]`).textContent())!);
  452 |     for(const good of Object.keys(outside.stocksBefore) as (keyof typeof outside.stocksBefore)[]){const [before,after]=(await region.locator(`[data-outside-stock="${good}"]`).textContent())!.split(' / ');outside.stocksBefore[good]=reportMilli(before);outside.stocksAfter[good]=reportMilli(after);}
  453 |     for(const line of await region.locator('p').allTextContents()){
  454 |       let match=line.match(/^([\d,.]+) (\w+) spoiled: storage full\.$/);
  455 |       if(match){outside.spoiledMilli[match[2].toLowerCase() as keyof typeof outside.spoiledMilli]=reportMilli(match[1]);continue;}
  456 |       match=line.match(/^(.+): deposit exhausted; the (.+) closed and the plot is now plain\.$/);
  457 |       if(match){expect(match[2]).toBe(match[1].startsWith('ore-')?'Iron Mine':'Quarry');outside.exhausted.push(match[1]);continue;}
  458 |       match=line.match(/^(.+) cleared\.$/);if(match){outside.cleared.push(match[1]);continue;}
  459 |       const researchLabels={'deep-mining':'Deep Mining','watch-patrols':'Watch Patrols','barracks-drill':'Barracks Drill'} as const;
  460 |       const topic=(Object.keys(researchLabels) as (keyof typeof researchLabels)[]).find(key=>line===`Research completed: ${researchLabels[key]}.`);
  461 |       if(topic){outside.researchCompleted.push(topic);continue;}
  462 |       match=line.match(/^(.+): Hospital idle, no Herbs\.$/);if(match){outside.hospitalsIdle.push(match[1]);continue;}
  463 |       throw Error(`Unknown Outside report line: ${line}`);
  464 |     }
  465 |     actual.outside=outside;
  466 |   }
  467 |   if(expected.order){
  468 |     const captainDetails=panel.locator('[data-letter="captain"] > details');
  469 |     const captainWasOpen=await captainDetails.getAttribute('open')!==null;
  470 |     await openReportDetails(page,'captain');
  471 |     try {
  472 |     const region=panel.getByRole('region',{name:'Order',exact:true});
  473 |     await expect(region).toBeVisible();
  474 |     const order:NonNullable<TileTrialReport['order']>={soldiers:Number(await region.getAttribute('data-order-soldiers')),garrisonSecurity:Number(await region.getAttribute('data-order-garrison-security')),before:{security:0,crime:0,authority:0},after:{security:0,crime:0,authority:0},targets:{security:0,crime:0,authority:0},theftMilli:{},tensionAdded:0,satisfactionLost:0,taxModifierBps:0,taxDeltaMilli:0,arrivalsBudgetBefore:0,arrivalsBudgetAfter:0};
  475 |     for(const key of ['security','crime','authority'] as const){
  476 |       const value=region.locator(`[data-order-value="${key}"]`);
  477 |       await expect(value).toBeVisible();
  478 |       const text=(await value.textContent())!;
  479 |       const values=text.match(/\d+/g)!.map(Number);
  480 |       [order.before[key],order.after[key],order.targets[key]]=values;
  481 |     }
  482 |     const calculation=region.locator('details:has(> summary:text-is("Order calculation"))');
```