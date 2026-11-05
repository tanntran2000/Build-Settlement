import { expect, it } from 'vitest';
import { createSocietyState, type TileTrialReport } from '@haven/core';
import { lawReportLines, lawsRow, lawEffectLine, GROUP_LABELS } from '../society-view.js';
const report = (laws: TileTrialReport['laws']) => ({laws} as TileTrialReport);
it('shows the law slot count and group labels',()=>{
 const s=createSocietyState(); expect(lawsRow(s)).toBe('Laws 0/3');
 s.society!.laws.active=['curfew','poor-relief']; expect(lawsRow(s)).toBe('Laws 2/3');
 expect(GROUP_LABELS).toEqual({free:'Free residents',makers:'Makers',luminaries:'Luminaries',merchants:'Merchants'});
});
it('handles absent and empty reports',()=>{
 expect(lawReportLines(report(undefined))).toEqual([]);
 expect(lawReportLines(report({inForce:[],costs:[],unfunded:[],incomeMilli:0,promise:null}))).toEqual(['No laws in force.']);
});
it('prints force, costs, unfunded and income in order with exact milli',()=>{
 expect(lawReportLines(report({inForce:['curfew','poor-relief'],costs:[{lawId:'poor-relief',goldMilli:1500},{lawId:'watch-levy',goldMilli:1001}],unfunded:['poor-relief','watch-levy'],incomeMilli:1500,promise:null}))).toEqual(['Laws in force: Curfew, Poor Relief.','Poor Relief cost 1.5 Gold.','Watch Levy cost 1.001 Gold.','Poor Relief was unfunded: no effect this week.','Watch Levy was unfunded: no effect this week.','Licensed Vice earned 1.5 Gold.']);
});
for(const [group,label] of Object.entries({free:'Free residents',makers:'Makers',luminaries:'Luminaries',merchants:'Merchants'}) as [keyof typeof GROUP_LABELS,string][]) for(const outcome of ['kept','broken'] as const) it(`${group} promise ${outcome}`,()=>{
 expect(lawReportLines(report({inForce:[],costs:[],unfunded:[],incomeMilli:0,promise:{group,lawId:'curfew',outcome}}))).toEqual(['No laws in force.',outcome==='kept'?`You kept your promise to the ${label}: Authority +3.`:`You broke your promise to the ${label}: satisfaction −10, Tension +10.`]);
});
for(const [id,text] of Object.entries({curfew:'Security target +10; Free satisfaction −2','watch-levy':'Costs 1 Gold; Crime target −5','guild-charters':'Makers satisfaction +2; Merchants satisfaction −2','war-tithe':"Tax +10 %; every group's satisfaction −1",'poor-relief':'Costs 1.5 Gold; Desperation −3; Free satisfaction +2','free-assembly':'Tension −3; Authority target −5','public-punishments':'Crime target −10; Tension +2','licensed-vice':'Earns 1.5 Gold; Luminaries satisfaction −2'})) it(`${id} exact effect`,()=>expect(lawEffectLine(id as Parameters<typeof lawEffectLine>[0])).toBe(text));
