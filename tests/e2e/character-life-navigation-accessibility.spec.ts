import { expect, test, type Locator, type Page } from '@playwright/test';
import { executeCharacterLifeCommand } from '../../packages/simulation/src/character-life-command.ts';
import { writeFile } from 'node:fs/promises';
import { characterWindow, charactersView, expectReport, go, importLife, keyActivate, keyGo, makeLife, reportFixture, reportRegion, selectArea, selectPerson, tabTo, turnStatuses, watchTurnStatus } from './character-life-navigation.helpers.ts';

function contrast(a: number[], b: number[]) {
  const luminance = (rgb: number[]) => rgb.reduce((sum, c, i) => {
    const s = c / 255;
    return sum + (s <= .04045 ? s / 12.92 : ((s + .055) / 1.055) ** 2.4) * [.2126, .7152, .0722][i];
  }, 0);
  const [x, y] = [luminance(a), luminance(b)];
  return (Math.max(x, y) + .05) / (Math.min(x, y) + .05);
}

// Measure actual rendered text, alpha/opacity composites and panel/control geometry.
async function measure(root: Locator) {
  return root.evaluate(root => {
    const rgb = (s: string) => s.match(/[\d.]+/g)!.map(Number);
    const over = (fg: number[], bg: number[]) => fg.slice(0, 3).map((v, i) => v * (fg[3] ?? 1) + bg[i] * (1 - (fg[3] ?? 1)));
    const colors = (el: Element) => {
      const ancestors: Element[] = [];
      for (let p = el.parentElement; p; p = p.parentElement) ancestors.unshift(p);
      let adjacent = [255, 255, 255];
      for (const p of ancestors) adjacent = over(rgb(getComputedStyle(p).backgroundColor), adjacent);
      const css = getComputedStyle(el), opacity = Number(css.opacity), bg = over(rgb(css.backgroundColor), adjacent);
      const composite = (color: string, backdrop: number[]) => over([...over(rgb(color), bg), opacity], backdrop);
      return { fg: composite(css.color, adjacent), bg: over([...bg, opacity], adjacent), adjacent,
        border: composite(css.borderTopColor, adjacent), outline: over([...over(rgb(css.outlineColor), adjacent), opacity], adjacent) };
    };
    const visible = (el: Element) => !!el.getClientRects().length && !el.closest('[hidden]') && getComputedStyle(el).visibility !== 'hidden';
    const clipping: string[] = [], texts = [];
    const viewport = document.documentElement.clientWidth;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let rangeCount = 0;
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const el = node.parentElement!;
      if (!node.textContent?.trim() || !visible(el) || el.closest('option,script,style')) continue;
      const range = document.createRange(); range.selectNodeContents(node);
      const rects = [...range.getClientRects()].filter(r => r.width && r.height);
      if (!rects.length) continue;
      const ledger = el.closest('.ledger');
      const panel = el.closest('.card') ?? root;
      const panelBox = panel.getBoundingClientRect();
      texts.push({ label: node.textContent.trim().slice(0, 50), ...colors(el), inactive: !!el.closest(':disabled,[aria-disabled="true"]'), size: parseFloat(getComputedStyle(el).fontSize),
        rects: rects.map(r => ({ left: r.left, right: r.right, top: r.top, bottom: r.bottom })), panel: { left: panelBox.left, right: panelBox.right } });
      for (const r of rects) {
        rangeCount++;
        if (!ledger && (r.left < -1 || r.right > viewport + 1 || r.left < panelBox.left - 1 || r.right > panelBox.right + 1)) clipping.push(`text outside panel/viewport: ${node.textContent.trim().slice(0, 45)}`);
        for (let p = el; p; p = p.parentElement!) {
          const c = getComputedStyle(p), b = p.getBoundingClientRect();
          if (!ledger && /hidden|clip|auto|scroll/.test(c.overflowX) && (r.left < b.left - 1 || r.right > b.right + 1)) clipping.push(`text clipped x: ${node.textContent.trim().slice(0, 45)}`);
          if (/hidden|clip/.test(c.overflowY) && (r.top < b.top - 1 || r.bottom > b.bottom + 1)) clipping.push('text clipped y');
        }
      }
    }
    const controls = [...root.querySelectorAll<HTMLElement>('button,input,select,summary,a[href],[tabindex="0"]')].filter(visible).map(el => {
      const css = getComputedStyle(el), r = el.getBoundingClientRect(), panel = (el.closest('.card') ?? root).getBoundingClientRect();
      if (r.left < -1 || r.right > viewport + 1 || r.left < panel.left - 1 || r.right > panel.right + 1) clipping.push(`control clipped: ${el.id || el.textContent?.slice(0, 40)}`);
      return { label: el.id || el.textContent?.trim().slice(0, 50) || el.tagName, width: r.width, height: r.height,
        tag: el.tagName, boundary: el.matches('button,input,select'), inactive: el.matches(':disabled,[aria-disabled="true"]'),
        selected: el.matches('[aria-pressed="true"],[aria-selected="true"],[aria-current="page"]'),
        fontWeight: Number(css.fontWeight), borderWidth: parseFloat(css.borderTopWidth), ...colors(el) };
    });
    return { width: innerWidth, rangeCount, clipping, texts, controls,
      animation: [...root.querySelectorAll('*')].filter(visible).filter(el => { const css = getComputedStyle(el); return css.animationName !== 'none' || css.scrollBehavior === 'smooth'; }).length };
  });
}

type Measurement = Awaited<ReturnType<typeof measure>>;
function audit(m: Measurement, failures: string[]) {
  failures.push(...m.clipping);
  if (m.animation) failures.push('animation or smooth scrolling');
  for (const t of m.texts) {
    const ratio = contrast(t.fg, t.bg);
    if (ratio < (t.inactive ? 3 : 4.5)) failures.push(`text contrast ${ratio.toFixed(3)}: ${t.label}`);
    if (t.size < 14) failures.push(`text below 14px: ${t.label}`);
  }
  for (const c of m.controls) {
    const turn = c.label === 'life-end-week' || c.label === 'Plan next week';
    if (c.width < (turn ? 44 : 24) || c.height < (turn ? 44 : 24)) failures.push(`target ${c.width}x${c.height}: ${c.label}`);
    if (c.boundary && Math.max(contrast(c.border, c.adjacent), contrast(c.bg, c.adjacent)) < 3) failures.push(`control boundary below 3: ${c.label}`);
    if (c.selected && c.fontWeight < 600 && c.borderWidth < 3) failures.push(`selected only by color: ${c.label}`);
  }
}

async function auditTabOrder(page: Page, failures: string[], samples: unknown[]) {
  const controls = page.getByTestId('life-shell').locator('button:not(:disabled),input:not(:disabled),select:not(:disabled),summary,a[href],[tabindex="0"]');
  const targets = await controls.all();
  for (const target of targets) {
    if (!await target.isVisible() || await target.getAttribute('tabindex') === '-1') continue;
    await tabTo(page, target);
    const focus = await target.evaluate(el => {
      const r = el.getBoundingClientRect(), css = getComputedStyle(el);
      const clips: string[] = [];
      // Include the outline, not just the content box, in scroll-container clipping checks.
      const margin = parseFloat(css.outlineWidth) + parseFloat(css.outlineOffset);
      for (let p = el.parentElement; p; p = p.parentElement) {
        const c = getComputedStyle(p), b = p.getBoundingClientRect();
        if (/auto|scroll|hidden|clip/.test(c.overflowY) && (r.top - margin < b.top - 1 || r.bottom + margin > b.bottom + 1)) clips.push('focus clipped vertically');
        if (/auto|scroll|hidden|clip/.test(c.overflowX) && (r.left - margin < b.left - 1 || r.right + margin > b.right + 1)) clips.push('focus clipped horizontally');
      }
      const color = (s: string) => s.match(/[\d.]+/g)!.map(Number);
      let p: Element | null = el.parentElement;
      while (p && color(getComputedStyle(p).backgroundColor)[3] === 0) p = p.parentElement;
      const bg = color(p ? getComputedStyle(p).backgroundColor : 'rgb(255,255,255)'), raw = color(css.outlineColor), opacity = Number(css.opacity);
      const rendered = raw.slice(0, 3).map((c, i) => c * (raw[3] ?? 1) * opacity + bg[i] * (1 - (raw[3] ?? 1) * opacity));
      return { clips, box: { left: r.left, right: r.right, top: r.top, bottom: r.bottom }, outline: parseFloat(css.outlineWidth), color: rendered, bg,
        inViewport: r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight };
    });
    failures.push(...focus.clips);
    samples.push({ label: await target.textContent(), ...focus, ratio: contrast(focus.color, focus.bg) });
    if (!focus.inViewport || focus.outline < 3 || contrast(focus.color, focus.bg) < 3) failures.push(`focus visibility/contrast: ${await target.textContent()} ${JSON.stringify(focus)}`);
  }
  return targets.length;
}

for (const viewport of [{ width: 1280, height: 900 }, { width: 375, height: 812 }, { width: 320, height: 812 }]) {
  test.describe(`accessibility at ${viewport.width}px`, () => {
    test.use({ viewport });
    test('life shell accessibility baseline', async ({ page }, info) => {
      test.setTimeout(180000);
      expect(contrast([0, 0, 0], [255, 255, 255])).toBe(21);
      expect(contrast([42, 42, 42], [42, 42, 42])).toBe(1);
      await page.goto('/?mode=world-life'); await importLife(page, makeLife());
      const failures: string[] = [], measurements: Measurement[] = [], tabCounts: number[] = [], focus: unknown[] = [];
      const capture = async () => { const m = await measure(page.getByTestId('life-shell')); measurements.push(m); audit(m, failures); tabCounts.push(await auditTabOrder(page, failures, focus)); };
      await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
      const nav = page.getByRole('navigation', { name: 'Main', exact: true });
      const shell = page.getByTestId('life-shell');
      await expect(shell).toHaveCSS('font-size', '16px');
      await expect(shell.locator('aside')).toHaveCSS('position', viewport.width > 750 ? 'sticky' : 'static');
      await expect(shell.locator('aside')).toHaveCSS('overflow-y', viewport.width > 750 ? 'auto' : 'visible');
      await expect(shell.locator('.content')).toHaveCSS('overflow-y', viewport.width > 750 ? 'auto' : 'visible');
      await expect(nav).toHaveCSS('flex-direction', viewport.width > 750 ? 'column' : 'row');
      if (viewport.width <= 750) await expect(nav).toHaveCSS('flex-wrap', 'wrap');
      await expect(nav.getByRole('button')).toHaveText(['City', 'Characters', 'Reports', 'Session', 'Help']);
      for (const dest of ['city', 'characters', 'reports', 'session', 'help'] as const) {
        await keyGo(page, dest); await expect(nav.locator('[aria-current="page"]')).toHaveText(dest[0].toUpperCase() + dest.slice(1));
        for (const hidden of await shell.locator('[data-life-view][hidden]').all()) await expect(hidden).toHaveCSS('display', 'none');
        if (dest === 'city') {
          await keyActivate(page, page.getByTestId('trial-tile-field-1'));
          await keyActivate(page, page.getByRole('region', { name: 'Outside world', exact: true }).locator('summary'));
        }
        if (dest === 'session') await keyActivate(page, page.getByText('About checkpoints', { exact: true }));
        if (dest === 'help') for (const summary of await page.locator('[data-life-view="help"] summary').all()) await keyActivate(page, summary);
        await capture();
        if (dest === 'characters') {
          for (const id of ['player', 'npc_starter_1']) {
            await keyActivate(page, charactersView(page).getByTestId(`character-${id}`));
            const win = characterWindow(page), tabs = win.getByRole('tab');
            await expect(tabs).toHaveText(['Description', 'Inventory', 'Work', 'Relations']);
            await tabTo(page, win.locator('[role="tab"][tabindex="0"]')); await page.keyboard.press('Home');
            for (const name of ['Description', 'Inventory', 'Work', 'Relations']) {
              const tab = win.getByRole('tab', { name, exact: true });
              await expect(tab).toBeFocused(); await expect(tab).toHaveAttribute('aria-selected', 'true');
              await expect(win.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', (await tab.getAttribute('id'))!);
              await expect(win.getByRole('tabpanel')).toHaveCount(1);
              if (name === 'Description') for (const summary of await win.locator('summary').all()) await keyActivate(page, summary);
              await capture();
              await tabTo(page, win.locator('[role="tab"][tabindex="0"]')); await page.keyboard.press('ArrowRight');
            }
            await page.keyboard.press('End'); await expect(win.getByRole('tab', { name: 'Relations', exact: true })).toBeFocused();
            await page.keyboard.press('Home'); await page.keyboard.press('ArrowLeft'); await expect(win.getByRole('tab', { name: 'Relations', exact: true })).toBeFocused();
          }
        }
      }
      await watchTurnStatus(page); await keyActivate(page, page.getByTestId('life-end-week')); await capture();
      for (const summary of await reportRegion(page).locator('summary').all()) await keyActivate(page, summary);
      await capture();
      await keyGo(page, 'city'); await capture(); await keyGo(page, 'characters'); await capture();
      await keyGo(page, 'session'); await capture(); await keyGo(page, 'reports');
      await keyActivate(page, page.getByRole('button', { name: 'Plan next week', exact: true })); await capture();
      expect(await turnStatuses(page)).toEqual(['Week 1 report ready.', 'Planning week 2. Previous report retained.']);
      const path = info.outputPath('measurements.json');
      await writeFile(path, JSON.stringify({ method: 'CSS viewport widths; no calibrated zoom or screen-reader claim', measurements, tabCounts, focus, failures }, null, 2));
      await info.attach('measurements', { path, contentType: 'application/json' });
      expect([...new Set(failures)]).toEqual([]);
    });

    test('long character and report content reflows', async ({ page }, info) => {
      test.setTimeout(180000);
      const session = reportFixture('precision');
      session.player.character.name = 'W'.repeat(64); session.npcs[0].character.name = 'M'.repeat(64);
      for (const profile of [session.player.profile, ...session.profiles]) {
        profile.identity.label = 'L'.repeat(40); profile.identity.biography = 'B'.repeat(1000);
      }
      const inventory = session.city.world.settlements[session.city.world.activeSettlementId!].inventory;
      inventory.wood = Number.MAX_SAFE_INTEGER - 1000000; inventory.iron = Number.MAX_SAFE_INTEGER - 1000000;
      await page.goto('/?mode=world-life'); await importLife(page, session);
      const failures: string[] = [], measurements: Measurement[] = [];
      const capture = async () => { const m = await measure(page.getByTestId('life-shell')); measurements.push(m); audit(m, failures); };
      for (const dest of ['city', 'characters', 'reports', 'session', 'help'] as const) {
        await go(page, dest);
        if (dest !== 'characters' && dest !== 'reports') for (const summary of await page.locator(`[data-life-view="${dest}"] summary`).all()) await summary.click();
        await capture();
        if (dest === 'characters') for (const id of ['player', ...session.npcs.map(n => n.character.id)]) {
          await selectPerson(page, id);
          for (const area of ['Description', 'Inventory', 'Work', 'Relations']) {
            await selectArea(page, area);
            if (area === 'Description') for (const summary of await characterWindow(page).locator('summary').all()) await summary.click();
            await capture();
          }
        }
      }
      await page.getByTestId('life-end-week').click();
      const result = executeCharacterLifeCommand(session, { type: 'END_WEEK', expectedRevision: session.city.revision, expectedWeek: 1 });
      if (!result.success || !result.report) throw Error('Long report oracle failed');
      await expectReport(page, result.report);
      for (const summary of await reportRegion(page).locator('summary').all()) await summary.click();
      await capture();
      const ledger = reportRegion(page).getByRole('region', { name: 'Weekly stock ledger scroll area', exact: true });
      await tabTo(page, ledger);
      const sizes = await ledger.evaluate(el => ({ client: el.clientWidth, scroll: el.scrollWidth }));
      if (viewport.width <= 375) expect(sizes.scroll).toBeGreaterThan(sizes.client);
      const columns: unknown[] = [];
      for (let column = 0; column < 4; column++) {
        await page.keyboard.press('Home');
        for (let i = 0; i < 80; i++) {
          const boxes = await ledger.evaluate((el, column) => {
            const b = el.getBoundingClientRect(), cells = [...el.querySelectorAll('tr')].map(row => row.children[column]);
            return cells.map(cell => { const range = document.createRange(); range.selectNodeContents(cell); const r = range.getBoundingClientRect(); return { left: r.left - b.left, right: r.right - b.left, width: el.clientWidth }; });
          }, column);
          if (boxes.every(b => b.left >= -1 && b.right <= b.width + 1)) { columns.push({ column, boxes }); break; }
          await page.keyboard.press('ArrowRight');
          await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
        }
        expect(columns.length, `ledger column ${column} reachable unclipped`).toBe(column + 1);
      }
      const path = info.outputPath('reflow.json');
      await writeFile(path, JSON.stringify({ measurements, sizes, columns, failures }, null, 2));
      await info.attach('reflow', { path, contentType: 'application/json' });
      expect([...new Set(failures)]).toEqual([]);
    });
  });
}
