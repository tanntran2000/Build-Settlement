import {createCharacterLifeSession,DEFAULT_PLAYER_DRAFT,isLiveCharacterLifeSessionState} from '@haven/core';
import {expect,it} from 'vitest';
import {executeCharacterLifeCommand} from '../character-life-command.js';
function session(){const r=createCharacterLifeSession(42,{...structuredClone(DEFAULT_PLAYER_DRAFT),currentName:'Ana'});if(!r.success)throw Error(r.error.message);return r.value;}
for(const type of ['CLEAR','SET_RESEARCH','BUILD_DEEP_SHAFT']){
 it(`${type} dispatches successfully and preserves rejected and stale sessions`,()=>{
 const s=session();s.city.society!.wallRing=2;
 const inv=s.city.world.settlements[s.city.world.activeSettlementId!].inventory;inv.gold=100000;inv.wood=20000;
 s.city.society!.stocksMilli.stone=20000;
 s.city.society!.research={topic:null,paid:['deep-mining'],completed:['deep-mining'],progressMilli:{'deep-mining':8000,'watch-patrols':0,'barracks-drill':0}};
 s.city.tiles.find(t=>t.id==='ore-1')!.building={typeId:'mine',level:1,workers:0,enabled:true};
 const fields=type==='CLEAR'?{tileId:'pasture-1',workers:1}:type==='SET_RESEARCH'?{topic:null}:{tileId:'ore-1'};
 expect(isLiveCharacterLifeSessionState(s)).toBe(true);const before=structuredClone(s);
 const r=executeCharacterLifeCommand(s,{type,...fields,expectedRevision:s.city.revision});expect(r.success).toBe(true);if(r.success)expect(r.next.city.revision).toBe(s.city.revision+1);expect(s).toEqual(before);
 const stale=executeCharacterLifeCommand(s,{type,...fields,expectedRevision:s.city.revision+1});expect(stale).toMatchObject({success:false});expect(s).toEqual(before);
 const invalid=type==='CLEAR'?{tileId:'field-1',workers:1}:type==='SET_RESEARCH'?{topic:'unknown'}:{tileId:'field-1'};
 const rejected=executeCharacterLifeCommand(s,{type,...invalid,expectedRevision:s.city.revision});expect(rejected).toMatchObject({success:false});if(!rejected.success)expect(rejected.error.code).not.toBe('UNSUPPORTED_ACTION');expect(s).toEqual(before);
 });
}
