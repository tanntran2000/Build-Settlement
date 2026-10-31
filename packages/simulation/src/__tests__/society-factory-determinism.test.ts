import { expect, it } from 'vitest';
import { createCharacterLifeSession, DEFAULT_PLAYER_DRAFT, SOCIETY_RULESET } from '@haven/core';
import { executeCharacterLifeCommand } from '../index.js';
it('creates society without an economy argument and remains deterministic through five weeks', () => {
 const create = () => {
  const r = createCharacterLifeSession(20261028, { ...structuredClone(DEFAULT_PLAYER_DRAFT), currentName: 'Synthetic Keeper' });
  expect(r.success).toBe(true);
  if (!r.success) throw Error('Factory failed');
  expect(r.value.city.society?.rulesetId).toBe(SOCIETY_RULESET);
  return r.value;
 };
 let a=create(), b=create();
 expect(a).toEqual(b);
 for(let week=0;week<5;week++) for(const type of ['END_WEEK','NEXT_WEEK']) {
  const step=(state: typeof a) => {
   const r=executeCharacterLifeCommand(state,{type,expectedRevision:state.city.revision,...(type==='END_WEEK'?{expectedWeek:state.city.world.week}:{})});
   expect(r.success).toBe(true);if(!r.success)throw Error(r.error.message);return r.next;
  };
  a=step(a);b=step(b);expect(a).toEqual(b);
 }
});
