import { readFileSync } from 'node:fs';
import { isTileTrialPlanningState, SOCIETY_RULESET } from '@haven/core';
import { expect, it } from 'vitest';
import { deserializeCharacterLifeSave, serializeCharacterLifeSave } from '../index.js';
import { recordsToSession, sessionToRecords } from '../session-records.js';

it('uses ruleset 12 for current factories', () => expect(SOCIETY_RULESET).toBe('tile-society-12'));

const older='This checkpoint is from an older version of Haven and can no longer be played. Start a New Game.';
const files=['life-laws.json','life-new-game.json','life-5-weeks.json','life-demand-card.json','life-rebellion-last-week.json','life-crime-robbery.json','life-crime-raid.json','life-crime-wound.json','life-crime-death.json'];
// Catches accidental v9 migration, save mutation, or loss of historical item data.
it.each(files)('refuses historical v9 %s unchanged, including through store records', file=>{
  const url=new URL('./fixtures/society-v9/'+file,import.meta.url),bytes=readFileSync(url,'utf8');
  const envelope=JSON.parse(bytes),before=structuredClone(envelope);
  expect(()=>deserializeCharacterLifeSave(bytes)).not.toThrow();
  expect(deserializeCharacterLifeSave(bytes)).toEqual({success:false,error:{code:'INCOMPATIBLE_SAVE',message:older}});
  const rebuilt=recordsToSession(sessionToRecords('historical',envelope.state));
  expect(rebuilt).toEqual(envelope.state);
  expect(serializeCharacterLifeSave(rebuilt)).toEqual({success:false,error:{code:'INCOMPATIBLE_SAVE',message:older}});
  expect(envelope).toEqual(before);expect(readFileSync(url,'utf8')).toBe(bytes);
});
it('refuses the historical v9 tile state without throwing or changing its bytes',()=>{
  const url=new URL('./fixtures/society-v9/new-game.json',import.meta.url),bytes=readFileSync(url,'utf8');
  const envelope=JSON.parse(bytes),before=structuredClone(envelope);
  expect(envelope.rulesetId).toBe('tile-society-09');expect(envelope.rulesetId).not.toBe(SOCIETY_RULESET);
  expect(()=>isTileTrialPlanningState(envelope.state)).not.toThrow();expect(isTileTrialPlanningState(envelope.state)).toBe(false);
  expect(deserializeCharacterLifeSave(bytes)).toMatchObject({success:false,error:{code:'INCOMPATIBLE_SAVE'}});
  expect(envelope).toEqual(before);expect(readFileSync(url,'utf8')).toBe(bytes);
});
