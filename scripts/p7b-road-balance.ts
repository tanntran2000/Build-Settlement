// Node 24 source runner, following the B3 timing worker. No build or new dependency.
import { registerHooks } from 'node:module';
import { pathToFileURL } from 'node:url';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import ts from 'typescript';

const root = new URL('../', import.meta.url);
registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith('@haven/')) {
      return next(new URL('packages/' + specifier.split('/')[1] + '/src/index.ts', root).href, context);
    }
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

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { createCharacterLifeSession, crisisOptions, DEFAULT_PLAYER_DRAFT, societyPopulation } = await import('@haven/core');
  const { executeCharacterLifeCommand } = await import('@haven/simulation');
  const seed = 2026, duration = 40;
  const output = process.argv[2];
  if (!output) throw Error('Usage: node scripts/p7b-road-balance.ts <road-balance.txt>');
  const roads = ['build-first', 'slave-first', 'servant-first'] as const;
  const lines = [
    'P7-B road balance (TRIAL, measurement only). Seed ' + seed + '. ' + duration + ' closing weeks per road.',
    'Output = Goods produced plus each outside production resource separately, all in milli units.',
    'Gold is the closing balance after resolving that week’s crisis, if any.',
  ];
  for (const road of roads) {
    const created = createCharacterLifeSession(seed, { ...structuredClone(DEFAULT_PLAYER_DRAFT), currentName: 'Road Keeper' });
    if (!created.success) throw Error(created.error.message);
    let state = created.value;
    let lastWeek = 0, totalGoods = 0, report;
    const gold = () => state.city.world.settlements[state.city.world.activeSettlementId!].inventory.gold;
    function act(type: string, fields: Record<string, unknown> = {}) {
      const result = executeCharacterLifeCommand(state, { type, expectedRevision: state.city.revision, ...fields });
      if (!result.success) throw Error(road + ' week ' + state.city.world.week + ': ' + type + ': ' + result.error.code);
      state = result.next;
      return result.report;
    }
    const build = (tileId: string, typeId: string, workers: number) => {
      act('BUILD', { tileId, typeId });
      if (workers) act('SET_WORKERS', { tileId, workers });
    };
    const production = () => {
      build('forest-1', 'logging', 1);
      build('ore-1', 'mine', 1);
    };
    lines.push('', '[' + road + ']', 'week,goldMilli,goodsProducedMilli,woodMilli,ironMilli,stoneMilli,woolMilli,clothMilli,herbsMilli,npcs');
    for (let week = 1; week <= duration; week++) {
      if (week === 1) {
        if (road === 'build-first') production();
        else {
          const source = road === 'slave-first' ? 'slave-market' : 'guild';
          build(road === 'slave-first' ? 'slum-1' : 'service-1', source, 0);
          act('BUY_NPC', { source, slot: 0, homeTileId: 'estate-2' });
          act('ASSIGN_NPC', { npcId: state.npcs[0].character.id, tileId: 'plain-1' });
        }
      }
      if (week === 2 && road !== 'build-first') production();
      for (const npc of state.npcs) {
        const notice = npc.household.notice;
        if (notice) act('ANSWER_NOTICE', { npcId: npc.character.id, choice: notice === 'renewal' ? 'renew' : 'accept' });
      }
      report = act('END_WEEK', { expectedWeek: week });
      if (!report?.goodsStock || !report.outside) throw Error(road + ' missing production report at week ' + week);
      const society = state.city.society!, card = society.pendingCard;
      if (card) {
        const options = crisisOptions(card.kind, { population: societyPopulation(society), goldMilli: gold(),
          security: society.order.security, promisePending: society.crisis.promise !== null });
        const option = ['force', 'pay', 'promise', 'refuse'].find(option => options.some(view => view.available && view.option === option));
        act('CHOOSE_CARD_OPTION', { cardId: card.id, option });
      }
      const { wood, iron, stone, wool, cloth, herbs } = report.outside.producedMilli;
      const goods = report.goodsStock.producedMilli;
      lines.push([week, gold(), goods, wood ?? 0, iron ?? 0, stone ?? 0, wool ?? 0, cloth ?? 0, herbs ?? 0, state.npcs.length].join(','));
      lastWeek = week;
      totalGoods += goods;
      if (state.city.society!.crisis.stage === 'fallen') break;
      act('NEXT_WEEK');
    }
    const terminal = state.city.society!.crisis.fallCause ?? 'completed';
    lines.push(['summary', 'close=' + lastWeek, 'goldMilli=' + gold(), 'totalGoodsMilli=' + totalGoods,
      'npcs=' + state.npcs.length, 'terminal=' + terminal].join(','));
  }
  writeFileSync(output, lines.join('\n') + '\n', 'utf8');
}
