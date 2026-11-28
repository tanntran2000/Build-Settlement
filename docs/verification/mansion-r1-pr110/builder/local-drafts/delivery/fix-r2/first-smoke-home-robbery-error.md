# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: home-robbery.spec.ts >> shows crisis first and resumes between the two answers from IndexedDB and JSON
- Location: tests\e2e\home-robbery.spec.ts:220:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Saved in this browser. Replaced the previous local checkpoint.', { exact: true })
Expected: visible
Error: strict mode violation: getByText('Saved in this browser. Replaced the previous local checkpoint.', { exact: true }) resolved to 2 elements:
    1) <p role="status" class="svelte-68buw">Saved in this browser. Replaced the previous loca…</p> aka getByTestId('life-shell').getByText('Saved in this browser.')
    2) <p role="status" class="svelte-68buw">Saved in this browser. Replaced the previous loca…</p> aka getByText('Saved in this browser.').nth(1)

Call log:
  - Expect "toBeVisible" getByText('Saved in this browser. Replaced the previous local checkpoint.', { exact: true }) with timeout 5000ms
  - waiting for getByText('Saved in this browser. Replaced the previous local checkpoint.', { exact: true })

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
          - generic [ref=e11]: Gold 141.755
          - generic [ref=e12]: Money 50.001
        - button "Answer the crisis first." [disabled] [ref=e13]
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
      - heading "Session" [level=2] [ref=e26]
      - navigation "Views" [ref=e27]:
        - button "City" [ref=e28] [cursor=pointer]
        - button "Characters" [ref=e29] [cursor=pointer]
        - button "Report" [ref=e30] [cursor=pointer]
    - region "Session" [ref=e31]:
      - region "Planning checkpoints" [ref=e32]:
        - heading "Planning checkpoint" [level=3] [ref=e33]
        - paragraph [ref=e34]: "Difficulty: Normal"
        - paragraph [ref=e35]: Save or restore a Planning checkpoint in this browser or a JSON file.
        - group [ref=e36]:
          - generic "About checkpoints" [ref=e37] [cursor=pointer]
        - button "Save locally" [active] [ref=e38] [cursor=pointer]
        - button "Continue locally" [ref=e39] [cursor=pointer]
        - button "Export checkpoint" [ref=e40] [cursor=pointer]
        - generic [ref=e41]: Import checkpoint
        - button "Import checkpoint" [ref=e42]
        - status [ref=e43]: Saved in this browser. Replaced the previous local checkpoint.
```

# Test source

```ts
  145 |   if (!saved.success) throw Error(saved.error.message);
  146 |   await expect.poll(() => storedSaveText(page)).toBe(saved.text);
  147 |   const records = await readStoredRecords(page);
  148 |   const rejected = JSON.parse(saved.text);
  149 |   rejected.state.player.purse.robbery = { id: 'home-robbery-w1', week: 1, excessMilli: 4001 };
  150 |   await page.getByLabel('Import checkpoint', { exact: true }).setInputFiles({
  151 |     name: 'unbacked-robbery.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(rejected)),
  152 |   });
  153 |   await expect(page.getByTestId('life-shell').locator('[data-life-error][role="alert"]'))
  154 |     .toHaveText('This checkpoint file is damaged or was changed and cannot be loaded. Your game was preserved.');
  155 |   expect(await exportLife(page)).toStrictEqual(before);
  156 |   expect(await readStoredRecords(page)).toStrictEqual(records);
  157 |   expect(await storedSaveText(page)).toBe(saved.text);
  158 | });
  159 | 
  160 | test('shows the exact card exposure and option losses after a permitted donation', async ({ page }) => {
  161 |   const s = makeLife(40);
  162 |   s.player.purse.moneyMilli = 50001;
  163 |   s.player.purse.levyPercent = 5;
  164 |   await page.goto('/');
  165 |   await importLife(page, s);
  166 |   await keyActivate(page, page.getByTestId('life-end-week'));
  167 |   await expect(row(page)).toHaveText('Awaiting answer · 30.088 Money at risk');
  168 |   await keyActivate(page, button(page, 'Plan next week'));
  169 |   await page.locator('#life-nav-player').click();
  170 |   await page.getByLabel('Donation amount in Money', { exact: true }).fill('21');
  171 |   const donate = button(page, 'Donate');
  172 |   await expect(donate).toBeEnabled();
  173 |   await donate.click();
  174 |   await expect(page.getByRole('region', { name: 'Purse', exact: true }).getByText('Money 30.338', { exact: true })).toBeVisible();
  175 |   await expect(page.getByTestId('purse-risk')).toHaveText('Safe amount 21.25 Money · At risk 30.088 Money');
  176 |   await go(page, 'reports');
  177 |   await expect(card(page).locator('#home-robbery-pay-amount')).toHaveText('Lose 7.522 Money.');
  178 |   await expect(card(page).locator('#home-robbery-let-go-amount')).toHaveText('Lose 18.052 Money.');
  179 | });
  180 | 
  181 | test('blocks a 5 Money Market purchase only while the same balance includes a 4 Money hold', async ({ page }) => {
  182 |   const s = makeLife(40);
  183 |   s.player.purse.moneyMilli = 8999;
  184 |   s.player.purse.robbery = { id: 'home-robbery-w1', week: 1, excessMilli: 4000 };
  185 |   const offers = s.city.society!.items.market;
  186 |   const offerIndex = offers.findIndex(offer => offer.priceMilli === 5000);
  187 |   expect(offers[offerIndex].priceMilli).toBe(5000);
  188 |   const openMarket = async () => {
  189 |     await go(page, 'city');
  190 |     await button(page, 'Select spec-1').click();
  191 |     const market = page.getByRole('group', { name: 'Weekly offers', exact: true });
  192 |     const buys = market.getByRole('button', { name: 'Buy', exact: true });
  193 |     await expect(buys).toHaveCount(offers.length);
  194 |     await expect(market.getByRole('article').nth(offerIndex).getByText('5 Money', { exact: true })).toBeVisible();
  195 |     return buys.nth(offerIndex);
  196 |   };
  197 |   await page.goto('/');
  198 |   await importLife(page, s);
  199 |   const before = await exportLife(page);
  200 |   const blocked = await openMarket();
  201 |   await expect(blocked).toBeDisabled();
  202 |   await expect(blocked).toHaveAccessibleDescription('4 Money is held until the robbery is answered.');
  203 |   await blocked.press('Enter');
  204 |   expect(await exportLife(page)).toStrictEqual(before);
  205 | 
  206 |   const cleared = structuredClone(s);
  207 |   cleared.player.purse.robbery = null;
  208 |   await importLife(page, cleared);
  209 |   const ready = await exportLife(page);
  210 |   expect(ready.player.purse).toStrictEqual({ ...before.player.purse, robbery: null });
  211 |   expect(ready.city.society!.items).toStrictEqual(before.city.society!.items);
  212 |   const enabled = await openMarket();
  213 |   await expect(enabled).toBeEnabled();
  214 |   await enabled.click();
  215 |   const bought = await exportLife(page);
  216 |   expect(bought.player.purse.moneyMilli).toBe(3999);
  217 |   expect(bought.city.society!.items.market).toStrictEqual(offers.filter((_, i) => i !== offerIndex));
  218 | });
  219 | 
  220 | test('shows crisis first and resumes between the two answers from IndexedDB and JSON', async ({ page }) => {
  221 |   const s = makeLife(40);
  222 |   const society = s.city.society!;
  223 |   society.crisis.stage = 'warning';
  224 |   society.crisis.hungerStreak = CRISIS_TRIAL.demandHungerWeeks - 1;
  225 |   for (const key of ['free', 'makers', 'luminaries', 'merchants', 'bound'] as const) society.satisfaction[key] = 0;
  226 |   const stock = s.city.world.settlements[s.city.world.activeSettlementId!].inventory;
  227 |   stock.food = 0;
  228 |   stock.wheat = 0;
  229 |   for (const id of ['field-1', 'plain-1']) {
  230 |     const building = s.city.tiles.find(tile => tile.id === id)!.building!;
  231 |     building.workers = 0;
  232 |   }
  233 |   s.player.purse.moneyMilli = 50001;
  234 |   await page.goto('/');
  235 |   await importLife(page, s);
  236 |   await keyActivate(page, page.getByTestId('life-end-week'));
  237 |   await expect(page.getByTestId('crisis-card')).toBeVisible();
  238 |   await expect(card(page)).toHaveCount(0);
  239 |   await expect(page.getByTestId('life-end-week')).toHaveText('Answer the crisis first.');
  240 |   await keyActivate(page, button(page, 'Plan next week'));
  241 |   const both = await exportLife(page);
  242 |   expect(both.city.society!.pendingCard).toStrictEqual({ id: 'crisis-demand-w2', source: 'crisis', kind: 'demand', week: 2 });
  243 |   expect(both.player.purse.robbery?.id).toBe('home-robbery-w1');
  244 |   await button(page, 'Save locally').click();
> 245 |   await expect(page.getByText('Saved in this browser. Replaced the previous local checkpoint.', { exact: true })).toBeVisible();
      |                                                                                                                   ^ Error: expect(locator).toBeVisible() failed
  246 |   await page.reload();
  247 |   await button(page, 'Continue').click();
  248 |   expect((await exportLife(page)).player.purse).toStrictEqual(both.player.purse);
  249 |   await go(page, 'reports');
  250 |   const refuse = page.getByTestId('crisis-card').getByRole('button', { name: 'Refuse', exact: true });
  251 |   await keyActivate(page, refuse);
  252 |   await expect(card(page).getByRole('heading')).toBeFocused();
  253 |   await expect(page.getByTestId('life-end-week')).toHaveText('Answer the robbery first.');
  254 |   const between = await exportLife(page);
  255 |   expect(between.city.society!.pendingCard).toBeNull();
  256 |   expect(between.player.purse).toStrictEqual(both.player.purse);
  257 |   await importLife(page, between);
  258 |   await go(page, 'reports');
  259 |   await expect(page.getByTestId('crisis-card')).toHaveCount(0);
  260 |   await keyActivate(page, card(page).getByRole('button', { name: 'Let go', exact: true }));
  261 |   await expect(page.getByTestId('life-shell').getByRole('status').filter({ hasText: 'Robbery · Let go · −17.25 Money · 28.751 Money at risk' })).toHaveText('Robbery · Let go · −17.25 Money · 28.751 Money at risk');
  262 |   await expect(page.getByTestId('life-end-week')).toBeEnabled();
  263 |   expect((await exportLife(page)).player.purse.robbery).toBeNull();
  264 | });
  265 | 
```