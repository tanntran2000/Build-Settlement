import { hasWeeklyKeys } from '../domain/canonical-state.js';
import { readDenseArray } from '../world/arrays.js';
import type { SocietyClassKey, SocietyState } from './society.js';
import type { TileTrialState } from './types.js';

export const LAW_IDS = Object.freeze(['curfew','watch-levy','guild-charters','war-tithe','poor-relief','free-assembly','public-punishments','licensed-vice'] as const);
export type LawId = typeof LAW_IDS[number];
export type LawStance = 'for' | 'against' | 'neutral';
export type LobbyOption = 'pay' | 'promise' | 'force';
const groups = ['free','makers','luminaries','merchants'] as const;
export interface LawDefinition {
  name: string;
  tag: 'light' | 'dark' | null;
  stances: Record<SocietyClassKey, LawStance>;
  effect: {
    securityTarget?: number; crimeTarget?: number; authorityTarget?: number;
    satisfaction?: Partial<Record<SocietyClassKey, number>>;
    desperation?: number; tension?: number; taxBps?: number; costMilli?: number; incomeMilli?: number;
  };
}
const stances = (free: LawStance, makers: LawStance, luminaries: LawStance, merchants: LawStance): LawDefinition['stances'] => ({free,makers,luminaries,merchants});
export const LAW_CATALOG: Readonly<Record<LawId, LawDefinition>> = Object.freeze({
  curfew: {name:'Curfew',tag:null,stances:stances('against','neutral','neutral','for'),effect:{securityTarget:10,satisfaction:{free:-2}}},
  'watch-levy': {name:'Watch Levy',tag:null,stances:stances('for','neutral','neutral','against'),effect:{costMilli:1000,crimeTarget:-5}},
  'guild-charters': {name:'Guild Charters',tag:null,stances:stances('neutral','for','neutral','against'),effect:{satisfaction:{makers:2,merchants:-2}}},
  'war-tithe': {name:'War Tithe',tag:null,stances:stances('against','against','neutral','against'),effect:{taxBps:1000,satisfaction:{free:-1,makers:-1,luminaries:-1,merchants:-1}}},
  'poor-relief': {name:'Poor Relief',tag:'light',stances:stances('for','for','neutral','against'),effect:{costMilli:1500,desperation:-3,satisfaction:{free:2}}},
  'free-assembly': {name:'Free Assembly',tag:'light',stances:stances('for','neutral','for','neutral'),effect:{tension:-3,authorityTarget:-5}},
  'public-punishments': {name:'Public Punishments',tag:'dark',stances:stances('against','neutral','against','for'),effect:{crimeTarget:-10,tension:2}},
  'licensed-vice': {name:'Licensed Vice',tag:'dark',stances:stances('neutral','for','against','for'),effect:{incomeMilli:1500,satisfaction:{luminaries:-2}}},
});
for (const law of Object.values(LAW_CATALOG)) {
  Object.freeze(law.stances);
  if (law.effect.satisfaction) Object.freeze(law.effect.satisfaction);
  Object.freeze(law.effect); Object.freeze(law);
}
export const LAW_TRIAL = Object.freeze({
  maxActive:3, eliteWeight:5, payMilliPerVote:200,
  force:Object.freeze({satisfaction:-10,tension:5,standing:-3,minSecurity:40}),
  promise:Object.freeze({weeks:4,keptAuthority:3,brokenSatisfaction:-10,brokenTension:10}),
  repeal:Object.freeze({authority:-5,cooldownWeeks:4}), corruptionPerTag:10,
});
export const LAW_MESSAGES = Object.freeze({
  CARD_PENDING:'Answer the crisis first.', UNKNOWN_LAW:'Choose a law from the Council list.',
  TOWN_HALL_CLOSED:'Staff the Town Hall to call a vote.', VOTE_USED:'The Council has already voted this week.',
  LAW_ACTIVE:'This law is already in force.', LAW_SLOTS_FULL:'Three laws are in force. Repeal one first.',
  LAW_COOLDOWN:'This law returns in week {N}.', LOBBY_INVALID:'Only groups with a vote that are not For can be lobbied.',
  VOTE_SHORT:'The vote would fail: For {F} · Against {A}.', LAW_INACTIVE:'This law is not in force.',
});
export interface LawsState {
  active: LawId[];
  votedWeek: number | null;
  repealedUntil: Partial<Record<LawId, number>>;
  promise: {group: SocietyClassKey; lawId: LawId; satisfactionAtVote: number; weeksLeft: number} | null;
}
const isLawId = (v: unknown): v is LawId => typeof v === 'string' && (LAW_IDS as readonly string[]).includes(v);
const positive = (v: unknown): v is number => Number.isSafeInteger(v) && (v as number) > 0;
export function isLawsState(raw: unknown): raw is LawsState {
  try {
    if (!hasWeeklyKeys(raw,['active','votedWeek','repealedUntil','promise'])) return false;
    const active=readDenseArray(raw.active);
    if (!active || active.length > LAW_TRIAL.maxActive ||
      !active.every(isLawId) || new Set(active).size !== active.length ||
      !(raw.votedWeek === null || positive(raw.votedWeek)) ||
      !raw.repealedUntil || typeof raw.repealedUntil !== 'object' ||
      !hasWeeklyKeys(raw.repealedUntil,Object.keys(raw.repealedUntil)) ||
      !Object.entries(raw.repealedUntil).every(([id,week]) => isLawId(id) && positive(week))) return false;
    const p=raw.promise;
    return p === null || (hasWeeklyKeys(p,['group','lawId','satisfactionAtVote','weeksLeft']) &&
      groups.includes(p.group as SocietyClassKey) && isLawId(p.lawId) &&
      Number.isSafeInteger(p.satisfactionAtVote) && (p.satisfactionAtVote as number) >= 0 && (p.satisfactionAtVote as number) <= 100 &&
      positive(p.weeksLeft) && p.weeksLeft <= LAW_TRIAL.promise.weeks);
  } catch { return false; }
}
const safe = (n: number): number => {
  if (!Number.isSafeInteger(n) || n < 0) throw Error('Unsafe law vote total.');
  return n;
};
export function lawVoteWeights(society: SocietyState): Record<SocietyClassKey, number> {
  const weight = (group: 'makers' | 'luminaries' | 'merchants') => safe(society.classes[group].common + safe(LAW_TRIAL.eliteWeight * society.classes[group].elite));
  return {free:safe(society.classes.free),makers:weight('makers'),luminaries:weight('luminaries'),merchants:weight('merchants')};
}
export function townHallOperating(state: TileTrialState): boolean {
  return state.tiles.some(({building:b}) => b?.typeId === 'town-hall' && b.enabled && b.workers >= 1);
}
export interface LawVotePreview {
  groups: {group: SocietyClassKey; weight: number; stance: LawStance; vote: LawStance; lobby: LobbyOption | null}[];
  forWeight: number; againstWeight: number; passes: boolean; goldMilli: number;
  refusal: {code: string; message: string} | null;
}
const formatMilli = (milli: number): string => `${Math.floor(milli/1000)}${milli%1000 ? '.'+String(milli%1000).padStart(3,'0').replace(/0+$/, '') : ''}`;
export function previewLawVote(state: TileTrialState, lawId: unknown, lobby: unknown): LawVotePreview {
  const result: LawVotePreview = {groups:[],forWeight:0,againstWeight:0,passes:false,goldMilli:0,refusal:null};
  const refuse = (code: string, message: string): LawVotePreview => ({...result,refusal:{code,message}});
  const society=state.society!;
  // Earlier refusals do not inspect later, potentially hostile payloads.
  if (society.pendingCard) return refuse('CARD_PENDING',LAW_MESSAGES.CARD_PENDING);
  if (!isLawId(lawId)) return refuse('UNKNOWN_LAW',LAW_MESSAGES.UNKNOWN_LAW);
  const weights=lawVoteWeights(society), law=LAW_CATALOG[lawId];
  result.groups=groups.map(group=>({group,weight:weights[group],stance:law.stances[group],vote:law.stances[group],lobby:null}));
  const tally=()=>{
    result.forWeight=0;result.againstWeight=0;
    for (const g of result.groups) {
      if (g.vote==='for') result.forWeight=safe(result.forWeight+g.weight);
      if (g.vote==='against') result.againstWeight=safe(result.againstWeight+g.weight);
    }
    result.passes=result.forWeight>result.againstWeight;
  };
  tally();
  const laws=society.laws, week=state.world.week;
  if (!townHallOperating(state)) return refuse('TOWN_HALL_CLOSED',LAW_MESSAGES.TOWN_HALL_CLOSED);
  if (laws.votedWeek===week) return refuse('VOTE_USED',LAW_MESSAGES.VOTE_USED);
  if (laws.active.includes(lawId)) return refuse('LAW_ACTIVE',LAW_MESSAGES.LAW_ACTIVE);
  if (laws.active.length>=LAW_TRIAL.maxActive) return refuse('LAW_SLOTS_FULL',LAW_MESSAGES.LAW_SLOTS_FULL);
  if ((laws.repealedUntil[lawId]??0)>week) return refuse('LAW_COOLDOWN',LAW_MESSAGES.LAW_COOLDOWN.replace('{N}',String(laws.repealedUntil[lawId])));
  if (!lobby || typeof lobby!=='object' || !hasWeeklyKeys(lobby,Object.keys(lobby))) return refuse('LOBBY_INVALID',LAW_MESSAGES.LOBBY_INVALID);
  for (const [group,option] of Object.entries(lobby)) {
    if (!groups.includes(group as SocietyClassKey) || !['pay','promise','force'].includes(option as string) || weights[group as SocietyClassKey]===0 || law.stances[group as SocietyClassKey]==='for') return refuse('LOBBY_INVALID',LAW_MESSAGES.LOBBY_INVALID);
  }
  let promises=0;
  for (const g of result.groups) {
    if (!Object.hasOwn(lobby,g.group)) continue;
    g.lobby=lobby[g.group] as LobbyOption;g.vote='for';
    if (g.lobby==='pay') result.goldMilli=safe(result.goldMilli+safe(g.weight*LAW_TRIAL.payMilliPerVote));
    if (g.lobby==='promise') promises++;
  }
  tally();
  const gold=state.world.settlements[state.world.activeSettlementId!].inventory.gold;
  for (const g of result.groups) {
    const reason=g.lobby==='pay' && gold<result.goldMilli ? `Needs ${formatMilli(result.goldMilli)} Gold.` :
      g.lobby==='promise' && laws.promise!==null ? 'A law promise is already open.' :
      g.lobby==='promise' && promises>1 ? 'Promise one group per vote.' :
      g.lobby==='force' && society.order.security<LAW_TRIAL.force.minSecurity ? `Force needs Security ${LAW_TRIAL.force.minSecurity}.` : null;
    if (reason) return refuse('OPTION_UNAVAILABLE',reason);
  }
  if (!result.passes) return refuse('VOTE_SHORT',LAW_MESSAGES.VOTE_SHORT.replace('{F}',String(result.forWeight)).replace('{A}',String(result.againstWeight)));
  return result;
}
export interface LawTerms {
  securityTarget: number; crimeTarget: number; authorityTarget: number; taxBps: number;
  desperation: number; tension: number; corruptionTarget: number;
  satisfaction: Record<SocietyClassKey, number>;
}
export function lawTerms(applied: readonly LawId[]): LawTerms {
  const terms: LawTerms={securityTarget:0,crimeTarget:0,authorityTarget:0,taxBps:0,desperation:0,tension:0,corruptionTarget:0,satisfaction:{free:0,makers:0,luminaries:0,merchants:0}};
  for (const id of applied) {
    const law=LAW_CATALOG[id];
    for (const key of ['securityTarget','crimeTarget','authorityTarget','taxBps','desperation','tension'] as const) terms[key]+=law.effect[key]??0;
    for (const group of groups) terms.satisfaction[group]+=law.effect.satisfaction?.[group]??0;
    terms.corruptionTarget+=law.tag==='dark' ? LAW_TRIAL.corruptionPerTag : law.tag==='light' ? -LAW_TRIAL.corruptionPerTag : 0;
  }
  return terms;
}
