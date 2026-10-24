import { expect, it } from 'vitest';
import { createTileTrialState } from '../../trial/state.js';
import { createWorldSession, isWorldSessionState, outsideProvenance, summarizeOutside, WORLD_SESSION_CITY_RULESET } from '../session.js';
import type { WorldSessionState } from '../types.js';

const session = (seed = 0) => {
  const result = createWorldSession(seed); if (!result.success) throw Error(result.error.message); return result.value;
};
// Independent approved scenario goldens; all unspecified tiles have no feature.
it.each([
  [0, [['o61', 'iron'], ['o49', 'wood'], ['o19', 'iron'], ['o67', 'wheat'], ['o37', 'wood'], ['o33', 'iron']], 'o13 o30 o31 o34 o39 o41 o54 o64 o73 o76 o81 o85'],
  [4294967295, [['o30', 'iron'], ['o41', 'iron'], ['o52', 'wood'], ['o68', 'wood'], ['o48', 'wood'], ['o86', 'wood']], 'o11 o13 o15 o18 o27 o29 o36 o54 o57 o62 o63 o67'],
] as const)('matches all 90 scenario tiles for seed %s', (seed, deposits, loot) => {
  const s = session(seed); expect(s.city).toEqual(createTileTrialState()); expect(WORLD_SESSION_CITY_RULESET).toBe('tile-population-01');
  expect(s.outside.actors).toEqual(['player', 'ai-1', 'ai-2']);
  const lootIds = loot.split(' ');
  expect(s.outside.tiles).toHaveLength(90);
  s.outside.tiles.forEach((tile, i) => {
    const id = `o${String(i + 1).padStart(2, '0')}`, resource = deposits.find(([key]) => key === id)?.[1];
    const owner = i < 5 ? 'ai-1' : i < 10 ? 'ai-2' : null;
    expect(tile).toEqual({ id, owner, knownBy: owner ? [owner] : [], feature: resource ? { kind: 'deposit', resource } : lootIds.includes(id) ? { kind: 'loot', claimedBy: null } : null });
  });
  expect(isWorldSessionState(s)).toBe(true);
});
it('accepts future action shapes without regenerating or pinning starting ownership', () => {
  const s = session(); s.outside.tiles[10].owner = 'player'; s.outside.tiles[10].knownBy = ['player', 'ai-1'];
  const tile = s.outside.tiles.find(t => t.feature?.kind === 'loot')!;
  tile.knownBy = ['player']; tile.feature = { kind: 'loot', claimedBy: 'player' };
  expect(isWorldSessionState(s)).toBe(true);
});
const mutations: [string, (s: WorldSessionState) => void][] = [
  ['ineligible feature', s => { s.outside.tiles[0].feature = { kind: 'loot', claimedBy: null }; }],
  ['five deposits', s => { s.outside.tiles.find(t => t.feature?.kind === 'deposit')!.feature = null; }],
  ['seven deposits', s => { s.outside.tiles[10].feature = { kind: 'deposit', resource: 'wheat' }; }],
  ['eleven loot', s => { s.outside.tiles.find(t => t.feature?.kind === 'loot')!.feature = null; }],
  ['thirteen loot', s => { s.outside.tiles[10].feature = { kind: 'loot', claimedBy: null }; }],
  ['extra actor', s => { s.outside.actors.push('ai-3'); }],
  ['swapped order', s => { [s.outside.tiles[0], s.outside.tiles[1]] = [s.outside.tiles[1], s.outside.tiles[0]]; }],
  ['dangling owner', s => { s.outside.tiles[0].owner = 'ghost'; }],
  ['dangling knower', s => { s.outside.tiles[0].knownBy = ['ghost']; }],
  ['non-knower receipt', s => { s.outside.tiles.find(t => t.feature?.kind === 'loot')!.feature = { kind: 'loot', claimedBy: 'player' }; }],
  ['unsorted knowledge', s => { s.outside.tiles[10].knownBy = ['ai-1', 'player']; }],
  ['duplicate knowledge', s => { s.outside.tiles[10].knownBy = ['player', 'player']; }],
  ['empty id', s => { s.outside.tiles[0].id = ''; }],
  ['whitespace id', s => { s.outside.tiles[0].id = ' o01'; }],
  ['long id', s => { s.outside.tiles[0].id = 'x'.repeat(65); }],
  ['report city', s => { s.city.phase = 'report'; }],
];
it.each(mutations)('rejects %s', (_, mutate) => { const s = session(); mutate(s); expect(isWorldSessionState(s)).toBe(false); });
it.each(['session', 'outside', 'tile', 'feature'])('rejects JSON __proto__ at %s', level => {
  const s = session(), target = level === 'session' ? s : level === 'outside' ? s.outside : level === 'tile' ? s.outside.tiles[0] : s.outside.tiles.find(t => t.feature)!.feature!;
  Object.defineProperty(target, '__proto__', { value: {}, enumerable: true });
  expect(isWorldSessionState(JSON.parse(JSON.stringify(s)))).toBe(false);
});
it('classifies provenance without mistaking malformed values for unsupported ids', () => {
  const outside = session().outside;
  expect(outsideProvenance(outside)).toBe('supported');
  expect(outsideProvenance({ ...outside, generator: 'outside-gen-99' })).toBe('unsupported');
  expect(outsideProvenance({ ...outside, scenarioId: 'unknown' })).toBe('unsupported');
  expect(outsideProvenance({ ...outside, generator: undefined })).toBe('malformed');
  expect(outsideProvenance({ ...outside, scenarioId: 1 })).toBe('malformed');
  expect(outsideProvenance({})).toBe('malformed');
});
it('never leaks hidden features or other actors knowledge through the player summary', () => {
  const a = session(), b = session(4294967295), expected = { total: 90, mine: 0, others: 10, neutral: 80, explored: 0 };
  expect(summarizeOutside(a.outside, 'player')).toEqual(expected); expect(summarizeOutside(b.outside, 'player')).toEqual(expected);
  a.outside.tiles.filter(t => t.feature?.kind === 'deposit').forEach(t => { t.feature = { kind: 'deposit', resource: 'wheat' }; });
  a.outside.tiles[10].knownBy = ['ai-1'];
  expect(isWorldSessionState(a)).toBe(true); expect(summarizeOutside(a.outside, 'player')).toEqual(expected);
});
