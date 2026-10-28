import { test, expect, type Page } from '@playwright/test';
import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execSync } from 'node:child_process';
import { resolve } from 'node:path';
import ts from 'typescript';

const stock = (page: Page, key: string) => page.getByTestId(`weekly-stock-${key}`);
async function assign(page: Page, amount: string, processor = amount) {
  await page.getByLabel('Farm Field workforce (WF)').fill(amount);
  await page.getByLabel('Food Processor workforce (WF)').fill(processor);
}
async function end(page: Page, amount: string, processor = amount) {
  await assign(page, amount, processor);
  await page.getByRole('button', { name: 'End Week', exact: true }).click();
}

test.beforeEach(async ({ page }) => { await page.goto('/'); });

for (const path of ['/', '/?mode=weekly', '/?mode=r1', '/?mode=unknown']) {
  test(`player entry ${path} always opens English Weekly without R1 controls`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.getByRole('heading', { name: 'Weekly Management' })).toBeVisible();
    await expect(page.locator('#btn-advance-day')).toHaveCount(0);
    await expect(stock(page, 'gold')).toHaveText('10');
    await end(page, '4');
    await expect(stock(page, 'gold')).toHaveText('6');
    await expect(stock(page, 'food')).toHaveText('12');
  });
}

test('player entry import graph and shipped artifact exclude the R1 scene', async () => {
  const seen = new Set<string>();
  async function visit(path: string) {
    if (seen.has(path) || !/\.(?:ts|svelte)$/.test(path)) return;
    seen.add(path);
    const text = await readFile(path, 'utf8');
    const source = path.endsWith('.svelte') ? [...text.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(match => match[1]).join('\n') : text;
    const ast = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true);
    for (const statement of ast.statements) {
      if (ts.isImportDeclaration(statement) && ts.isStringLiteral(statement.moduleSpecifier) && statement.moduleSpecifier.text.startsWith('.')) {
        const target = resolve(path, '..', statement.moduleSpecifier.text.replace(/\.js$/, '.ts'));
        await visit(target);
      }
    }
  }
  await visit(resolve('packages/ui/src/main.ts'));
  expect(seen.has(resolve('packages/ui/src/WeeklyManagement.svelte'))).toBe(true);
  expect(seen.has(resolve('packages/ui/src/App.svelte'))).toBe(false);
  const assets = await readdir('packages/ui/dist/assets');
  for (const name of assets.filter(name => name.endsWith('.js'))) {
    expect(await readFile(`packages/ui/dist/assets/${name}`, 'utf8')).not.toContain('btn-advance-day');
  }
});

test('regression build cannot overwrite or enter the production artifact', async () => {
  async function hashes(directory: string): Promise<Record<string, string>> {
    const result: Record<string, string> = {};
    for (const item of await readdir(directory, { withFileTypes: true })) {
      const path = `${directory}/${item.name}`;
      if (item.isDirectory()) Object.assign(result, await hashes(path));
      else result[path] = createHash('sha256').update(await readFile(path)).digest('hex');
    }
    return result;
  }
  const before = await hashes('packages/ui/dist');
  // Constant command via shell: Windows npm is npm.cmd, which execFile cannot launch.
  execSync('npm run build:regression --workspace=@haven/ui', { stdio: 'pipe' });
  expect(await hashes('packages/ui/dist')).toEqual(before);
  expect(Object.keys(before).some(path => path.includes('/regression/'))).toBe(false);
  expect(await readFile('packages/ui/regression/dist/index.html', 'utf8')).toContain('lang="vi"');
});

test('draft leaves stocks unchanged; 4+4 WF produces the harvest/processing ledger once', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Weekly Management' })).toBeVisible();
  await expect(page.getByText('Resets on reload', { exact: false })).toBeVisible();
  await expect(page.getByTestId('weekly-week')).toHaveText('1');
  await assign(page, '4');
  await expect(stock(page, 'gold')).toHaveText('10');
  await expect(stock(page, 'food')).toHaveText('4');
  await page.getByRole('button', { name: 'End Week', exact: true }).dblclick();
  await expect(page.getByTestId('weekly-week')).toHaveText('2');
  await expect(stock(page, 'gold')).toHaveText('6');
  await expect(stock(page, 'food')).toHaveText('12');
  await expect(stock(page, 'wood')).toHaveText('0');
  await expect(stock(page, 'iron')).toHaveText('0');
  await expect(page.getByRole('button', { name: 'End Week', exact: true })).toBeDisabled();
  const report = page.getByRole('region', { name: 'Week report' });
  await expect(report).toContainText('Week 1 report');
  await expect(report.getByRole('row', { name: 'Gold 10 0 4 -4 6' })).toBeVisible();
  await expect(report.getByRole('row', { name: 'Food 4 8 0 8 12' })).toBeVisible();
  const snapshot = await report.innerText();
  // Exercise a bound draft update during Report without recomputing its economics.
  await page.getByLabel('Farm Field workforce (WF)').evaluate((input: HTMLInputElement) => {
    input.value = '9';
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.setViewportSize({ width: 600, height: 800 });
  await page.getByText('WHY', { exact: true }).click();
  await page.getByText('WHY', { exact: true }).click();
  await expect(report).toHaveText(snapshot, { useInnerText: true });
  await expect(stock(page, 'food')).toHaveText('12');
  await page.getByRole('button', { name: 'Plan next week' }).click();
  await expect(page.getByLabel('Farm Field workforce (WF)')).toHaveValue('0');
  await expect(page.getByRole('button', { name: 'End Week', exact: true })).toBeEnabled();
});

test('Enter submits once and report phase ignores repeated Enter', async ({ page }) => {
  const input = page.getByLabel('Farm Field workforce (WF)');
  await assign(page, '1');
  await input.press('Enter');
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('weekly-week')).toHaveText('2');
  await expect(stock(page, 'gold')).toHaveText('9');
  await expect(stock(page, 'food')).toHaveText('6');
});

test('shortage WHY distinguishes completed, idle-assigned and unassigned workforce; no negative stocks', async ({ page }) => {
  await end(page, '4');
  await page.getByRole('button', { name: 'Plan next week' }).click();
  await end(page, '4');
  await page.getByRole('button', { name: 'Plan next week' }).click();
  await end(page, '4');
  await expect(stock(page, 'gold')).toHaveText('0');
  await expect(stock(page, 'food')).toHaveText('24');
  const report = page.getByRole('region', { name: 'Week report' });
  await expect(report).toContainText('Assigned but idle: 4 WF');
  await expect(report).toContainText('Unassigned: 2 WF');
  await expect(report).toContainText('Gold shortage');
  await expect(report.getByRole('row', { name: 'Gold 2 0 2 -2 0' })).toBeVisible();
  await page.getByRole('button', { name: 'Plan next week' }).click();
  await end(page, '0');
  await expect(stock(page, 'food')).toHaveText('24');
});

test('invalid draft is accessible and recoverable without advancing or changing stocks', async ({ page }) => {
  for (const value of ['11', '6', '-1', '0.5', '0.0001', 'abc', '']) {
    await end(page, value);
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByLabel('Farm Field workforce (WF)')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.getByTestId('weekly-week')).toHaveText('1');
    await expect(stock(page, 'gold')).toHaveText('10');
    await expect(stock(page, 'food')).toHaveText('4');
  }
  await end(page, '4');
  await expect(page.getByRole('alert')).toHaveCount(0);
  await expect(stock(page, 'food')).toHaveText('12');
});

test('reload resets the independent prototype and R1 remains at Day 1', async ({ page }) => {
  await end(page, '4');
  await page.reload();
  await expect(page.getByTestId('weekly-week')).toHaveText('1');
  await expect(stock(page, 'gold')).toHaveText('10');
  await page.goto('http://localhost:4174/');
  await expect(page.locator('#current-day')).toHaveText('1');
  await expect(page.locator('#resource-food')).toHaveText('100');
});

test('weekly English language scope covers planning errors and reports while R1 stays Vietnamese', async ({ page }) => {
  await expect(page.getByRole('main')).toHaveAttribute('lang', 'en');
  expect(await page.getByRole('heading', { name: 'Weekly Management' }).evaluate(element => element.matches(':lang(en)'))).toBe(true);
  await end(page, '11');
  expect(await page.getByRole('alert').evaluate(element => element.matches(':lang(en)'))).toBe(true);
  await end(page, '4');
  expect(await page.getByRole('region', { name: 'Week report' }).evaluate(element => element.matches(':lang(en)'))).toBe(true);
  await page.goto('http://localhost:4174/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'vi');
  expect(await page.getByRole('main').evaluate(element => element.matches(':lang(vi)'))).toBe(true);
});

test('canonical active settlement owns population workforce and a continuous multiweek ledger', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Weekly Management' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Haven', exact: true })).toBeVisible();
  await expect(page.getByTestId('weekly-population')).toHaveText('100 residents');
  await expect(page.getByTestId('weekly-workforce')).toHaveText('10 WF');
  await end(page, '4');
  await expect(page.getByRole('region', { name: 'Week report' }).getByRole('row', { name: 'Gold 10 0 4 -4 6' })).toBeVisible();
  await page.getByRole('button', { name: 'Plan next week' }).click();
  await expect(page.getByLabel('Farm Field workforce (WF)')).toHaveValue('0');
  await end(page, '4');
  const report = page.getByRole('region', { name: 'Week report' });
  await expect(report).toContainText('Week 2 report');
  await expect(report.getByRole('row', { name: 'Gold 6 0 4 -4 2' })).toBeVisible();
  await expect(report.getByRole('row', { name: 'Food 12 8 0 8 20' })).toBeVisible();
  await expect(page.getByTestId('weekly-week')).toHaveText('3');
  await expect(stock(page, 'gold')).toHaveText('2');
  await expect(stock(page, 'food')).toHaveText('20');
  await expect(page.getByTestId('weekly-population')).toHaveText('100 residents');
  await page.reload();
  await expect(page.getByTestId('weekly-week')).toHaveText('1');
  await expect(stock(page, 'gold')).toHaveText('10');
});

test('formats safe integer milli exactly at the stock boundary including signed net and zeros', async ({ page }) => {
  // Inject only the approved world's Gold fixture in the served bundle; no production test hook.
  await page.route('**/assets/*.js', async route => {
    const response = await route.fetch();
    const body = await response.text();
    const fixture = /inventory:\{gold:(?:10000|1e4),wheat:0,food:(?:4000|4e3),wood:0,iron:0\}/g;
    expect(body.match(fixture)).toHaveLength(1);
    await route.fulfill({ response, body: body.replace(fixture, 'inventory:{gold:9007199254740991,wheat:0,food:4000,wood:0,iron:0}') });
  });
  await page.reload();
  await expect(stock(page, 'gold')).toHaveText('9007199254740.991');
  await expect(stock(page, 'wood')).toHaveText('0');
  await end(page, '1');
  const report = page.getByRole('region', { name: 'Week report' });
  await expect(report.getByRole('row', { name: 'Gold 9007199254740.991 0 1 -1 9007199254739.991' })).toBeVisible();
  await expect(report.getByRole('row', { name: 'Food 4 2 0 2 6' })).toBeVisible();
  await expect(stock(page, 'gold')).toHaveText('9007199254739.991');
  await expect(stock(page, 'food')).toHaveText('6');
});

test('planned city systems distinguish groups, inventory, Requirements and Status without live values', async ({ page }) => {
  const planned = page.getByRole('region', { name: 'Planned city systems', exact: true });
  await expect(planned).toBeVisible();
  await expect(planned).toContainText('Requirements and Status are not simulated in classic.');
  await expect(planned).toContainText('Proposed names');
  await expect(planned.getByRole('article')).toHaveCount(4);
  for (const [label, name, duties] of [
    ['Makers', 'The Makers’ Union', 'Production, building and maintenance.'],
    ['Luminaries', 'The Luminary Circle', 'Research, education, planning and technical standards.'],
    ['Merchants', 'The Mercantile League', 'Trade and distribution.'],
  ]) {
    const group = planned.getByRole('article', { name: label, exact: true });
    await expect(group.getByRole('heading', { name: label, exact: true })).toBeVisible();
    await expect(group).toContainText(name);
    await expect(group).toContainText(duties);
  }
  const bound = planned.getByRole('article', { name: 'The Bound', exact: true });
  await expect(bound.getByRole('heading', { name: 'The Bound', exact: true })).toBeVisible();
  await expect(bound.locator('p')).toHaveText(['Lower resident stratum.']);
  await expect(planned).toContainText('All three groups contribute to shared Happiness, Security and Corruption through conditions, buildings and future effects.');
  await expect(planned).toContainText('No group owns a single Status; Merchants have no intrinsic corruption.');
  const inventory = planned.getByRole('region', { name: 'Physical inventory', exact: true });
  await expect(inventory.getByRole('definition')).toHaveText(['Wheat, Gold, Wood, Iron', 'Food']);
  await expect(inventory).toContainText('Wheat harvested this week may be processed into Food in the same week, only through a building.');
  await expect(inventory).toContainText('Goods is a city-wide Requirement, with no stored Goods.');
  await expect(inventory).not.toContainText('six inventory types');
  const requirements = planned.getByRole('region', { name: 'City-wide Requirements', exact: true });
  await expect(requirements).toContainText('Food, Goods');
  await expect(requirements).toContainText('Food demand is separate from Food inventory. Goods has no physical inventory.');
  const status = planned.getByRole('region', { name: 'City Status', exact: true });
  await expect(status.getByRole('listitem')).toHaveText(['Happiness', 'Security', 'Corruption']);
  await expect(status).toContainText('Design range: 0–100. Values are not simulated.');
  await expect(planned).toContainText('Law is deferred; its integration boundary is pending.');
  await expect(planned.locator('button, input, select, textarea, progress, meter, [role="progressbar"], [role="slider"]')).toHaveCount(0);
  await expect(planned).not.toContainText(/\b(?:residents|WF|Slave|Low|Middle|High)\b/);
  const live = page.getByRole('region', { name: 'Stocks', exact: true });
  await expect(live.locator('dt')).toHaveText(['Gold', 'Wheat', 'Food', 'Wood', 'Iron']);
  await expect(page.getByTestId('weekly-week')).toHaveText('1');
  await expect(stock(page, 'gold')).toHaveText('10');
  await expect(stock(page, 'food')).toHaveText('4');
});

test('planned city systems stay static while the existing Weekly command updates only live stock and week', async ({ page }) => {
  const planned = page.getByRole('region', { name: 'Planned city systems', exact: true });
  await expect(planned).toBeVisible();
  await expect(planned.getByRole('article')).toHaveCount(4);
  await expect(planned.getByRole('article', { name: 'The Bound', exact: true }).locator('p')).toHaveText(['Lower resident stratum.']);
  const preview = await planned.innerText();
  await end(page, '4');
  await expect(stock(page, 'gold')).toHaveText('6');
  await expect(stock(page, 'food')).toHaveText('12');
  await expect(page.getByTestId('weekly-week')).toHaveText('2');
  await expect(page.getByTestId('weekly-population')).toHaveText('100 residents');
  await expect(page.getByTestId('weekly-workforce')).toHaveText('10 WF');
  await expect(planned).toHaveText(preview, { useInnerText: true });
  await page.getByRole('button', { name: 'Plan next week', exact: true }).click();
  await expect(planned).toHaveText(preview, { useInnerText: true });
  await page.reload();
  await expect(page.getByTestId('weekly-week')).toHaveText('1');
  await expect(stock(page, 'gold')).toHaveText('10');
  await expect(stock(page, 'food')).toHaveText('4');
  await expect(planned).toHaveText(preview, { useInnerText: true });
});

test('Food chain supports harvest-only then processor-only with retained stock across weeks', async ({ page }) => {
  await expect(page.getByLabel('Food Processor workforce (WF)')).toBeVisible();
  await end(page, '4', '0');
  await expect(stock(page, 'gold')).toHaveText('6');
  await expect(stock(page, 'wheat')).toHaveText('8');
  await expect(stock(page, 'food')).toHaveText('4');
  await expect(page.getByRole('region', { name: 'Week report' })).toContainText('Farm batches: 4 planned / 4 completed / 0 blocked');
  await page.getByRole('button', { name: 'Plan next week' }).click();
  await expect(page.getByLabel('Food Processor workforce (WF)')).toHaveValue('0');
  await end(page, '0', '4');
  await expect(stock(page, 'gold')).toHaveText('6');
  await expect(stock(page, 'wheat')).toHaveText('0');
  await expect(stock(page, 'food')).toHaveText('12');
  await expect(page.getByTestId('weekly-week')).toHaveText('3');
});

test('Food chain keeps fractional Gold when no further whole batch is affordable', async ({ page }) => {
  await expect(page.getByLabel('Food Processor workforce (WF)')).toBeVisible();
  await page.route('**/assets/*.js', async route => {
    const response = await route.fetch(); const body = await response.text();
    const fixture = /inventory:\{gold:(?:10000|1e4),wheat:0,food:(?:4000|4e3),wood:0,iron:0\}/g;
    expect(body.match(fixture)).toHaveLength(1);
    await route.fulfill({ response, body: body.replace(fixture, 'inventory:{gold:1500,wheat:0,food:4000,wood:0,iron:0}') });
  });
  await page.reload(); await end(page, '4');
  await expect(stock(page, 'gold')).toHaveText('0.5');
  await expect(stock(page, 'food')).toHaveText('6');
  const report = page.getByRole('region', { name: 'Week report' });
  await expect(report).toContainText('Assigned but idle: 6 WF');
  await expect(report).toContainText('Unassigned: 2 WF');
  await expect(report).toContainText('Processor batches: 4 planned / 1 completed / 3 blocked');
});

test('Food chain rejects reservations exceeding the actual shared pool before harvest', async ({ page }) => {
  await page.route('**/assets/*.js', async route => {
    const response = await route.fetch(); const body = await response.text();
    const fixture = /id:"weekly_middle",occupation:"worker",socialClass:"common",legalStatus:"citizen",count:100/g;
    expect(body.match(fixture)).toHaveLength(1);
    await route.fulfill({ response, body: body.replace(fixture, 'id:"weekly_middle",occupation:"worker",socialClass:"common",legalStatus:"citizen",count:60') });
  });
  await page.reload(); await expect(page.getByTestId('weekly-workforce')).toHaveText('6 WF');
  await end(page, '4');
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page.getByTestId('weekly-week')).toHaveText('1');
  await expect(stock(page, 'gold')).toHaveText('10');
  await expect(stock(page, 'wheat')).toHaveText('0');
  await expect(stock(page, 'food')).toHaveText('4');
  await end(page, '3'); await expect(stock(page, 'food')).toHaveText('10');
});

test('Food chain allows harvest without a processor and does not offer processing', async ({ page }) => {
  await page.route('**/assets/*.js', async route => {
    const response = await route.fetch(); const body = await response.text();
    const fixture = /foodProcessorOperational:(?:true|!0)/g;
    expect(body.match(fixture)).toHaveLength(1);
    await route.fulfill({ response, body: body.replace(fixture, 'foodProcessorOperational:false') });
  });
  await page.reload();
  await expect(page.getByLabel('Food Processor workforce (WF)')).toBeDisabled();
  await expect(page.getByText('Food Processor unavailable', { exact: true })).toBeVisible();
  await page.getByLabel('Farm Field workforce (WF)').fill('4');
  await page.getByRole('button', { name: 'End Week', exact: true }).click();
  await expect(stock(page, 'wheat')).toHaveText('8'); await expect(stock(page, 'food')).toHaveText('4');
});
