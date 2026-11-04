import { readFileSync } from 'node:fs';
import { isTileTrialPlanningState, SOCIETY_RULESET } from '@haven/core';
import { expect, it } from 'vitest';
import { deserializeCharacterLifeSave } from '../index.js';

const older = 'This checkpoint is from an older version of Haven and can no longer be played. Start a New Game.';
it.each(['life-new-game.json','life-5-weeks.json','life-demand-card.json','life-rebellion-last-week.json'])('refuses old society v4 %s without throwing or changing its data', file => {
 const bytes = readFileSync(new URL('./fixtures/society-v4/'+file, import.meta.url),'utf8');
 const envelope = JSON.parse(bytes), before = structuredClone(envelope);
 let result: ReturnType<typeof deserializeCharacterLifeSave> | undefined;
 expect(() => { result = deserializeCharacterLifeSave(bytes); }).not.toThrow();
 expect(result).toEqual({success:false,error:{code:'INCOMPATIBLE_SAVE',message:older}});
 expect(envelope).toEqual(before);
});
it('refuses the old society v4 tile envelope and planning state without throwing', () => {
 const bytes = readFileSync(new URL('./fixtures/society-v4/new-game.json', import.meta.url),'utf8');
 const envelope = JSON.parse(bytes), before = structuredClone(envelope);
 expect(envelope.rulesetId).toBe('tile-society-04');
 expect(envelope.rulesetId).not.toBe(SOCIETY_RULESET);
 expect(() => isTileTrialPlanningState(envelope.state)).not.toThrow();
 expect(isTileTrialPlanningState(envelope.state)).toBe(false);
 // The old tile format no longer has a codec; the active format rejects it too.
 expect(deserializeCharacterLifeSave(bytes)).toMatchObject({success:false,error:{code:'INCOMPATIBLE_SAVE'}});
 expect(envelope).toEqual(before);
});
