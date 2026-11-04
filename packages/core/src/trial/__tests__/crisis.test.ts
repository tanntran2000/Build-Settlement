import { expect, it } from 'vitest';
import { cardId, isPendingCard, crisisOptions, createSocietyState, isSocietyState } from '../../index.js';

it('starts v4 calm with no card', () => {
 const s=createSocietyState().society!;
 expect(s.rulesetId).toBe('tile-society-04');
 expect(s.crisis).toEqual({stage:'none',weeksInStage:0,hungerStreak:0,calmStreak:0,promise:null,lastChoice:null});
 expect(s.pendingCard).toBeNull();
});
it.each([['demand',2000,40,-10],['protest',4000,55,-15],['rebellion',6000,70,-20]] as const)('derives %s options', (kind,cost,security,tension) => {
 const views=crisisOptions(kind,{population:100,goldMilli:cost,security,promisePending:false});
 expect(views.map(v=>v.option)).toEqual(['pay','promise','force','refuse']);
 expect(views[0]).toEqual({option:'pay',available:true,reason:null,goldMilli:cost,tensionDelta:tension});
 expect(views[2].available).toBe(true);expect(views[2].tensionDelta).toBe(tension);
 const unavailable=crisisOptions(kind,{population:100,goldMilli:cost-1,security:security-1,promisePending:true});
 expect(unavailable.map(v=>v.reason)).toEqual([`Needs ${cost/1000} Gold.`,'A promise is already pending.',`Needs Security ${security}.`,null]);
 expect(unavailable[3]).toMatchObject({available:true,tensionDelta:5});
});
it('validates card identity and exact fields',()=>{
 expect(cardId('crisis','demand',7)).toBe('crisis-demand-w7');
 const card={id:'crisis-demand-w7',source:'crisis',kind:'demand',week:7};
 expect(isPendingCard(card)).toBe(true);
 for(const edit of [{id:'wrong'},{week:0},{week:1.5},{extra:0}])expect(isPendingCard({...card,...edit})).toBe(false);
});
it.each(['mismatch','warning','fallen','promise','negative','fractional','option','old','extra'])('rejects edited %s state', kind=>{
 const s=createSocietyState().society!;
 s.crisis.stage='demand';s.pendingCard={id:'crisis-demand-w1',source:'crisis',kind:'demand',week:1};
 if(kind==='mismatch')s.crisis.stage='protest';
 if(kind==='warning'||kind==='fallen')s.crisis.stage=kind;
 if(kind==='promise')Object.assign(s.crisis,{promise:{stage:'demand',weeksLeft:3}});
 if(kind==='negative')s.crisis.hungerStreak=-1;
 if(kind==='fractional')s.crisis.calmStreak=0.5;
 if(kind==='option')Object.assign(s.crisis,{lastChoice:{stage:'demand',option:'other',goldMilli:0}});
 if(kind==='old')Object.assign(s,{rulesetId:'tile-society-03'});
 if(kind==='extra')Object.assign(s.crisis,{extra:0});
 expect(isSocietyState(s)).toBe(false);
});
