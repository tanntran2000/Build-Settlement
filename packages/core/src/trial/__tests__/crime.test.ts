import { expect, it } from 'vitest';
import { crimeChancePercent, crimeSeverity, crimeRandom, standingAuthorityTerm, createSocietyState, createWorldSession, isSocietyState } from '../../index.js';
it.each([[0,5],[50,30],[100,55]])('chance %s', (n,e)=>expect(crimeChancePercent(n)).toBe(e));
it.each([[33,'minor'],[34,'serious'],[66,'serious'],[67,'severe']] as const)('severity %s',(n,e)=>expect(crimeSeverity(n)).toBe(e));
it.each([[0,-10],[50,0],[54,0],[55,1],[100,10]])('standing term %s',(n,e)=>expect(standingAuthorityTerm(n)).toBe(e));
it('replays seeded streams',()=>{const draws=(seed:number)=>{const r=crimeRandom(seed,1);return Array.from({length:20},()=>r());};expect(draws(1)).toEqual(draws(1));expect(draws(1)).not.toEqual(draws(2));});
it('starts v6 with neutral standing and no fall cause',()=>{expect(createSocietyState().society).toMatchObject({rulesetId:'tile-society-07',standing:50,crisis:{fallCause:null}});});
it('uses the validated session seed',()=>{const s=createWorldSession(20261028);expect(s.success).toBe(true);if(s.success)expect(s.value.city.world.worldMetadata.worldSeed).toBe(20261028);});
it.each([101,1.5,-1,NaN,Infinity])('refuses standing %s',standing=>{const s=createSocietyState().society!;Object.assign(s,{standing});expect(isSocietyState(s)).toBe(false);});
it.each([['none','rebellion'],['fallen',null],['fallen','other']] as const)('refuses inconsistent fall %s %s',(stage,fallCause)=>{const s=createSocietyState().society!;Object.assign(s.crisis,{stage,fallCause});expect(isSocietyState(s)).toBe(false);});
it('refuses v4',()=>{const s=createSocietyState().society!;Object.assign(s,{rulesetId:'tile-society-04'});expect(isSocietyState(s)).toBe(false);});

it.each(['rebellion','assassination'] as const)('accepts fallen cause %s',fallCause=>{const s=createSocietyState().society!;Object.assign(s.crisis,{stage:'fallen',fallCause});expect(isSocietyState(s)).toBe(true);});
