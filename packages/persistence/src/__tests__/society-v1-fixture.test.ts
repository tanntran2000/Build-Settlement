import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { createCharacterLifeSession, DEFAULT_PLAYER_DRAFT, societyPopulation } from '@haven/core';
import { executeCharacterLifeCommand } from '@haven/simulation';
import { serializeCharacterLifeSave, deserializeCharacterLifeSave } from '../index.js';
it('pins five society weeks and conserves cohort counts', () => {
 const created=createCharacterLifeSession(20261028,{...structuredClone(DEFAULT_PLAYER_DRAFT),currentName:'Synthetic Keeper'});
 if(!created.success) throw Error('Factory failed');
 let state=created.value;
 for(let i=0;i<5;i++) for(const type of ['END_WEEK','NEXT_WEEK']) {
  const result=executeCharacterLifeCommand(state,{type,expectedRevision:state.city.revision,...(type==='END_WEEK'?{expectedWeek:state.city.world.week}:{})});
  expect(result.success).toBe(true); if(!result.success) throw Error(JSON.stringify(result));
  state=result.next;
  expect(state.city.world.settlements[state.city.world.activeSettlementId!].cohorts.reduce((n,c)=>n+c.count,0)).toBe(societyPopulation(state.city.society!));
 }
 const encoded=serializeCharacterLifeSave(state); if(!encoded.success) throw Error('Export failed');
 const bytes=readFileSync(new URL('./fixtures/society-v1/life-5-weeks.json',import.meta.url),'utf8');
 expect(encoded.text).toBe(bytes);
 const decoded=deserializeCharacterLifeSave(bytes); expect(decoded.success).toBe(true);
 if(decoded.success) expect(serializeCharacterLifeSave(decoded.state)).toEqual(encoded);
});
