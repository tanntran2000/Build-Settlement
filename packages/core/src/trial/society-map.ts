import buildingsJson from '../data/buildings.json' with { type: 'json' };
import tuningJson from '../data/tuning.json' with { type: 'json' };
import { deepFreeze, validateBuildings, validateTuning } from '../data/validate.js';
import type { SocietyWallRing } from './types.js';
export type SocietyTier = 'housing' | 'service' | 'specialist' | 'slum' | 'estate';
export type StaffClass = 'basic' | 'makers' | 'luminaries' | 'merchants';
export interface SocietyBuildingInfo { tier: SocietyTier; alsoTier?: SocietyTier; staff: StaffClass | null; reserved: boolean; npcBeds?: readonly number[]; housing?: { class: 'free' | 'makers' | 'luminaries' | 'merchants' | 'elite' | 'bound'; byLevel: readonly number[] } }
type SocietyPlot = { tier: SocietyTier; ring: SocietyWallRing };
const plots: Record<string, SocietyPlot> = {};
for (const [prefix,tier,ends] of [['house','housing',[4,8,11]],['service','service',[2,4,6]],['spec','specialist',[3,7,10]],['slum','slum',[1,3,6]]] as const) {
 for(let i=1;i<=ends[2];i++) plots[prefix+'-'+i] = Object.freeze({tier,ring:i<=ends[0]?1:i<=ends[1]?2:3});
}
export const SOCIETY_RING4_PLOTS = deepFreeze(validateTuning(tuningJson).SOCIETY_RING4_PLOTS);
for (const tier of ['housing','service','specialist','slum'] as const) {
 for (const id of SOCIETY_RING4_PLOTS[tier]) plots[id] = Object.freeze({tier,ring:4});
}
export const ESTATE_BUILDINGS = Object.freeze({'estate-1':'mansion','estate-2':'retainers-hall'} as const);
for (const id of Object.keys(ESTATE_BUILDINGS)) plots[id] = Object.freeze({tier:'estate',ring:1});
export const SOCIETY_PLOT_IDS: readonly string[] = Object.freeze(Object.keys(plots));
export function societyPlot(tileId: string): SocietyPlot | null { return Object.hasOwn(plots,tileId)?plots[tileId]:null; }
export const SOCIETY_BUILDINGS: Readonly<Record<string,SocietyBuildingInfo>> = deepFreeze(validateBuildings(buildingsJson).society);
const outside: Record<string, StaffClass> = {'sheep-pasture':'basic','herb-garden':'basic',quarry:'basic',weaver:'makers',farm:'basic',logging:'basic',mine:'basic',processor:'makers',workshop:'makers'};
export function societyStaff(typeId:string): StaffClass | null { return Object.hasOwn(outside,typeId)?outside[typeId]:Object.hasOwn(SOCIETY_BUILDINGS,typeId)?SOCIETY_BUILDINGS[typeId].staff:null; }
