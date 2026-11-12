import {expect,it,vi} from 'vitest';
import {createMemoryGameStore,sessionToRecords} from '@haven/persistence';
import {createCharacterLifeSession,DEFAULT_PLAYER_DRAFT} from '@haven/core';
import {clearFallenCharacterLifeCheckpoint,CHARACTER_LIFE_CHECKPOINT_SOCIETY_KEY as KEY} from '../character-life-session.js';
async function fixture(){
 const created=createCharacterLifeSession(0,{...structuredClone(DEFAULT_PLAYER_DRAFT),currentName:'Ana'});if(!created.success)throw Error(created.error.message);
 const store=createMemoryGameStore();await store.replaceSlot('main',sessionToRecords('main',created.value));
 const values=new Map([[KEY,'saved'],['other','protected']]);const removeItem=vi.fn((key:string)=>{values.delete(key);});
 return {store,legacy:{getItem:(key:string)=>values.get(key)??null,removeItem},values};
}
it('clears only the life slot after a confirmed fallen End Week',async()=>{const d=await fixture();const before=await d.store.read('main');for(const [success,stage] of [[false,'fallen'],[true,'none'],[true,'rebellion']] as const){expect(await clearFallenCharacterLifeCheckpoint(success,stage,d)).toEqual({success:true});expect(d.values.get(KEY)).toBe('saved');expect(await d.store.read('main')).toEqual(before);}expect(d.legacy.removeItem).not.toHaveBeenCalled();expect(await clearFallenCharacterLifeCheckpoint(true,'fallen',d)).toEqual({success:true});expect(d.legacy.removeItem.mock.calls).toEqual([[KEY]]);expect(d.values.get('other')).toBe('protected');expect(d.values.has(KEY)).toBe(false);expect(await d.store.read('main')).toBeNull();});
it('contains storage failures',async()=>{const d=await fixture();const before=await d.store.read('main');vi.spyOn(d.store,'clear').mockRejectedValue(Error('private'));expect(await clearFallenCharacterLifeCheckpoint(true,'fallen',d)).toEqual({success:false,message:'Could not clear the local checkpoint. Browser storage is unavailable.'});expect(await d.store.read('main')).toEqual(before);expect(d.values.get(KEY)).toBe('saved');});
