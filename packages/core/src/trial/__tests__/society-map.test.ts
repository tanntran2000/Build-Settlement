
import { createSocietyState, isTileTrialPlanningState } from '../../index.js';
import { SOCIETY_PLOT_IDS, societyPlot } from '../society-map.js';
it('pins the society map and ring boundaries', () => {
 expect(SOCIETY_PLOT_IDS).toHaveLength(33);
 expect(societyPlot('house-4')).toEqual({tier:'housing',ring:1});
 expect(societyPlot('house-5')).toEqual({tier:'housing',ring:2});
 expect(societyPlot('slum-1')).toEqual({tier:'slum',ring:1});
 expect(societyPlot('slum-4')).toEqual({tier:'slum',ring:3});
 expect(societyPlot('field-1')).toBeNull();
 const city = createSocietyState();
 expect(city.tiles).toHaveLength(43);
 expect(isTileTrialPlanningState(city)).toBe(true);
});
import { expect, it } from 'vitest';
import { createGoodsStockState, managerSlotTileIds } from '../../index.js';

it('preserves Market manager posts in both economies and adds Town Hall', () => {
 const city = createSocietyState();
 expect(managerSlotTileIds(city)).toEqual(['field-1','plain-1','spec-1']);
 city.tiles.push({id:'service-1',terrain:'town',building:{typeId:'town-hall',level:1,workers:0,enabled:true}});
 expect(managerSlotTileIds(city)).toContain('service-1');
 expect(managerSlotTileIds(createGoodsStockState())).toEqual(['field-1','plain-1','plain-2']);
});

import { TRIAL_BUILDINGS } from '../../index.js';
it('pins all fourteen active town building names to the approved catalog', () => {
  const names = {
    'common-housing': 'Common Housing',
    'makers-rowhouses': "Makers' Rowhouses",
    'scholars-quarters': "Scholars' Quarters",
    'merchant-townhouses': 'Merchant Townhouses',
    'elite-manor': 'Elite Manor',
    tavern: 'Tavern',
    hospital: 'Hospital',
    'town-hall': 'Town Hall',
    'builders-yard': "Builders' Yard",
    academy: 'Academy',
    'town-market': 'Market',
    'trading-post': 'Trading Post',
    'counting-house': 'Counting House',
    'slave-quarters': 'Slave Quarters',
  };
  expect(Object.fromEntries(Object.entries(TRIAL_BUILDINGS)
    .filter(([, definition]) => definition.terrain.includes('town'))
    .map(([id, definition]) => [id, definition.name]))).toEqual(names);
});

import { SOCIETY_BUILDINGS } from '../society-map.js';
it('pins reserved staff metadata without enabling reserved buildings', () => {
  expect(Object.fromEntries(Object.entries(SOCIETY_BUILDINGS)
    .filter(([, info]) => info.reserved)
    .map(([id, info]) => [id, { staff: info.staff, reserved: info.reserved }]))).toEqual({
    'watch-house': { staff: 'basic', reserved: true },
    warehouse: { staff: 'makers', reserved: true },
    smithy: { staff: 'makers', reserved: true },
    library: { staff: 'luminaries', reserved: true },
    brothel: { staff: null, reserved: true },
    'black-market': { staff: null, reserved: true },
    arena: { staff: null, reserved: true },
    'drug-store': { staff: null, reserved: true },
  });
});
