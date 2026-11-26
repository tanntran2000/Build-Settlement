from pathlib import Path
def edit(path,*pairs):
 p=Path(path); data=p.read_bytes()
 nl=b'\r\n' if b'\r\n' in data else b'\n'
 def encode(s):return s.encode('utf-8').replace(b'\n',nl)
 for old,new in pairs:
  assert data.count(encode(old))==1,(p,old)
  data=data.replace(encode(old),encode(new))
 p.write_bytes(data)
edit('packages/ui/src/society-view.ts',
 ("import { OUTSIDE_PLOTS, OUTSIDE_TRIAL as O, outsidePlot, type TileTrialReport, TILE_TRIAL_BALANCE } from '@haven/core';\nimport { FARM_MAX_BATCHES, FARM_GOLD_PER_BATCH_MILLI } from '@haven/simulation';",
  """import { buildItemWeekContext, OUTSIDE_PLOTS, OUTSIDE_TRIAL as O, outsidePlot, type CharacterLifeSessionState, type TileTrialReport } from '@haven/core';
import { resolveWorkshopOperation } from '@haven/simulation';
import { payNpcWages } from '../../simulation/src/household-week.js';"""),
 ("""export function storageView(city:TileTrialState) {
 const society=city.society!,settlement=city.world.settlements[city.world.activeSettlementId!],stocks=settlement.inventory;
 const profile=difficultyProfile(society.difficulty);
 let gold=stocks.gold+applyDifficulty(settlement.cohorts.reduce((n,c)=>n+c.count,0)*TILE_TRIAL_BALANCE.taxGoldPerResident,profile.taxBps);
 let capacity:number=O.storage.baseMilli;
 for(const tile of city.tiles){const b=tile.building;if(!b?.enabled||npcBeds(b.typeId,b.level)>0)continue;const d=TRIAL_BUILDINGS[b.typeId];
 const batches=d.operation==='farm'?Math.min(b.workers,FARM_MAX_BATCHES,Math.floor(gold/FARM_GOLD_PER_BATCH_MILLI)):0;
 const debit=Math.max(applyDifficulty(d.upkeepMilli*b.level,profile.upkeepBps),batches*FARM_GOLD_PER_BATCH_MILLI);if(gold<debit)continue;gold-=debit;
 if(b.typeId==='warehouse'&&b.workers===buildingWorkerCap(b.typeId,b.level))capacity+=O.storage.warehousePerLevelMilli*b.level;
 }""",
  """export function forecastWorkshopOperation(city: TileTrialState, session?: CharacterLifeSessionState) {
  try {
    if (!session) return resolveWorkshopOperation(city);
    const opening = payNpcWages(session).session;
    return resolveWorkshopOperation(opening.city, buildItemWeekContext(opening));
  } catch {
    // A valid checkpoint can still exceed safe arithmetic when the week is simulated.
    return undefined;
  }
}
export function storageView(city: TileTrialState, session?: CharacterLifeSessionState) {
 const society=city.society!,settlement=city.world.settlements[city.world.activeSettlementId!],stocks=settlement.inventory;
 const warehouses = city.tiles.filter(({ building }) =>
   building?.enabled && building.typeId === 'warehouse' && building.workers === buildingWorkerCap(building.typeId, building.level));
 const funded = warehouses.length ? forecastWorkshopOperation(city, session)?.operatingIds : undefined;
 let capacity: number = O.storage.baseMilli;
 for (const tile of warehouses) {
   if (funded?.has(tile.id)) capacity += O.storage.warehousePerLevelMilli * tile.building!.level;
 }"""))
edit('packages/ui/src/items-view.ts',
 ("import { resolveWorkshopOperation } from '@haven/simulation';",
  "import { resolveWorkshopOperation } from '@haven/simulation';\nimport { forecastWorkshopOperation } from './society-view.js';"),
 ("  const hospital=session.city.tiles.some(t=>t.building?.typeId==='hospital'&&potionShop(session.city,t.id));",
  """  const hospitals = session.city.tiles.filter(t => t.building?.enabled && t.building.typeId === 'hospital');
  const operation = hospitals.length ? forecastWorkshopOperation(session.city, session) : undefined;
  const hospital = hospitals.some(t => operation?.byTile[t.id]?.operating);"""))
edit('packages/ui/src/CharacterLifeShell.svelte',
 ("import { type TileTrialState, type TileTrialReport } from '@haven/core';",
  "import { type CharacterLifeSessionState, type TileTrialState, type TileTrialReport } from '@haven/core';"),
 ("  export let state: TileTrialState;",
  "  export let state: TileTrialState;\n  export let storageSession: CharacterLifeSessionState;"),
 ("{#each storageView(state) as row}", "{#each storageView(state, storageSession) as row}"))
edit('packages/ui/src/TileManagement.svelte',
 ("{state} {report} recoveryLine={healthLine({city:state,outside,npcs,player,profiles})}",
  "{state} {report} storageSession={{city:state,outside,npcs,player,profiles}} recoveryLine={healthLine({city:state,outside,npcs,player,profiles})}"))
edit('packages/ui/src/__tests__/outside-view.test.ts',
 ("expect(storageView(city).find(row => row.good === 'Wood')).toStrictEqual({ good: 'Wood', amount: 75, capacity: 80 });",
  "expect(storageView(city, session).find(row => row.good === 'Wood')).toStrictEqual({ good: 'Wood', amount: 75, capacity: 80 });"))
