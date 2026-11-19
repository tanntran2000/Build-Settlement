import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, relative, join } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { registerHooks } from 'node:module';

const [mode, dest] = process.argv.slice(2);
const checkout = process.cwd();
const base = '27f4dc2e0ea6ed4f12e79fab6366d11fb555551b';
const git = path => execFileSync('git', ['cat-file', 'blob', base + ':' + path], { encoding: 'utf8' });
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const write = (file, value) => writeFileSync(join(dest, file), JSON.stringify(value, null, 2) + '\n', 'utf8');
const seeds = [0, 42, 20261028];
if (mode !== 'diff') {
  mkdirSync(dest, { recursive: true });
  const ts = (await import(pathToFileURL(resolve('node_modules/typescript/lib/typescript.js')).href)).default;
  const alias = Object.fromEntries(['core', 'simulation', 'persistence'].map(name => ['@haven/' + name, pathToFileURL(resolve('packages', name, 'src/index.ts')).href]));
  const paths = new Set(execFileSync('git', ['ls-tree', '-r', '--name-only', base, '--', 'packages'], { encoding: 'utf8' }).split(/\r?\n/));
  registerHooks({
    resolve(specifier, context, next) {
      if (Object.hasOwn(alias, specifier)) return next(alias[specifier], context);
      if (context.parentURL?.startsWith('file:') && specifier.startsWith('.') && specifier.endsWith('.js')) {
        const target = new URL(specifier.replace(/\.js$/, '.ts'), context.parentURL);
        if (existsSync(target)) return next(target.href, context);
      }
      return next(specifier, context);
    },
    load(url, context, next) {
      if (!url.startsWith('file:') || !/\.(ts|json)$/.test(url)) return next(url, context);
      const path = relative(checkout, fileURLToPath(url)).replaceAll('\\', '/');
      if (!path.startsWith('packages/')) return next(url, context);
      const source = mode === 'base' && paths.has(path) ? git(path) : readFileSync(new URL(url), 'utf8');
      if (url.endsWith('.json')) return { format: 'json', shortCircuit: true, source };
      return { format: 'module', shortCircuit: true, source: ts.transpileModule(source, {
        compilerOptions: { target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.ESNext },
      }).outputText };
    },
  });
  const { createSocietyState } = await import(alias['@haven/core']);
  const { runTileTrialWeek } = await import(pathToFileURL(resolve('packages/simulation/src/tile-trial-week.ts')).href);
  for (const seed of seeds) {
    const city = createSocietyState();
    city.world.worldMetadata.worldSeed = seed;
    const stock = city.world.settlements[city.world.activeSettlementId].inventory;
    for (const key of ['gold', 'food', 'wood', 'iron']) stock[key] = 1000000;
    city.goodsStock.amountMilli = 1000000;
    const reports = [], items = [], reduced = [];
    for (let i = 0; i < 60; i++) {
      const report = runTileTrialWeek(city);
      reports.push(report);
      items.push(structuredClone(city.society.items));
      reduced.push({ crime: report.crimeEvent, crisis: report.crisis, order: report.order, laws: report.laws });
      city.phase = 'planning';
    }
    const result = { seed, reports, items, city, reduced, hashes: { reports: hash(reports), items: hash(items), city: hash(city), reduced: hash(reduced) } };
    write(mode + '-' + seed + '.json', result);
    console.log(mode, seed, JSON.stringify(result.hashes));
  }
} else {
  const reports = [];
  const craft = git('packages/simulation/src/__tests__/craft-week.test.ts');
  const items = git('packages/simulation/src/__tests__/items-week.test.ts');
  const object = value => value !== null && typeof value === 'object';
  function walk(old, now, path, output, rootOld, rootNew) {
    if (Object.is(old, now)) return;
    if (object(old) && object(now) && Array.isArray(old) === Array.isArray(now)) {
      for (const key of new Set([...Object.keys(old), ...Object.keys(now)])) walk(old[key], now[key], [...path, key], output, rootOld, rootNew);
      return;
    }
    const name = path.join('.');
    const pathGold = name === 'city.world.settlements.settlement_haven_01.inventory.gold' ||
      /^reports\.\d+\.(before|after)\.gold$/.test(name) || /^(reports|reduced)\.\d+\.order\.theftMilli\.gold$/.test(name);
    const eventGold = /^(reports|reduced)\.\d+\.(crime|crimeEvent)\.event\.lossMilli$/.test(name) &&
      [rootOld, rootNew].every(root => path.slice(0, -1).reduce((value, key) => value?.[key], root)?.target === 'gold');
    const household = /^reports\.\d+\.householdUpkeep(?:\.(?:paidMilli|unpaidMilli))?$/.test(name);
    const mapping = name === 'city.society.rulesetId' ||
      (/^city\.tiles\.(?:6[3-9]|7[0-4])$/.test(name) && old === undefined);
    output.push({ path: name, before: old, after: now, allowed: pathGold || eventGold || household || mapping });
  }
  for (const seed of seeds) {
    const old = JSON.parse(readFileSync(join(dest, 'base-' + seed + '.json'), 'utf8'));
    const next = JSON.parse(readFileSync(join(dest, 'candidate-' + seed + '.json'), 'utf8'));
    const craftLine = craft.split('\n').find(line => line.trimStart().startsWith(seed + ': {reports:'));
    const itemsLine = items.split('\n').find(line => line.trimStart().startsWith(seed + ': '));
    if (!['reports', 'items', 'city'].every(name => craftLine.includes(old.hashes[name])) || !itemsLine.includes(old.hashes.reduced)) {
      throw Error('Baseline run does not match original test pins at seed ' + seed);
    }
    const changes = [];
    for (const path of ['reports', 'items', 'city', 'reduced']) walk(old[path], next[path], [path], changes, old, next);
    reports.push({ seed, beforeHashes: old.hashes, afterHashes: next.hashes, changes, forbidden: changes.filter(row => !row.allowed) });
    console.log(JSON.stringify({ seed, basePinsVerified: true, beforeHashes: old.hashes, afterHashes: next.hashes, changes: changes.length, forbidden: changes.filter(row => !row.allowed).map(row => row.path) }));
  }
  write('leaf-diff.json', reports);
  if (reports.some(row => row.forbidden.length)) process.exitCode = 1;
}
