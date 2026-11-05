import { expect, it } from 'vitest';
import { buildingWorkerCap, garrisonSecurity, crimeChancePercent } from '../../index.js';
it.each([[0,0],[3,0],[4,3],[7,3],[8,6],[15,9],[16,12],[40,12]])('garrison %i gives %i', (n, expected) => expect(garrisonSecurity(n)).toBe(expected));
it('caps Watch Houses at both levels', () => {
 expect(buildingWorkerCap('watch-house',1)).toBe(2);
 expect(buildingWorkerCap('watch-house',2)).toBe(2);
 expect(buildingWorkerCap('military-barracks',2)).toBe(8);
});
it('adds idle crime chance once', () => {
 expect(crimeChancePercent(0,true)).toBe(7);
 expect(crimeChancePercent(100,true)).toBe(57);
});
