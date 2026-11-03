import {expect,it,vi} from 'vitest';
import {clearOutsideWorkers} from '../clearing-workers.js';
it.each(['1.5','-1','','9007199254740992'])('rejects clearing draft %j before dispatch',raw=>{
 const oncommand=vi.fn();expect(clearOutsideWorkers(raw,'pasture-1',oncommand)).toBe('Use whole nonnegative workers.');expect(oncommand).not.toHaveBeenCalled();
});
it('dispatches an above-pool whole number for engine validation',()=>{const oncommand=vi.fn(()=>false);expect(clearOutsideWorkers(' 999 ','pasture-1',oncommand)).toBe('');expect(oncommand).toHaveBeenCalledExactlyOnceWith('CLEAR',{tileId:'pasture-1',workers:999});});
