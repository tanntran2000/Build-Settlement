import { createCharacterLifeSession,createNpcWorldSession,createSocietyState,DEFAULT_PLAYER_DRAFT } from '@haven/core';
import { describe,expect,it } from 'vitest';
import { executeCharacterLifeCommand } from '../character-life-command.js';
import { executeTileTrialCommand } from '../tile-trial.js';
import { executeWorldNpcCityCommand,executeWorldNpcCommand } from '../world-npc.js';

it('advances society tile weeks and accepts only matching snapshot economies', () => {
 const state=createSocietyState();
 const end=executeTileTrialCommand(state,{type:'END_WEEK',expectedWeek:1,expectedRevision:0});
 expect(end.success).toBe(true); if(!end.success) throw Error('End failed');
 expect(executeTileTrialCommand(end.nextState,{type:'NEXT_WEEK',expectedRevision:1}).success).toBe(true);
 for(const [current,snapshot] of [[state,(({ society: _removed, ...old }) => old)(createSocietyState())],[(({ society: _removed, ...old }) => old)(createSocietyState()),state]])
 expect(executeTileTrialCommand(current,{type:'LOAD_TRIAL',snapshot,expectedRevision:0})).toMatchObject({success:false,error:{code:'INVALID_STATE'}});
 expect(executeTileTrialCommand(state,{type:'LOAD_TRIAL',snapshot:state,expectedRevision:0}).success).toBe(true);
});
const unwrap = <T>(r: { success: true; value: T } | { success: false }) => { if (!r.success) throw Error('Factory failed'); return r.value; };
const sessions = [
  { name: 'npc', create: () => unwrap(createNpcWorldSession(20261028)), execute: executeWorldNpcCityCommand, assign: executeWorldNpcCommand },
  { name: 'life', create: () => unwrap(createCharacterLifeSession(20261028, { ...structuredClone(DEFAULT_PLAYER_DRAFT), currentName: 'Synthetic Keeper' })), execute: executeCharacterLifeCommand, assign: executeCharacterLifeCommand },
];
describe.each(sessions)('$name society session', c => {
  it('advances End Week and Next Week without mutating the source', () => {
    const state=c.create(), before=structuredClone(state);
    const end=c.execute(state,{type:'END_WEEK',expectedWeek:1,expectedRevision:0});
    expect(end.success).toBe(true); if(!end.success) throw Error('End failed');
    expect(end.next.city.world.week).toBe(2);
    expect(c.execute(end.next,{type:'NEXT_WEEK',expectedRevision:1}).success).toBe(true);
    expect(state).toEqual(before);
  });
  // These dispatchers never accept LOAD_TRIAL for any ruleset (load goes through Continue/Import), so that error wins.
  it('keeps the existing LOAD_TRIAL rejection without mutation', () => {
    const state = c.create(), before = structuredClone(state);
    expect(c.execute(state, { type: 'LOAD_TRIAL', expectedRevision: 0, snapshot: createSocietyState() }))
      .toMatchObject({ success: false, error: { code: 'INVALID_COMMAND' } });
    expect(state).toEqual(before);
  });
});
