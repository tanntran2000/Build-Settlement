// Synthetic capacity probe. This reuses the same no-build source hook as prove-step0.mjs.
import { readFileSync, writeFileSync } from 'node:fs';
import { registerHooks, createRequire } from 'node:module';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';

const root = pathToFileURL(resolve(process.argv[2]) + '/');
const ts = createRequire(new URL('package.json', root))('typescript');
registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith('@haven/')) return next(new URL('packages/' + specifier.split('/')[1] + '/src/index.ts', root).href, context);
    if (specifier.startsWith('.') && specifier.endsWith('.js') && context.parentURL?.endsWith('.ts')) {
      const candidate = new URL(specifier.slice(0, -3) + '.ts', context.parentURL);
      if (existsSync(candidate)) return next(candidate.href, context);
    }
    return next(specifier, context);
  },
  load(url, context, next) {
    if (url.startsWith('file:') && url.endsWith('.ts')) {
      const source = ts.transpileModule(readFileSync(new URL(url), 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ESNext },
      }).outputText;
      return { format: 'module', source, shortCircuit: true };
    }
    return next(url, context);
  },
});
const from = file => import(new URL(file, root).href);
const { populate, town, succeeded } = await from('packages/simulation/src/__tests__/acquisition-fixture.ts');
const { serializeCharacterLifeSave, deserializeCharacterLifeSave } = await from('packages/persistence/src/index.ts');
let state = town(7);
populate(state, [...Array(30).fill('estate-1'), ...Array(50).fill('estate-2'), ...Array(20).fill('house-5')]);
for (const [tileId, typeId] of [['service-1', 'guild'], ['spec-2', 'auction-house'], ['slum-1', 'slave-market']]) {
  state = succeeded(state, 'BUILD', { tileId, typeId }).next;
}
function length(s) {
  const enc = serializeCharacterLifeSave(s);
  assert.equal(enc.success, true, JSON.stringify(enc));
  assert.deepEqual(deserializeCharacterLifeSave(enc.text), { success: true, state: s });
  return Buffer.byteLength(enc.text);
}
const bytesWithoutNotices = length(state);
for (const npc of state.npcs) {
  npc.household.notice = 'lifelong';
  npc.household.lifelongAskWeek = state.city.world.week - 10;
  npc.character.relationshipToPlayer.affection = 75;
}
const bytesWithNotices = length(state);
assert.ok(bytesWithNotices <= 1048576);
const { stock, lots } = state.city.society.acquisition;
const line = JSON.stringify({
  npcs: state.npcs.length, notices: state.npcs.filter(n => n.household.notice).length, stock: stock.length, lots: lots.length,
  recentEntriesPerNpc: state.npcs[0].life.history.recent.length, bytesWithoutNotices, bytesWithNotices,
  offBudgetBy: bytesWithNotices - 1048576,
});
writeFileSync(process.argv[3], 'Node scratch JSON round-trip, synthetic 100-NPC fixture, exit 0\n' + line + '\n', 'utf8');
console.log(line);

