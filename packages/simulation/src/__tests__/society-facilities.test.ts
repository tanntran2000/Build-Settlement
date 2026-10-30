import { expect, it } from 'vitest';
import { createSocietyState } from '@haven/core';
import { societyFacilities, societyEmployment } from '../society-facilities.js';
it('summarises funded housing and class employment', () => {
 const city = createSocietyState();
 expect(societyFacilities(city, new Set(city.tiles.map(t => t.id))).housing).toEqual({free:70,makers:25,luminaries:18,merchants:15,elite:0,bound:0});
 expect(societyFacilities(city, new Set(city.tiles.filter(t=>t.id!=='house-1').map(t=>t.id))).housing.free).toBe(0);
 expect(societyEmployment(city).assigned).toEqual({free:2,makers:2,luminaries:0,merchants:0,bound:0});
});
it('requires full staffing for tavern effects', () => {
 const city=createSocietyState(), tile=city.tiles.find(t=>t.id==='service-1')!;
 tile.building={typeId:'tavern',level:2,workers:4,enabled:true};
 expect(societyFacilities(city,new Set([tile.id])).tavernLevels).toEqual([2]);
 tile.building.workers=1;
 expect(societyFacilities(city,new Set([tile.id])).tavernLevels).toEqual([]);
});
it('assigns basic workers to Free first, spilling remaining slots into Bound', () => {
 const city=createSocietyState();
 city.society!.classes.free=10;
 city.society!.classes.bound.free=20;
 const result=societyEmployment(city);
 expect(result.workforce.free).toBe(1);
 expect(result.workforce.bound).toBe(2);
 expect(result.assigned.free).toBe(1);
 expect(result.assigned.bound).toBe(1);
 expect(result.assigned.makers).toBe(2);
});
