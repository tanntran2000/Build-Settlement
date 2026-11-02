import { isTileTrialPlanningState, SOCIETY_RULESET } from '@haven/core';
import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { deserializeCharacterLifeSave } from '../index.js';

it.each(['life-new-game.json','life-5-weeks.json'])('refuses old society v1 %s without throwing', file => {
 const bytes=readFileSync(new URL('./fixtures/society-v1/'+file,import.meta.url),'utf8');
 let result: ReturnType<typeof deserializeCharacterLifeSave> | undefined;
 expect(()=>{result=deserializeCharacterLifeSave(bytes);}).not.toThrow();
 expect(result).toEqual({success:false,error:{code:'INCOMPATIBLE_SAVE',message:'This checkpoint is from an older version of Haven and can no longer be played. Start a New Game.'}});
});

it('refuses the old society v1 tile envelope and planning state without throwing',()=>{
 const bytes=readFileSync(new URL('./fixtures/society-v1/new-game.json',import.meta.url),'utf8');
 const envelope=JSON.parse(bytes);
 expect(envelope.rulesetId).toBe('tile-society-01');
 expect(envelope.rulesetId).not.toBe(SOCIETY_RULESET);
 expect(()=>isTileTrialPlanningState(envelope.state)).not.toThrow();
 expect(isTileTrialPlanningState(envelope.state)).toBe(false);
 // The removed tile format has no codec; the active codec also refuses it.
 expect(deserializeCharacterLifeSave(bytes)).toMatchObject({success:false,error:{code:'INCOMPATIBLE_SAVE'}});
});
