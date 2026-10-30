// Research driver for Free Cities: plays N weeks, logs passages, events and key state per week.
// Usage: node fc-run.js <outDir> <weeks> <light|dark>
const { chromium } = require('D:/NghienCuuTiemNang/Build-Settlement/node_modules/playwright');
const fs = require('node:fs');
const path = require('node:path');

const [outDir, weeksArg = '2', side = 'light'] = process.argv.slice(2);
const WEEKS = Number(weeksArg);
const URL = 'file:///D:/NghienCuuTiemNang/fc-pregmod-pregmod-master/bin/FC_pregmod.html';
// Intro choices in priority order; adults-only and no extreme content are hard choices.
const INTRO = [
  'I am 18 or more years of age, I understand, and I wish to continue', 'Next',
  "They've turned a blind eye, or even been complicit.", 'They drew back from them.',
  'Free Cities that were open-minded about who could be a slave girl.', 'No.',
  'Confirm player character overview', 'Finish player character customization', 'Engineering',
  'Clever social engineering', 'A newly constructed arcology', 'Take control of your arcology', 'Continue',
];

fs.mkdirSync(outDir, { recursive: true });
const log = fs.createWriteStream(path.join(outDir, 'passages.log'));
const metrics = [];

const passage = page => page.evaluate(() => SugarCube.State.passage);
const text = page => page.evaluate(() => document.querySelector('[id^="passage-"]')?.innerText ?? '');
async function links(page) {
  return page.evaluate(() => [...document.querySelectorAll('a, button')].filter(a => a.closest('[id^="passage-"]'))
    .map(a => a.textContent.trim()).filter(Boolean));
}
async function clickText(page, label) {
  return page.evaluate(label => {
    const el = [...document.querySelectorAll('a, button')]
      .find(a => a.textContent.trim() === label && (a.closest('[id^="passage-"]') || a.closest('#ui-bar')));
    if (!el) return false;
    el.click(); return true;
  }, label);
}
async function settle(page) { await page.waitForTimeout(400); }
async function visit(page, name) { await page.evaluate(n => SugarCube.Engine.play(n), name); await settle(page); }
// Security Expansion adds security, crime, authority and rebellions; it is off by default.
async function enableSecExp(page) {
  // Same effect as the intro option's own callback.
  const ok = await page.evaluate(() => { SugarCube.State.variables.secExpEnabled = 1; App.Mods.SecExp.Obj.Init(); return SugarCube.State.variables.secExpEnabled; });
  log.write(`[intro] SecExp enabled: ${ok}
`);
}

async function snapshot(page, week) {
  const m = await page.evaluate(() => {
    const V = SugarCube.State.variables, a = V.arcologies?.[0] ?? {};
    const pick = o => Object.fromEntries(Object.entries(o).filter(([, v]) => typeof v === 'number'));
    return {
      week: V.week, cash: V.cash, rep: V.rep, passage: SugarCube.State.passage,
      arc: { prosperity: a.prosperity, ownership: a.ownership, minority: a.minority, FSPaternalist: a.FSPaternalist, FSDegradationist: a.FSDegradationist },
      classes: { lower: V.lowerClass, middle: V.middleClass, upper: V.upperClass, top: V.topClass, menials: V.menials, NPCSlaves: V.NPCSlaves },
      secExp: V.secExpEnabled, sec: V.SecExp ? { core: pick(V.SecExp.core ?? {}), tension: V.SecExp.rebellions?.tension } : null,
      slaves: V.slaves?.length,
    };
  });
  metrics.push({ loopWeek: week, ...m });
  fs.writeFileSync(path.join(outDir, 'metrics.json'), JSON.stringify(metrics, null, 1));
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.on('pageerror', e => log.write(`!! pageerror ${e.message}\n`));
  await page.goto(URL, { timeout: 120000 });
  await page.waitForFunction(() => window.SugarCube?.State?.passage, null, { timeout: 120000 });

  for (let step = 0; step < 60 && (await passage(page)) !== 'Main'; step++) {
    const p = await passage(page), ls = await links(page);
    if (p === 'Intro Summary') await enableSecExp(page);
    const pick = INTRO.find(t => ls.includes(t)) ?? ls[0];
    log.write(`[intro] ${p} -> ${pick}\n`);
    if (!pick || !(await clickText(page, pick))) { log.write(`!! stuck at ${p}\n`); break; }
    await settle(page);
  }
  log.write(`[intro done] ${await passage(page)}\n`);
  await snapshot(page, 0);
  fs.writeFileSync(path.join(outDir, 'main.txt'), await text(page));

  const reports = path.join(outDir, 'reports'); fs.mkdirSync(reports, { recursive: true });
  const fsLink = side === 'dark' ? 'Degradationism' : 'Paternalism';
  let fsDone = false;
  for (let w = 1; w <= WEEKS; w++) {
    // Survey screens once early and once late, to record what each one offers.
    if (w === 1 || w === WEEKS) for (const s of ['Future Society', 'Policies', 'Manage Arcology', 'Buy Slaves', 'The Black Market', 'edicts', 'securityHQ']) {
      await visit(page, s); fs.writeFileSync(path.join(reports, `screen-w${w}-${s.replace(/\W+/g, '_')}.txt`), await text(page));
    }
    // Re-adopt when the society project fails, to see how often it fails without support.
    const fsKey = side === 'dark' ? 'FSDegradationist' : 'FSPaternalist';
    if (await page.evaluate(k => SugarCube.State.variables.arcologies[0][k] === null, fsKey)) {
      await visit(page, 'Future Society');
      if (await clickText(page, fsLink)) log.write(`[action w${w}] adopted ${fsLink}${fsDone ? ' (again)' : ''}\n`);
      fsDone = true;
    }
    await visit(page, 'Main');
    if (!(await clickText(page, 'END WEEK'))) { log.write(`!! no END WEEK at w${w}\n`); break; }
    await settle(page);
    let pages = ''; const seen = new Map(), triedBy = new Map();
    for (let step = 0; step < 120; step++) {
      const p = await passage(page);
      if (p === 'Main') break;
      const t = await text(page), ls = await links(page);
      pages += `\n===== ${p}\n${t.slice(0, 8000)}\n`;
      // Odd weeks take the first event option to see consequences; otherwise decline with Continue.
      const isEvent = /Event/.test(p);
      const key = p + t.slice(0, 200); seen.set(key, (seen.get(key) ?? 0) + 1);
      const choice = isEvent && w % 2 === 1 && seen.get(key) === 1 ? ls.find(l => l.length > 3 && !/^(Continue|Hide|Show|Open All|Close All)/.test(l) && !/[☆★]/.test(l)) : null;
      // A forced choice (e.g. a battle) has no Continue: deploy and fight, else bribe, else surrender, else try each unclicked link once.
      const tried = triedBy.get(key) ?? new Set(); triedBy.set(key, tried);
      const forced = seen.get(key) > 1 || !ls.includes('Continue')
        ? ['(Deploy)', 'Deploy', 'Send your orders', ...ls.filter(l => /^Attempt to bribe/.test(l)), 'Surrender', ...ls].find(l => ls.includes(l) && !tried.has(l) && !/[☆★]/.test(l))
        : null;
      const pick = choice ?? forced ?? 'Continue';
      tried.add(pick);
      log.write(`[w${w}] ${p}${pick !== 'Continue' ? ` -> "${pick}"` : ''}\n`);
      if (!(await clickText(page, pick))) { log.write(`!! stuck at ${p}\n`); break; }
      await settle(page);
    }
    fs.writeFileSync(path.join(reports, `week-${String(w).padStart(2, '0')}.txt`), pages);
    await snapshot(page, w);
  }
  await browser.close();
})().catch(e => { log.write(`!! fatal ${e.stack}\n`); process.exitCode = 1; });
