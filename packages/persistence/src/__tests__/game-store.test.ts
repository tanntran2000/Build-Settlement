import { createMemoryGameStore } from '../memory-store.js';
import { runGameStoreSuite } from './game-store-suite.js';
runGameStoreSuite('memory', createMemoryGameStore);

import { expect,it } from 'vitest';
import type { StoredRecord } from '../game-store.js';
const marker:StoredRecord={slotId:'_',id:'migration:legacy-local-checkpoint',table:'system',schemaVersion:1,value:true};
const records=(label:string,slotId='main'):StoredRecord[]=>[{slotId,id:'session',table:'meta',schemaVersion:1,value:{label}},{slotId,id:'npc',table:'characters',schemaVersion:1,value:{label}}];
it.each([true,false])('fix3 memory: existing marker writes nothing with meta=%s',async hasMeta=>{
 const opts={failWrites:false},s=createMemoryGameStore(opts),b=records('B');await s.replaceSlot('main',hasMeta?b:[],[marker]);opts.failWrites=true;
 expect(typeof s.migrateSlot).toBe('function');expect(await s.migrateSlot('main',records('A'),marker)).toEqual(hasMeta?b:null);
 expect(await s.read('main')).toEqual(hasMeta?b:null);expect(await s.getSystem(marker.id)).toEqual(marker);
});
it('fix3 memory: existing slot wins and only receives the marker',async()=>{
 const s=createMemoryGameStore(),b=records('B');await s.replaceSlot('main',b);expect(typeof s.migrateSlot).toBe('function');
 expect(await s.migrateSlot('main',records('A'),marker)).toEqual(b);expect(await s.read('main')).toEqual(b);expect(await s.getSystem(marker.id)).toEqual(marker);
});
it('fix3 memory: empty slot stores candidate and marker with detached return',async()=>{
 const s=createMemoryGameStore(),a=records('A');expect(typeof s.migrateSlot).toBe('function');const result=await s.migrateSlot('main',a,marker);
 expect(result).toEqual(a);expect(await s.read('main')).toEqual(a);expect(await s.getSystem(marker.id)).toEqual(marker);
 result![0].value={changed:true};expect(await s.read('main')).toEqual(a);
});
it('fix3 memory: null candidate writes only marker and preserves other slots',async()=>{
 const s=createMemoryGameStore(),other=records('other','other');await s.replaceSlot('other',other);expect(typeof s.migrateSlot).toBe('function');
 expect(await s.migrateSlot('main',null,marker)).toBeNull();expect(await s.read('main')).toBeNull();expect(await s.read('other')).toEqual(other);expect(await s.getSystem(marker.id)).toEqual(marker);
});
it('fix3 memory: migration takes one synchronous state step',async()=>{
 const s=createMemoryGameStore(),a=records('A'),c=records('C');expect(typeof s.migrateSlot).toBe('function');const migration=s.migrateSlot('main',a,marker),save=s.replaceSlot('main',c);
 expect(await migration).toEqual(a);await save;expect(await s.read('main')).toEqual(c);expect(await s.getSystem(marker.id)).toEqual(marker);
});
it.each(['candidate slot','candidate system','marker table'] as const)('fix3 memory: invalid %s cannot mutate records',async kind=>{
 const s=createMemoryGameStore(),b=records('B'),candidate=records('A'),badMarker=structuredClone(marker);await s.replaceSlot('main',b);
 if(kind==='candidate slot')candidate[0].slotId='other';if(kind==='candidate system')candidate[0].table='system';if(kind==='marker table')badMarker.table='meta';
 expect(typeof s.migrateSlot).toBe('function');await expect(s.migrateSlot('main',candidate,badMarker)).rejects.toThrow('Invalid slot records');
 expect(await s.read('main')).toEqual(b);expect(await s.getSystem(marker.id)).toBeNull();
});
it.each([true,false])('fix3 memory: failed migration preserves records with meta=%s',async hasMeta=>{
 const opts={failWrites:false},s=createMemoryGameStore(opts),b=records('B');if(hasMeta)await s.replaceSlot('main',b);opts.failWrites=true;
 expect(typeof s.migrateSlot).toBe('function');await expect(s.migrateSlot('main',records('A'),marker)).rejects.toThrow('Write aborted');
 expect(await s.read('main')).toEqual(hasMeta?b:null);expect(await s.getSystem(marker.id)).toBeNull();
});
