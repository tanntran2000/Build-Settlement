import buildingsJson from '../data/buildings.json' with { type: 'json' };
import { deepFreeze, validateBuildings } from '../data/validate.js';
export type SocietyTier = 'housing' | 'service' | 'specialist' | 'slum';
export type StaffClass = 'basic' | 'makers' | 'luminaries' | 'merchants';
export interface SocietyBuildingInfo { tier: SocietyTier; alsoTier?: SocietyTier; staff: StaffClass | null; reserved: boolean; housing?: { class: 'free' | 'makers' | 'luminaries' | 'merchants' | 'elite' | 'bound'; byLevel: readonly number[] } }
const plots: Record<string, {tier: SocietyTier; ring: 1 | 2 | 3}> = {};
for (const [prefix,tier,ends] of [['house','housing',[4,8,11]],['service','service',[2,4,6]],['spec','specialist',[3,7,10]],['slum','slum',[1,3,6]]] as const) {
 for(let i=1;i<=ends[2];i++) plots[prefix+'-'+i] = Object.freeze({tier,ring:i<=ends[0]?1:i<=ends[1]?2:3});
}
export const SOCIETY_PLOT_IDS: readonly string[] = Object.freeze(Object.keys(plots));
export function societyPlot(tileId: string): {tier: SocietyTier;ring:1|2|3} | null { return Object.hasOwn(plots,tileId)?plots[tileId]:null; }
export const SOCIETY_BUILDINGS: Readonly<Record<string,SocietyBuildingInfo>> = deepFreeze(validateBuildings(buildingsJson).society);
const outside: Record<string, StaffClass> = {'sheep-pasture':'basic','herb-garden':'basic',quarry:'basic',weaver:'makers',farm:'basic',logging:'basic',mine:'basic',processor:'makers',workshop:'makers'};
export function societyStaff(typeId:string): StaffClass | null { return Object.hasOwn(outside,typeId)?outside[typeId]:Object.hasOwn(SOCIETY_BUILDINGS,typeId)?SOCIETY_BUILDINGS[typeId].staff:null; }
