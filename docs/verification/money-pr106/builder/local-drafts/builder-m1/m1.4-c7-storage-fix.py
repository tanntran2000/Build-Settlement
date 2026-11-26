from pathlib import Path
p=Path('packages/ui/src/society-view.ts')
data=p.read_bytes()
nl=b'\r\n' if b'\r\n' in data else b'\n'
b=lambda t:t.encode('utf-8').replace(b'\n',nl)
def replace(old,new):
 global data
 assert data.count(b(old))==1
 data=data.replace(b(old),b(new))
replace("import { payNpcWages } from '../../simulation/src/household-week.js';",
        "import { payNpcWages } from '../../simulation/src/household-week.js';\nimport { runTileTrialWeek } from '../../simulation/src/tile-trial-week.js';")
replace("""export function forecastWorkshopOperation(city: TileTrialState, session?: CharacterLifeSessionState) {
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
 }""",
"""function workshopOpening(city: TileTrialState, session?: CharacterLifeSessionState) {
  if (!session) return { city, context: undefined };
  const opening = payNpcWages(session).session;
  return { city: opening.city, context: buildItemWeekContext(opening) };
}
export function forecastWorkshopOperation(city: TileTrialState, session?: CharacterLifeSessionState) {
  try {
    const opening = workshopOpening(city, session);
    return resolveWorkshopOperation(opening.city, opening.context);
  } catch {
    // A valid checkpoint can still exceed safe arithmetic when the week is simulated.
    return undefined;
  }
}
function staffedWarehouses(city: TileTrialState) {
  return city.tiles.filter(({ building }) =>
    building?.enabled && building.typeId === 'warehouse' && building.workers === buildingWorkerCap(building.typeId, building.level));
}
function storageCapacityMilli(city: TileTrialState, session?: CharacterLifeSessionState): number {
  const warehouses = staffedWarehouses(city);
  if (!warehouses.length) return O.storage.baseMilli;
  try {
    const opening = workshopOpening(city, session);
    const { operatingIds } = resolveWorkshopOperation(opening.city, opening.context);
    if (!warehouses.some(tile => operatingIds.has(tile.id))) return O.storage.baseMilli;

    // The week can release a funded Warehouse's workers before it caps stocks.
    const projected = structuredClone(opening.city);
    runTileTrialWeek(projected, opening.context);
    return staffedWarehouses(projected).reduce((capacity, tile) =>
      capacity + (operatingIds.has(tile.id) ? O.storage.warehousePerLevelMilli * tile.building!.level : 0),
      Number(O.storage.baseMilli));
  } catch {
    return O.storage.baseMilli;
  }
}
export function storageView(city: TileTrialState, session?: CharacterLifeSessionState) {
 const society=city.society!,settlement=city.world.settlements[city.world.activeSettlementId!],stocks=settlement.inventory;
 const capacity = storageCapacityMilli(city, session);""")
p.write_bytes(data)
