// One-off Tester check for UI-LEDGER-01 spec §8 item 7: trace while scrolling the Report view at 375 px.
const { chromium } = require('C:/Users/Admin/.t3/worktrees/Build-Settlement/qa-g6-closeout-01/node_modules/@playwright/test');
const out = process.argv[2];
(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const page = await context.newPage();
  await page.goto('http://localhost:4180/');
  await page.getByRole('button', { name: 'New Game', exact: true }).click();
  await page.getByRole('textbox', { name: 'Name', exact: true }).fill('Ada');
  await page.getByRole('tab', { name: 'Review' }).click();
  await page.getByRole('button', { name: 'Create character' }).click();
  await page.getByRole('button', { name: 'End Week' }).click();
  await page.locator('#life-reports-heading').waitFor();
  // Details left closed (default state)
  await page.waitForTimeout(500);
  await page.evaluate(() => {
    window.__frames = []; window.__loaf = [];
    let last = performance.now();
    const tick = now => { window.__frames.push(now - last); last = now; window.__raf = requestAnimationFrame(tick); };
    window.__raf = requestAnimationFrame(tick);
    try { new PerformanceObserver(l => l.getEntries().forEach(e => window.__loaf.push(e.duration))).observe({ type: 'long-animation-frame', buffered: false }); } catch {}
  });
  await context.tracing.start({ screenshots: true, snapshots: false });
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < height; y += 120) { await page.mouse.wheel(0, 120); await page.waitForTimeout(16); }
  for (let y = height; y > 0; y -= 240) { await page.mouse.wheel(0, -240); await page.waitForTimeout(16); }
  await page.waitForTimeout(300);
  await context.tracing.stop({ path: out });
  const r = await page.evaluate(() => { cancelAnimationFrame(window.__raf); const f = window.__frames.slice(1); const raw = f.slice(); return { rawFrameDeltasMs: raw, jsAsset: [...document.scripts].map(s => s.src).join(" "), frames: f.length, maxFrameMs: Math.max(...f), over50: f.filter(x => x > 50).length, p95: f.sort((a, b) => a - b)[Math.floor(f.length * 0.95)], longAnimationFrames: window.__loaf.length, maxLoafMs: window.__loaf.length ? Math.max(...window.__loaf) : 0, scrollHeight: document.documentElement.scrollHeight, overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth }; });
  console.log(JSON.stringify(r));
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
