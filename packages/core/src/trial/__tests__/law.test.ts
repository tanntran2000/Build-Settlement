import { describe, expect, it } from 'vitest';
import { createSocietyState, isSocietyState } from '../society.js';
import { LAW_CATALOG, LAW_IDS, LAW_MESSAGES, LAW_TRIAL, isLawsState, lawVoteWeights, previewLawVote, lawTerms, townHallOperating } from '../law.js';

const staffed = () => {
  const state = createSocietyState();
  state.tiles.find(t => t.id === 'service-1')!.building = { typeId: 'town-hall', level: 1, workers: 1, enabled: true };
  return state;
};
it('initializes v6 laws and refuses v5', () => {
  const society = createSocietyState().society!;
  expect(society.rulesetId).toBe('tile-society-06');
  expect(society.laws).toEqual({ active: [], votedWeek: null, repealedUntil: {}, promise: null });
  expect(isSocietyState({ ...society, rulesetId: 'tile-society-05' })).toBe(false);
});
it('counts elite votes fivefold and ignores bound', () => {
  const society = createSocietyState().society!;
  expect(lawVoteWeights(society)).toEqual({ free: 55, makers: 20, luminaries: 12, merchants: 13 });
  society.classes.makers.elite++;
  expect(lawVoteWeights(society).makers).toBe(25);
  society.classes.bound.free = 100;
  expect(lawVoteWeights(society).free).toBe(55);
});

it('pins catalogue order, effects, stances and trial constants', () => {
  expect(LAW_IDS).toEqual(['curfew','watch-levy','guild-charters','war-tithe','poor-relief','free-assembly','public-punishments','licensed-vice']);
  expect(LAW_IDS.map(id => LAW_CATALOG[id].name)).toEqual(['Curfew','Watch Levy','Guild Charters','War Tithe','Poor Relief','Free Assembly','Public Punishments','Licensed Vice']);
  expect(LAW_IDS.map(id => LAW_CATALOG[id].effect)).toEqual([
    {securityTarget:10,satisfaction:{free:-2}}, {costMilli:1000,crimeTarget:-5},
    {satisfaction:{makers:2,merchants:-2}}, {taxBps:1000,satisfaction:{free:-1,makers:-1,luminaries:-1,merchants:-1}},
    {costMilli:1500,desperation:-3,satisfaction:{free:2}}, {tension:-3,authorityTarget:-5},
    {crimeTarget:-10,tension:2}, {incomeMilli:1500,satisfaction:{luminaries:-2}},
  ]);
  expect(LAW_IDS.map(id => Object.values(LAW_CATALOG[id].stances))).toEqual([
    ['against','neutral','neutral','for'], ['for','neutral','neutral','against'],
    ['neutral','for','neutral','against'], ['against','against','neutral','against'],
    ['for','for','neutral','against'], ['for','neutral','for','neutral'],
    ['against','neutral','against','for'], ['neutral','for','against','for'],
  ]);
  expect(LAW_TRIAL).toEqual({maxActive:3,eliteWeight:5,payMilliPerVote:200,force:{satisfaction:-10,tension:5,standing:-3,minSecurity:40},promise:{weeks:4,keptAuthority:3,brokenSatisfaction:-10,brokenTension:10},repeal:{authority:-5,cooldownWeeks:4},corruptionPerTag:10});
  expect(Object.isFrozen(LAW_TRIAL.force)).toBe(true);
});

it('requires an enabled staffed Town Hall without checking funding', () => {
  const s=staffed();s.world.settlements[s.world.activeSettlementId!].inventory.gold=0;
  expect(townHallOperating(s)).toBe(true);
  s.tiles.find(t=>t.id==='service-1')!.building!.workers=0;expect(townHallOperating(s)).toBe(false);
  s.tiles.find(t=>t.id==='service-1')!.building!.workers=1;
  s.tiles.find(t=>t.id==='service-1')!.building!.enabled=false;expect(townHallOperating(s)).toBe(false);
});

it('fails ties, all-neutral votes and zero-weight lobbying', () => {
  const s=staffed(),c=s.society!.classes;
  c.free=13;c.makers.common=0;c.luminaries.common=0;
  expect(previewLawVote(s,'watch-levy',{})).toMatchObject({forWeight:13,againstWeight:13,passes:false});
  c.free=0;c.merchants.common=0;c.makers.common=20;
  expect(previewLawVote(s,'curfew',{})).toMatchObject({forWeight:0,againstWeight:0,passes:false});
  expect(previewLawVote(s,'curfew',{free:'pay'}).refusal?.code).toBe('LOBBY_INVALID');
});

it.each([null, [], {bound:'pay'}, {free:'bribe'}, {free:'pay'}])('rejects hostile or ineligible lobbying: %j', lobby => {
  const s=staffed(),before=structuredClone(s);
  expect(previewLawVote(s,'poor-relief',lobby).refusal).toEqual({code:'LOBBY_INVALID',message:LAW_MESSAGES.LOBBY_INVALID});
  expect(s).toEqual(before);
});

it('checks option availability in group order with exact total Pay cost', () => {
  const s=staffed(),inventory=s.world.settlements[s.world.activeSettlementId!].inventory;
  inventory.gold=11000;
  expect(previewLawVote(s,'war-tithe',{free:'pay'})).toMatchObject({goldMilli:11000,refusal:null});
  inventory.gold=10999;
  expect(previewLawVote(s,'war-tithe',{free:'pay'}).refusal).toEqual({code:'OPTION_UNAVAILABLE',message:'Needs 11 Gold.'});
  inventory.gold=0;
  expect(previewLawVote(s,'war-tithe',{merchants:'force',free:'pay'}).refusal?.message).toBe('Needs 11 Gold.');
  expect(previewLawVote(s,'war-tithe',{makers:'promise',free:'promise'}).refusal?.message).toBe('Promise one group per vote.');
  s.society!.laws.promise={group:'free',lawId:'curfew',satisfactionAtVote:80,weeksLeft:4};
  expect(previewLawVote(s,'war-tithe',{free:'promise'}).refusal?.message).toBe('A law promise is already open.');
  s.society!.order.security=40;
  expect(previewLawVote(s,'war-tithe',{free:'force'}).refusal).toBeNull();
  s.society!.classes.free=1;inventory.gold=199;
  expect(previewLawVote(s,'war-tithe',{free:'pay'}).refusal?.message).toBe('Needs 0.2 Gold.');
});

it('returns the first refusal in the approved order without mutating state', () => {
  const s=staffed(),laws=s.society!.laws;
  const check=(id:unknown,code:string,message:string)=>{const before=structuredClone(s);expect(previewLawVote(s,id,{}).refusal).toEqual({code,message});expect(s).toEqual(before);};
  s.society!.pendingCard={id:'demand-w1',source:'crisis',kind:'demand',week:1};
  check('unknown','CARD_PENDING','Answer the crisis first.');s.society!.pendingCard=null;
  s.tiles.find(t=>t.id==='service-1')!.building!.enabled=false;
  check('unknown','UNKNOWN_LAW','Choose a law from the Council list.');
  laws.votedWeek=1;check('curfew','TOWN_HALL_CLOSED','Staff the Town Hall to call a vote.');
  s.tiles.find(t=>t.id==='service-1')!.building!.enabled=true;
  laws.active=['curfew','watch-levy','guild-charters'];check('curfew','VOTE_USED','The Council has already voted this week.');
  laws.votedWeek=null;check('curfew','LAW_ACTIVE','This law is already in force.');
  laws.repealedUntil['poor-relief']=2;check('poor-relief','LAW_SLOTS_FULL','Three laws are in force. Repeal one first.');
  laws.active=[];check('poor-relief','LAW_COOLDOWN','This law returns in week 2.');
  s.world.week=2;expect(previewLawVote(s,'poor-relief',{}).refusal).toBeNull();
  check('war-tithe','VOTE_SHORT','The vote would fail: For 0 · Against 88.');
});

it('returns zero terms for no laws and sums all applicable terms', () => {
  expect(lawTerms([])).toEqual({securityTarget:0,crimeTarget:0,authorityTarget:0,taxBps:0,desperation:0,tension:0,corruptionTarget:0,satisfaction:{free:0,makers:0,luminaries:0,merchants:0}});
  expect(lawTerms(['curfew','war-tithe','free-assembly'])).toEqual({securityTarget:10,crimeTarget:0,authorityTarget:-5,taxBps:1000,desperation:0,tension:-3,corruptionTarget:-10,satisfaction:{free:-3,makers:-1,luminaries:-1,merchants:-1}});
});
it('tallies the votes and lobby cost', () => {
  const state = staffed();
  expect(previewLawVote(state, 'poor-relief', {})).toMatchObject({ forWeight: 75, againstWeight: 13, passes: true, refusal: null });
  expect(previewLawVote(state, 'war-tithe', {})).toMatchObject({ forWeight: 0, againstWeight: 88, passes: false, refusal: { code: 'VOTE_SHORT' } });
  expect(previewLawVote(state, 'war-tithe', { free: 'pay', makers: 'pay', merchants: 'pay' }).passes).toBe(true);
  expect(previewLawVote(state, 'war-tithe', { free: 'pay' }).goldMilli).toBe(11000);
  state.society!.order.security = 39;
  expect(previewLawVote(state, 'war-tithe', { free: 'force' }).refusal).toEqual({ code: 'OPTION_UNAVAILABLE', message: 'Force needs Security 40.' });
});
it('sums law terms', () => {
  expect(lawTerms(['public-punishments', 'licensed-vice', 'poor-relief'])).toMatchObject({ corruptionTarget: 10, crimeTarget: -10, tension: 2 });
});
describe('rejects malformed laws', () => {
  const base = { active: [], votedWeek: null, repealedUntil: {}, promise: null };
  for (const invalid of [
    { active: ['curfew', 'curfew'] }, { active: ['curfew', 'watch-levy', 'guild-charters', 'war-tithe'] }, { active: ['unknown'] },
    { repealedUntil: { curfew: 0 } }, { repealedUntil: { curfew: 1.5 } },
    ...[0, 5].map(weeksLeft => ({ promise: { group: 'free', lawId: 'curfew', satisfactionAtVote: 80, weeksLeft } })),
    { promise: { group: 'bound', lawId: 'curfew', satisfactionAtVote: 80, weeksLeft: 4 } },
  ]) it(JSON.stringify(invalid), () => expect(isLawsState({ ...base, ...invalid })).toBe(false));
});
