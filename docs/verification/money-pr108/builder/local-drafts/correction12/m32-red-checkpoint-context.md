# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: home-robbery.spec.ts >> shows crisis first and resumes between the two answers from IndexedDB and JSON
- Location: tests\e2e\home-robbery.spec.ts:135:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Saved in this browser.', { exact: true })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByText('Saved in this browser.', { exact: true }) with timeout 5000ms
  - waiting for getByText('Saved in this browser.', { exact: true })

```

```yaml
- main:
  - complementary "Life status and navigation":
    - navigation "Main":
      - heading "Character Life" [level=1]
      - paragraph: Week 2 · Year 1 · Planning
      - paragraph: Health 100 / 100 · Regen +1/week
      - text: Gold 141.755 Money 50.001
      - button "Answer the crisis first." [disabled]
      - status: Planning Week 2 · Year 1. Previous report retained.
      - button "Information"
      - button "Player"
      - button "Population"
      - button "Session"
      - button "Help"
      - button "Options"
      - button "Main menu"
  - heading "Session" [level=2]
  - navigation "Views":
    - button "City"
    - button "Characters"
    - button "Report"
  - region "Session":
    - region "Planning checkpoints":
      - heading "Planning checkpoint" [level=3]
      - paragraph: "Difficulty: Normal"
      - paragraph: Save or restore a Planning checkpoint in this browser or a JSON file.
      - group: About checkpoints
      - button "Save locally"
      - button "Continue locally"
      - button "Export checkpoint"
      - text: Import checkpoint
      - button "Import checkpoint"
      - status: Saved in this browser. Replaced the previous local checkpoint.
```

# Test source

```ts
  60  |     await expect(page.getByTestId('purse-money')).toHaveText('Money ' + rest);
  61  |     await expect(page.locator('#life-reports-heading')).toBeFocused();
  62  | 
  63  |     const low = makeLife(40);
  64  |     low.city.society!.difficulty = difficulty;
  65  |     low.city.society!.order.security = 14;
  66  |     low.player.purse.moneyMilli = 22500;
  67  |     low.player.purse.robbery = { id: 'home-robbery-w1', week: 1, excessMilli: 4000 };
  68  |     await importLife(page, low);
  69  |     await go(page, 'reports');
  70  |     const chase = card(page).getByRole('button', { name: 'Chase', exact: true });
  71  |     await tabTo(page, chase);
  72  |     await expect(chase).toHaveAttribute('aria-disabled', 'true');
  73  |     await expect(chase).toHaveAttribute('aria-describedby', 'home-robbery-chase-amount home-robbery-chase-reason');
  74  |     await expect(card(page).locator('#home-robbery-chase-reason')).toHaveText('Needs Security 15.');
  75  |     await chase.press('Space');
  76  |     expect((await exportLife(page)).player.purse).toStrictEqual(low.player.purse);
  77  | 
  78  |     await go(page, 'reports');
  79  |     for (const narrow of [320, 375]) {
  80  |       await page.setViewportSize({ width: narrow, height: 812 });
  81  |       await expect(card(page)).toBeVisible();
  82  |       expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  83  |       expect(await card(page).getByRole('button').evaluateAll(nodes =>
  84  |         nodes.every(node => node.getBoundingClientRect().height >= 44 && node.getBoundingClientRect().right <= innerWidth))).toBe(true);
  85  |     }
  86  |   });
  87  | 
  88  |   test('describes all controls blocked by the Money reserve at ' + width, async ({ page }) => {
  89  |     await page.setViewportSize({ width, height: 900 });
  90  |     const s = makeLife(40);
  91  |     s.city.society!.difficulty = difficulty;
  92  |     s.city.tiles.find(tile => tile.id === 'slum-1')!.building =
  93  |       { typeId: 'drug-store', level: 1, workers: 0, enabled: true };
  94  |     s.city.society!.items.materials['green-leaf'] = 2;
  95  |     s.player.purse.moneyMilli = 4999;
  96  |     s.player.purse.robbery = { id: 'home-robbery-w1', week: 1, excessMilli: 4000 };
  97  |     const notice = '4 Money is held until the robbery is answered.';
  98  |     await page.goto('/');
  99  |     await importLife(page, s);
  100 |     const before = await exportLife(page);
  101 |     await page.locator('#life-nav-player').click();
  102 |     await expect(page.getByTestId('purse-held-money')).toHaveText(notice);
  103 |     await page.getByLabel('Donation amount in Money', { exact: true }).fill('1');
  104 |     const donate = button(page, 'Donate');
  105 |     await expect(donate).toBeDisabled();
  106 |     await expect(donate).toHaveAccessibleDescription(notice);
  107 |     await donate.press('Enter');
  108 |     await page.keyboard.press('Escape');
  109 |     await go(page, 'city');
  110 |     await button(page, 'Select spec-1').click();
  111 |     const market = page.getByRole('group', { name: 'Weekly offers', exact: true }).getByRole('button', { name: 'Buy', exact: true });
  112 |     expect(await market.count()).toBeGreaterThan(0);
  113 |     for (const buy of await market.all()) {
  114 |       await expect(buy).toBeDisabled();
  115 |       await expect(buy).toHaveAccessibleDescription(notice);
  116 |     }
  117 |     await market.first().press('Enter');
  118 |     await button(page, 'Select slum-1').click();
  119 |     const potions = page.getByRole('region', { name: 'Potion shop', exact: true }).getByRole('button', { name: /^Buy / });
  120 |     await expect(potions).toHaveCount(3);
  121 |     for (const buy of await potions.all()) {
  122 |       await expect(buy).toBeDisabled();
  123 |       await expect(buy).toHaveAccessibleDescription(notice);
  124 |     }
  125 |     await potions.first().press('Enter');
  126 |     await page.getByRole('tab', { name: 'Brew', exact: true }).click();
  127 |     const brew = page.locator('[data-craft-recipe="brew-heal-potion-1"]').getByRole('button', { name: 'Place Heal Potion I', exact: true });
  128 |     await expect(brew).toBeDisabled();
  129 |     await expect(brew).toHaveAccessibleDescription(notice);
  130 |     await brew.press('Enter');
  131 |     expect(await exportLife(page)).toStrictEqual(before);
  132 |   });
  133 | }
  134 | 
  135 | test('shows crisis first and resumes between the two answers from IndexedDB and JSON', async ({ page }) => {
  136 |   const s = makeLife(40);
  137 |   const society = s.city.society!;
  138 |   society.crisis.stage = 'warning';
  139 |   society.crisis.hungerStreak = CRISIS_TRIAL.demandHungerWeeks - 1;
  140 |   for (const key of ['free', 'makers', 'luminaries', 'merchants', 'bound'] as const) society.satisfaction[key] = 0;
  141 |   const stock = s.city.world.settlements[s.city.world.activeSettlementId!].inventory;
  142 |   stock.food = 0;
  143 |   stock.wheat = 0;
  144 |   for (const id of ['field-1', 'plain-1']) {
  145 |     const building = s.city.tiles.find(tile => tile.id === id)!.building!;
  146 |     building.workers = 0;
  147 |   }
  148 |   s.player.purse.moneyMilli = 50001;
  149 |   await page.goto('/');
  150 |   await importLife(page, s);
  151 |   await keyActivate(page, page.getByTestId('life-end-week'));
  152 |   await expect(page.getByTestId('crisis-card')).toBeVisible();
  153 |   await expect(card(page)).toHaveCount(0);
  154 |   await expect(page.getByTestId('life-end-week')).toHaveText('Answer the crisis first.');
  155 |   await keyActivate(page, button(page, 'Plan next week'));
  156 |   const both = await exportLife(page);
  157 |   expect(both.city.society!.pendingCard).toStrictEqual({ id: 'crisis-demand-w2', source: 'crisis', kind: 'demand', week: 2 });
  158 |   expect(both.player.purse.robbery?.id).toBe('home-robbery-w1');
  159 |   await button(page, 'Save locally').click();
> 160 |   await expect(page.getByText('Saved in this browser.', { exact: true })).toBeVisible();
      |                                                                           ^ Error: expect(locator).toBeVisible() failed
  161 |   await page.reload();
  162 |   await button(page, 'Continue').click();
  163 |   expect((await exportLife(page)).player.purse).toStrictEqual(both.player.purse);
  164 |   await go(page, 'reports');
  165 |   const refuse = page.getByTestId('crisis-card').getByRole('button', { name: 'Refuse', exact: true });
  166 |   await keyActivate(page, refuse);
  167 |   await expect(card(page).getByRole('heading')).toBeFocused();
  168 |   await expect(page.getByTestId('life-end-week')).toHaveText('Answer the robbery first.');
  169 |   const between = await exportLife(page);
  170 |   expect(between.city.society!.pendingCard).toBeNull();
  171 |   expect(between.player.purse).toStrictEqual(both.player.purse);
  172 |   await importLife(page, between);
  173 |   await go(page, 'reports');
  174 |   await expect(page.getByTestId('crisis-card')).toHaveCount(0);
  175 |   await keyActivate(page, card(page).getByRole('button', { name: 'Let go', exact: true }));
  176 |   await expect(page.getByTestId('life-shell').getByRole('status').filter({ hasText: 'Robbery · Let go · −17.25 Money · 28.751 Money at risk' })).toHaveText('Robbery · Let go · −17.25 Money · 28.751 Money at risk');
  177 |   await expect(page.getByTestId('life-end-week')).toBeEnabled();
  178 |   expect((await exportLife(page)).player.purse.robbery).toBeNull();
  179 | });
  180 | 
```