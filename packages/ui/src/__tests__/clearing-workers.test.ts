import {expect,it,vi} from 'vitest';
import {clearOutsideWorkers} from '../clearing-workers.js';
it.each(['1.5','-1','','9007199254740992'])('rejects clearing draft %j before dispatch',raw=>{
 const oncommand=vi.fn();expect(clearOutsideWorkers(raw,'pasture-1',oncommand)).toBe('Use whole nonnegative workers.');expect(oncommand).not.toHaveBeenCalled();
});
it('dispatches an above-pool whole number for engine validation',()=>{const oncommand=vi.fn(()=>false);expect(clearOutsideWorkers(' 999 ','pasture-1',oncommand)).toBe('');expect(oncommand).toHaveBeenCalledExactlyOnceWith('CLEAR',{tileId:'pasture-1',workers:999});});
it.each([{raw:'',badInput:false},{raw:'',badInput:true},{raw:'1e',badInput:true},{raw:'0',badInput:true}])('preserves assigned workers for $raw with badInput=$badInput',({raw,badInput})=>{
 let workers=2;const oncommand=vi.fn(()=>{workers=0;return true;});expect(clearOutsideWorkers(raw,'pasture-1',oncommand,badInput)).toBe('Use whole nonnegative workers.');expect(oncommand).not.toHaveBeenCalled();expect(workers).toBe(2);
});
it('dispatches a deliberate zero to release assigned clearing workers',()=>{let workers=2;const oncommand=vi.fn((_type,fields)=>{workers=fields!.workers as number;return true;});expect(clearOutsideWorkers('0','pasture-1',oncommand,false)).toBe('');expect(oncommand).toHaveBeenCalledExactlyOnceWith('CLEAR',{tileId:'pasture-1',workers:0});expect(workers).toBe(0);});
