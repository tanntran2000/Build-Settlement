import assert from 'node:assert/strict';
import { connectSource } from './workspace-source.mjs';

const { from } = connectSource(process.cwd(), process.cwd());
const core = await from('packages/core/src/index.ts');
const { withNpcs, NPC_TEST_KEYS } = await from('packages/core/src/__tests__/helpers/npcs.ts');
const { executeCharacterLifeCommand } = await from('packages/simulation/src/character-life-command.ts');
const start = core.createCharacterLifeSession(20261028, { ...structuredClone(core.DEFAULT_PLAYER_DRAFT), currentName: 'Ana' });
assert.ok(start.success);
let state = withNpcs(start.value, NPC_TEST_KEYS), debit = 0, wages = 0;
const rows = [];
const expectedWage = state.npcs.reduce((sum, npc) => sum + npc.household.contract.wageMilli, 0);
for (let week = 1; week <= 5; week++) {
  const result = executeCharacterLifeCommand(state, { type: 'END_WEEK', expectedRevision: state.city.revision, expectedWeek: week });
  assert.ok(result.success, JSON.stringify(result.error));
  const { before, taxMilli, goods, after, household, goodsStock } = result.report;
  assert.equal(goodsStock.closingMilli, 10000 - week * 1450);
  assert.deepEqual(household.unpaid, []);
  assert.equal(household.wagesPaidMilli, expectedWage);
  const cost = before.gold + taxMilli + goods.revenueMilli - after.gold;
  debit += cost; wages += household.wagesPaidMilli;
  rows.push({ week, cost, wagesPaidMilli: household.wagesPaidMilli, goldClosingMilli: after.gold });
  const next = executeCharacterLifeCommand(result.next, { type: 'NEXT_WEEK', expectedRevision: result.next.city.revision });
  assert.ok(next.success, JSON.stringify(next.error));
  state = next.next;
}
assert.equal(wages, 20000);
assert.equal(debit, 50000);
assert.equal(debit - wages, 30000);
console.log(JSON.stringify({ expectedWage, debit, wages, previousDebitPin: debit - wages, rows }, null, 2));

