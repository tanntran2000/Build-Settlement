import {expect,it,vi} from 'vitest';
import {workerDigits,assignBuildingWorkers} from '../clearing-workers.js';
it.each([['1e','1'],['-2','2'],['1.5','15'],['abc',''],['+3','3'],['a12!b34','1234']])('filters %j to %j',(raw,expected)=>expect(workerDigits(raw)).toBe(expected));
it.each(['','9007199254740992'])('rejects building draft %j without dispatch',raw=>{const send=vi.fn();expect(assignBuildingWorkers(raw,'field-1',send)).toBe('Use whole nonnegative workers.');expect(send).not.toHaveBeenCalled();});
it('dispatches a deliberate building zero',()=>{const send=vi.fn(()=>true);expect(assignBuildingWorkers('0','field-1',send)).toBe('');expect(send).toHaveBeenCalledExactlyOnceWith('SET_WORKERS',{tileId:'field-1',workers:0});});
