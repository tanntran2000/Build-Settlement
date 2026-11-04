import { hasWeeklyKeys } from '../domain/canonical-state.js';
import { CARD_OPTIONS, isPendingCard, type CardOption } from './event-card.js';

export type CrisisCardKind = 'demand' | 'protest' | 'rebellion';
export type CrisisStage = 'none' | 'warning' | CrisisCardKind | 'fallen';
export interface CrisisState {
 fallCause: 'rebellion' | 'assassination' | null;
 stage: CrisisStage; weeksInStage: number; hungerStreak: number; calmStreak: number;
 promise: { stage: CrisisCardKind; weeksLeft: 1 | 2 } | null;
 lastChoice: { stage: CrisisCardKind; option: CardOption; goldMilli: number } | null;
}
export const CRISIS_TRIAL = Object.freeze({
 warningTension:50,demandHungerWeeks:3,happinessBelow:30,
 protest:Object.freeze({minWeeks:2,tension:75}),rebellion:Object.freeze({minWeeks:2,tension:90}),finalWeeks:4,calmWeeksToStepDown:2,
 pay:Object.freeze({demand:Object.freeze({milliPerResident:20,tension:-10}),protest:Object.freeze({milliPerResident:40,tension:-15}),rebellion:Object.freeze({milliPerResident:60,tension:-20})}),
 promise:Object.freeze({weeks:2,kept:Object.freeze({demand:-15,protest:-20,rebellion:-25}),keptAuthority:5,brokenTension:10,brokenAuthority:-10}),
 force:Object.freeze({security:Object.freeze({demand:40,protest:55,rebellion:70}),tension:Object.freeze({demand:-10,protest:-15,rebellion:-20}),authority:5,crime:5,satisfaction:-5}),
 refuse:Object.freeze({tension:5}),
});
export interface CrisisOptionView { option: CardOption; available: boolean; reason: string | null; goldMilli: number; tensionDelta: number }
export function crisisOptions(kind: CrisisCardKind, f: {population:number;goldMilli:number;security:number;promisePending:boolean}): CrisisOptionView[] {
 const cost=f.population*CRISIS_TRIAL.pay[kind].milliPerResident;
 if(!Number.isSafeInteger(cost)||cost<0)throw Error('Unsafe crisis cost.');
 const gold=`${Math.floor(cost/1000)}${cost%1000?'.'+String(cost%1000).padStart(3,'0').replace(/0+$/, ''):''}`;
 return CARD_OPTIONS.map(option=>{
  const reason=option==='pay' && f.goldMilli<cost?`Needs ${gold} Gold.`:option==='promise' && f.promisePending?'A promise is already pending.':option==='force' && f.security<CRISIS_TRIAL.force.security[kind]?`Needs Security ${CRISIS_TRIAL.force.security[kind]}.`:null;
  return {option,available:reason===null,reason,goldMilli:option==='pay'?cost:0,tensionDelta:option==='pay'?CRISIS_TRIAL.pay[kind].tension:option==='force'?CRISIS_TRIAL.force.tension[kind]:option==='refuse'?CRISIS_TRIAL.refuse.tension:0};
 });
}
const count=(n:unknown):boolean=>Number.isSafeInteger(n)&&(n as number)>=0;
const kind=(v:unknown):boolean=>['demand','protest','rebellion'].includes(v as string);
export function isCrisisState(raw: unknown, pendingCard: unknown): boolean {
 if(!hasWeeklyKeys(raw,['fallCause','stage','weeksInStage','hungerStreak','calmStreak','promise','lastChoice']) ||
  !['none','warning','demand','protest','rebellion','fallen'].includes(raw.stage as string) ||
  ![raw.weeksInStage,raw.hungerStreak,raw.calmStreak].every(count))return false;
 if(raw.stage==='fallen' ? !['rebellion','assassination'].includes(raw.fallCause as string) : raw.fallCause!==null)return false;
 if(raw.promise!==null && (!hasWeeklyKeys(raw.promise,['stage','weeksLeft'])||!kind(raw.promise.stage)||![1,2].includes(raw.promise.weeksLeft as number)))return false;
 if(raw.lastChoice!==null && (!hasWeeklyKeys(raw.lastChoice,['stage','option','goldMilli'])||!kind(raw.lastChoice.stage)||!CARD_OPTIONS.includes(raw.lastChoice.option as CardOption)||!count(raw.lastChoice.goldMilli)||(raw.lastChoice.option!=='pay'&&raw.lastChoice.goldMilli!==0)))return false;
 return pendingCard===null || (isPendingCard(pendingCard)&&pendingCard.kind===raw.stage);
}
