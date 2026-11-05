import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { createCharacterLifeSession, DEFAULT_PLAYER_DRAFT } from '@haven/core';
import { deserializeCharacterLifeSave, serializeCharacterLifeSave } from '../index.js';

function session() {
  const r=createCharacterLifeSession(20261028,{...DEFAULT_PLAYER_DRAFT,currentName:'Synthetic Keeper'});
  if (!r.success) throw Error(r.error.message);
  return r.value;
}
it('round-trips laws in enactment order, cooldown and a promise for a repealed law', () => {
  const s=session();
  s.city.society!.laws={active:['poor-relief','curfew','licensed-vice'],votedWeek:1,repealedUntil:{'free-assembly':5},promise:{group:'makers',lawId:'free-assembly',satisfactionAtVote:80,weeksLeft:4}};
  const before=structuredClone(s),encoded=serializeCharacterLifeSave(s);
  expect(encoded.success).toBe(true);if (!encoded.success) throw Error(encoded.error.message);
  const decoded=deserializeCharacterLifeSave(encoded.text);
  expect(decoded).toEqual({success:true,state:before});
  if (!decoded.success) throw Error(decoded.error.message);
  expect(serializeCharacterLifeSave(decoded.state)).toEqual(encoded);
  expect(s).toEqual(before);
});
const promise={group:'free',lawId:'curfew',satisfactionAtVote:80,weeksLeft:4};
it.each([
  {active:['curfew','curfew']}, {active:['curfew','watch-levy','guild-charters','war-tithe']}, {active:['unknown']},
  ...[0,-1,1.5,Number.MAX_SAFE_INTEGER+1].map(votedWeek=>({votedWeek})),
  ...[0,-1,1.5,Number.MAX_SAFE_INTEGER+1].map(week=>({repealedUntil:{curfew:week}})),
  {repealedUntil:{unknown:1}},
  ...[0,5,1.5].map(weeksLeft=>({promise:{...promise,weeksLeft}})),
  ...['bound','unknown'].map(group=>({promise:{...promise,group}})),
  ...[-1,101,1.5].map(satisfactionAtVote=>({promise:{...promise,satisfactionAtVote}})),
  {promise:{...promise,lawId:'unknown'}}, {promise:{...promise,extra:0}}, {extra:0},
])('refuses edited laws %j without changing the saved checkpoint', edit => {
  const good=serializeCharacterLifeSave(session());if (!good.success) throw Error(good.error.message);
  const envelope=JSON.parse(good.text);
  Object.assign(envelope.state.city.society.laws,edit);
  const before=structuredClone(envelope),bytes=JSON.stringify(envelope);
  expect(deserializeCharacterLifeSave(bytes)).toMatchObject({success:false,error:{code:'INVALID_SAVE_STATE'}});
  expect(serializeCharacterLifeSave(envelope.state)).toMatchObject({success:false,error:{code:'INVALID_SAVE_STATE'}});
  expect(envelope).toEqual(before);
  expect(deserializeCharacterLifeSave(good.text).success).toBe(true);
});

it.each(['new-game','life-new-game','life-5-weeks','life-demand-card','life-rebellion-last-week','life-crime-robbery','life-crime-raid','life-crime-wound','life-crime-death'])('preserves every v5 gameplay value in regenerated %s', name => {
  const read=(version:string)=>JSON.parse(readFileSync(new URL(`./fixtures/society-${version}/${name}.json`,import.meta.url),'utf8'));
  const old=read('v5'),current=read('v6'),city=name==='new-game'?current.state:current.state.city;
  expect(city.society.laws).toEqual({active:[],votedWeek:null,repealedUntil:{},promise:null});
  delete city.society.laws;
  city.society.rulesetId='tile-society-05';
  current[name==='new-game'?'rulesetId':'cityRulesetId']='tile-society-05';
  expect(current).toEqual(old);
});
