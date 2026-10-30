
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
